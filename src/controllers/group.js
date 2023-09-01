const { Op } = require('sequelize');

// Model
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');
const Post = require('../models/post');

// Error
const {
  DataFormatError, ApiError,
  UserNotFoundError, GroupNotFoundError,
  UnauthorizedError, ExpiredCodeError,
  InvalidGroupJoinError, UserIsLeaderError,
} = require('../errors');

// Validator
const {
  validateGroupSchema, validateGroupIdSchema, validatePageSchema,
  validateGroupJoinParamSchema, validateGroupJoinRequestSchema,
  validateGroupdSearchKeyword,
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

    const { name, description } = req.body;
    const group = await Group.create({
      name, description, member: 1, leader: user.userId,
    });

    await user.addGroup(group);

    return res.status(200).json({ message: 'Successfully create group' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupInfo(req, res, next) {
  try {
    const { error } = validateGroupIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { group_id: groupId } = req.params;

    const group = await Group.findByPk(groupId);
    if (!group) {
      return next(new GroupNotFoundError());
    }

    const feedCount = await Post.count({ where: { groupId } });
    const parsedGroupInfo = {
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      feed: feedCount,
    };

    return res.status(200).json(parsedGroupInfo);
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
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
    }));
    return res.status(200).json(result);
  } catch {
    return next(new ApiError());
  }
}

async function putGroup(req, res, next) {
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

    if (group.leader != user.userId) {
      return next(new UnauthorizedError());
    }

    const { name, description, leader } = req.body;
    await group.update({ name, description, leader });

    return res.status(200).json({ message: 'Successfully modified group info' });
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

async function getGroupMembers(req, res, next) {
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

    const members = await group.getUsers();
    const parsedMembers = members.map((member) => ({
      nickname: member.nickname,
      userId: member.userId,
      isPendingMember: member.UserGroup.isPendingMember,
    }));

    return res.status(200).json(parsedMembers);
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupJoinRequest(req, res, next) {
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

    await group.addUser(user, { through: { isPendingMember: 1 } });

    return res.status(200).json({ message: 'Successfully completed the application for registration. ' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupJoinApprove(req, res, next) {
  try {
    const { error: paramError } = validateGroupJoinRequestSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, user_id: userId } = req.params;

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

    await UserGroup.update({ isPendingMember: 0 }, { where: { userId } });
    await group.update({ member: (group.member + 1) });

    return res.status(200).json({ message: 'Successfully approved the membership registration. ' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupJoinReject(req, res, next) {
  try {
    const { error: paramError } = validateGroupJoinRequestSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, user_id: userId } = req.params;

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

    await UserGroup.destroy({ where: { userId } });

    return res.status(200).json({ message: 'Successfully rejected the membership request. ' });
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

async function postJoinGroupWithInviteCode(req, res, next) {
  try {
    const { error: paramError } = validateGroupJoinParamSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, inviteCode } = req.params;
    const [group, user] = await Promise.all([
      Group.findOne({ where: { inviteCode, groupId } }),
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

async function deleteGroupMember(req, res, next) {
  try {
    const { error: paramError } = validateGroupJoinRequestSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, user_id: userId } = req.params;

    const [group, user, leader] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(userId),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (leader.userId != group.leader) {
      return next(new UnauthorizedError());
    }

    await group.removeUser(user);
    await group.update({ member: (group.member - 1) });

    return res.status(204).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function searchGroup(req, res, next) {
  try {
    const { error: queryError } = validateGroupdSearchKeyword(req.query);
    if (queryError) {
      return next(new DataFormatError());
    }

    const { keyword } = req.query;

    const group = await Group.findAll({
      where: {
        name: {
          [Op.like]: `%${keyword}%`,
        },
      },
    });

    if (!group || group.length == 0) {
      return next(new GroupNotFoundError());
    }

    return res.status(200).json(group);
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  postGroup,
  getGroupList,
  getGroupInfo,
  getGroupDetail,
  deleteGroup,
  putGroup,
  deleteGroupUser,
  getGroupMembers,
  postGroupJoinRequest,
  postGroupJoinApprove,
  postGroupJoinReject,
  postInviteLink,
  postJoinGroupWithInviteCode,
  deleteGroupMember,
  searchGroup,
};
