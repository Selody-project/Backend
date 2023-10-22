const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const bcrypt = require('bcrypt');
const { deleteBucketImage } = require('../middleware/s3');
const { getAccessLevel } = require('../utils/accessLevel');
const { sequelize } = require('../models/index');

// Model
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');

// Error
const {
  ApiError, DataFormatError, BelongToGroupError,
  DuplicateNicknameError, DuplicateEmailError, GroupNotFoundError,
  InvalidPasswordError,
} = require('../errors');

// Validator
const {
  validateProfileSchema, validateGroupIdSchema, validatePasswordSchema,
  validateUserSettingSchema, validateUserIntroductionSchema,
} = require('../utils/validators');

async function getUserGroup(req, res, next) {
  try {
    const { user } = req;
    let groups = await user.getGroups({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    });
    groups = groups.map((group) => ({
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      image: group.image,
    }));
    return res.status(200).json(groups);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getPendingGroupList(req, res, next) {
  try {
    const { user } = req;
    let pendingGroups = await user.getGroups({
      where: {
        '$UserGroup.isPendingMember$': 1,
      },
    });
    pendingGroups = pendingGroups.map((group) => ({
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      image: group.image,
    }));
    return res.status(200).json(pendingGroups);
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserProfile(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: bodyError } = validateProfileSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { nickname, email, introduction } = req.body;
    const { user } = req;

    const nicknameDuplicate = await User.findAll({
      where: { userId: { [Op.not]: user.userId }, nickname },
    });
    if (nicknameDuplicate.length !== 0) {
      throw (new DuplicateNicknameError());
    }

    const emailDuplicate = await User.findAll({
      where: { userId: { [Op.not]: user.userId }, email },
    });
    if (emailDuplicate.length !== 0) {
      throw (new DuplicateEmailError());
    }

    const previousProfileImage = [user.profileImage];
    if (req.fileUrl !== null) {
      const fileUrl = req.fileUrl.join(', ');
      await user.update({
        nickname, email, introduction, profileImage: fileUrl,
      }, { transaction });
      await deleteBucketImage(previousProfileImage);
    } else {
      await user.update({ nickname, email, introduction }, { transaction });
    }
    req.user = user;

    await transaction.commit();
    return next();
  } catch (err) {
    await transaction.rollback();

    await deleteBucketImage(req.fileUrl);
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function patchUserPassword(req, res, next) {
  try {
    const { error: bodyError } = validatePasswordSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { currentPassword, newPassword } = req.body;
    const { user } = req;

    const result = await bcrypt.compare(currentPassword, user.password);
    if (!result) {
      throw (new InvalidPasswordError());
    }

    await user.update({
      password: await bcrypt.hash(newPassword, 12),
    });

    return res.status(200).end();
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function withdrawal(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { user } = req;
    const groupList = await user.getGroups();
    if (groupList != 0) {
      throw (new BelongToGroupError());
    }

    const previousProfileImage = [user.profileImage];
    await PersonalSchedule.destroy({ where: { userId: user.userId } }, { transaction });
    await user.destroy({ transaction });
    await deleteBucketImage(previousProfileImage);

    await transaction.commit();
    return res.status(204).json({ message: '성공적으로 탈퇴되었습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getUserSetup(req, res, next) {
  try {
    const { user } = req;
    const options = await User.findAll({
      attributes: ['userId'],
      include: [
        {
          model: Group,
          through: {
            attributes: ['shareScheduleOption', 'notificationOption'],
          },
          attributes: ['groupId', 'name'],
        },
      ],
      where: { userId: user.userId },
    });
    const parsedOptions = await Promise.all(
      options[0].Groups.map(async (option) => {
        const accessLevel = await getAccessLevel(user, option.dataValues);
        return {
          groupId: option.dataValues.groupId,
          name: option.dataValues.name,
          shareScheduleOption: option.UserGroup.dataValues.shareScheduleOption,
          notificationOption: option.UserGroup.dataValues.notificationOption,
          accessLevel,
        };
      }),
    );
    return res.status(200).json(parsedOptions);
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserSetUp(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: bodyError } = validateUserSettingSchema(req.body);
    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { user } = req;
    const { group_id: groupId } = req.params;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    await UserGroup.update(req.body, { where: { userId: user.userId, groupId } });

    return res.status(200).json({ message: '성공적으로 수정되었습니다.' });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function patchIntroduction(req, res, next) {
  try {
    const { error: bodyError } = validateUserIntroductionSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { user } = req;

    const modifiedUser = await user.update(req.body);

    return res.status(200).json({
      message: '성공적으로 수정되었습니다.',
      introduction: modifiedUser.introduction,
    });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

module.exports = {
  getUserGroup,
  getPendingGroupList,
  patchUserProfile,
  patchUserPassword,
  withdrawal,
  getUserSetup,
  patchUserSetUp,
  patchIntroduction,
};
