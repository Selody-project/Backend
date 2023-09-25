const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const bcrypt = require('bcrypt');
const { deleteBucketImage } = require('../middleware/s3');

// Model
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');

// Error
const {
  ApiError, DataFormatError,
  UserIsLeaderError, BelongToGroupError,
  DuplicateNicknameError, DuplicateEmailError,
  EditPermissionError, GroupNotFoundError,
} = require('../errors');

// Validator
const {
  validateProfileSchema, validateGroupIdSchema, validatePasswordSchema,
  validateUserSettingSchema,
} = require('../utils/validators');

async function getUserGroup(req, res, next) {
  try {
    const { user } = req;
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserProfile(req, res, next) {
  try {
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: bodyError } = validateProfileSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { nickname, email } = req.body;
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
      await user.update({ nickname, email, profileImage: fileUrl });
      await deleteBucketImage(previousProfileImage);
    } else {
      await user.update({ nickname, email });
    }
    req.user = user;
    return next();
  } catch (err) {
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
      return next(new DataFormatError());
    }

    const { password } = req.body;
    const { user } = req;

    await user.update({
      password: await bcrypt.hash(password, 12),
    });

    return res.status(200).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function withdrawal(req, res, next) {
  try {
    const { user } = req;
    const leader = await Group.findOne({ where: { leader: user.userId } });

    if (leader) {
      return next(new UserIsLeaderError());
    }

    const groupList = await user.getGroups();
    if (groupList != 0) {
      return next(new BelongToGroupError());
    }

    const previousProfileImage = [user.profileImage];
    await PersonalSchedule.destroy({ where: { userId: user.userId } });
    await user.destroy();
    await deleteBucketImage(previousProfileImage);

    return res.status(204).json({ message: 'Successfully deleted' });
  } catch (err) {
    return next(new ApiError());
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
    const parsedOptions = options[0].Groups.map((option) => ({
      groupId: option.dataValues.groupId,
      name: option.dataValues.name,
      shareScheduleOption: option.UserGroup.dataValues.shareScheduleOption,
      notificationOption: option.UserGroup.dataValues.notificationOption,
    }));
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
      return next(new DataFormatError());
    }

    const { user } = req;
    const { group_id: groupId } = req.params;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!(await user.hasGroup(group))) {
      return next(new EditPermissionError());
    }

    await UserGroup.update(req.body, { where: { userId: user.userId, groupId } });

    return res.status(200).json({ message: 'Successfully modified a setting ' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  getUserGroup,
  patchUserProfile,
  patchUserPassword,
  withdrawal,
  getUserSetup,
  patchUserSetUp,
};
