// Model
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');

// Error
const {
  DataFormatError, ApiError,
  UserNotFoundError, GroupNotFoundError,
  UnauthorizedError, EditPermissionError,
  ExpiredCodeError, InvalidGroupJoinError, UserIsLeaderError,
} = require('../errors');

// Validator
const {
  validateGroupSchema, validateGroupIdSchema, validatePageSchema,
} = require('../utils/validators');

async function postGroup(req, res, next) {
  try {
    const { error: bodyError } = validateGroupSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return (new UserNotFoundError());
    }

    const { name } = req.body;
    const group = await Group.create({
      name, member: 1, leader: user.userId,
    });

    await user.addGroup(group);

    return res.status(200).json({ message: 'Successfully create group' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupDetail(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const group = await Group.findByPk(groupId);
    if (!group) {
      return next(new GroupNotFoundError());
    }

    const memberInfo = [];
    let leaderInfo;
    (await group.getUsers()).forEach((user) => {
      const { userId, nickname } = user.dataValues;
      if (userId === group.leader) {
        leaderInfo = { userId, nickname };
      }
      memberInfo.push({ userId, nickname });
    });

    return res.status(200).json({ group, leaderInfo, memberInfo });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupList(req, res, next) {
  try {
    const { error: queryError } = validatePageSchema(req.query);
    if (queryError) {
      return next(new DataFormatError());
    }

    const { page } = req.query;
    const pageSize = 9;
    const startIndex = (page - 1) * pageSize;
    const { rows } = await Group.findAndCountAll({
      offset: startIndex,
      limit: pageSize,
    });
    const result = rows.map((group) => ({
      name: group.name,
      member: group.member,
    }));
    return res.status(200).json(result);
  } catch {
    return next(new ApiError());
  }
}

async function patchGroup(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [group, user] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (group.leader !== user.userId) {
      return next(new EditPermissionError());
    }

    const { newLeaderId } = req.body;
    group.leader = newLeaderId;
    await group.save();

    return res.status(200).json({ message: 'Successfully update group leader' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroup(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [group, user] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (group.leader !== user.userId) {
      return next(new UnauthorizedError());
    }

    await group.destroy();
    return res.status(204).json({ message: 'Successfully delete group' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroupUser(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [group, user] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);
    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (group.leader === user.userId) {
      return next(new UserIsLeaderError());
    }

    await UserGroup.destroy({
      where: {
        userId: user.userId,
        groupId,
      },
    });

    await group.update({ member: group.member - 1 });

    return res.status(204).json({ message: 'Successfully delete group user' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postInviteLink(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeLength = 12;
    let inviteCode = '';
    let duplicate = null;

    while (true) {
      inviteCode = '';
      for (let i = 0; i < codeLength; i += 1) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        inviteCode += characters.charAt(randomIndex);
      }
      // eslint-disable-next-line no-await-in-loop
      duplicate = await Group.findOne({ where: { inviteCode } });
      if (!duplicate) {
        break;
      }
    }
    const inviteExp = new Date();
    inviteExp.setDate(new Date().getDate() + 1);
    await group.update({ inviteCode, inviteExp });
    return res.status(200).json({
      inviteCode,
      exp: inviteExp,
    });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getInvitation(req, res, next) {
  try {
    const { error: paramError } = validateGroupSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { inviteCode } = req.params;
    const group = await Group.findOne({ where: { inviteCode } });
    if (!group) {
      return next(new GroupNotFoundError());
    }
    if (group.inviteExp < new Date()) {
      return next(new ExpiredCodeError());
    }

    return res.status(200).json({ group });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupJoin(req, res, next) {
  try {
    const { error: paramError } = validateGroupSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { inviteCode } = req.params;
    const [group, user] = await Promise.all([
      Group.findOne({ where: { inviteCode } }),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }
    if (group.inviteExp < new Date()) {
      return next(new ExpiredCodeError());
    }

    if (await user.hasGroup(group)) {
      return next(new InvalidGroupJoinError());
    }

    await user.addGroup(group);
    await group.update({ member: (group.member + 1) });

    return res.status(200).json({ message: 'Successfully joined the group.' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  postGroup,
  getGroupList,
  getGroupDetail,
  patchGroup,
  deleteGroup,
  deleteGroupUser,
  postInviteLink,
  getInvitation,
  postGroupJoin,
};
