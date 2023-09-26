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
  InvalidGroupJoinError, UserIsLeaderError, NoBanPermission,
} = require('../errors');

// Validator
const {
  validateGroupSchema, validateGroupIdSchema, validatePageSchema,
  validateGroupJoinInviteCodeSchema, validateGroupJoinRequestSchema,
  validateGroupdSearchKeyword,
} = require('../utils/validators');
const { getAccessLevel } = require('../utils/accessLevel');

async function postGroup(req, res, next) {
  try {
    const { error: bodyError } = validateGroupSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const { name, description } = req.body;
    const { user } = req;
    const group = await Group.create({
      name, description, member: 1, leader: user.userId,
    });

    await user.addGroup(group, { through: { accessLevel: 'owner' } });

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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const feedCount = await Post.count({ where: { groupId } });
    const accessLevel = await getAccessLevel(user, group);
    const information = {
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      feed: feedCount,
    };

    return res.status(200).json({ accessLevel, information });
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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);

    const memberInfo = [];
    let leaderInfo;
    (await group.getUsers(({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    }))).forEach((member) => {
      const { userId, nickname } = member.dataValues;
      if (userId === group.leader) {
        leaderInfo = { userId, nickname };
      }
      memberInfo.push({ userId, nickname });
    });

    return res.status(200).json({ accessLevel, information: { group, leaderInfo, memberInfo } });
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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'owner') {
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

    const members = await group.getUsers(({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    }));
    const promises = members.map(async (member) => {
      const accessLevel = await getAccessLevel(member, group);
      return {
        accessLevel,
        member: {
          nickname: member.nickname,
          userId: member.userId,
          isPendingMember: member.UserGroup.isPendingMember,
        },
      };
    });
    const parsedMembers = await Promise.all(promises);

    return res.status(200).json(parsedMembers);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getPendingMembers(req, res, next) {
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

    const members = await group.getUsers(({
      through: {
        where: {
          isPendingMember: 1,
        },
      },
    }));
    const promises = members.map(async (member) => {
      const accessLevel = await getAccessLevel(member, group);
      return {
        accessLevel,
        member: {
          nickname: member.nickname,
          userId: member.userId,
          isPendingMember: member.UserGroup.isPendingMember,
        },
      };
    });
    const parsedMembers = await Promise.all(promises);
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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const userBelongGroup = await UserGroup.findOne({
      where: {
        userId: user.userId,
        groupId: group.groupId,
      },
    });

    if (userBelongGroup) {
      return next(new InvalidGroupJoinError());
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

    const { group_id: groupId, user_id: applicantId } = req.params;
    const { user } = req;
    const [group, applicant] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(applicantId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!applicant) {
      return next(new UserNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      return next(new UnauthorizedError());
    }

    await UserGroup.update({ isPendingMember: 0 }, { where: { userId: applicantId } });
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

    const { group_id: groupId, user_id: applicantId } = req.params;
    const { user } = req;
    const [group, applicant] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(applicantId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!applicant) {
      return next(new UserNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      return next(new UnauthorizedError());
    }

    await UserGroup.destroy({ where: { userId: applicantId } });

    return res.status(200).json({ message: 'Successfully rejected the membership request. ' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getInviteLink(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel == 'viewer') {
      return next(new UnauthorizedError());
    }

    return res.status(200).json({
      inviteCode: group.inviteCode,
      exp: group.inviteExp,
    });
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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel == 'viewer') {
      return next(new UnauthorizedError());
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
    const { error: paramError } = validateGroupJoinInviteCodeSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, inviteCode } = req.params;
    const { user } = req;
    const group = await Group.findOne({ where: { inviteCode, groupId } });

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

    const { user } = req;
    const [group, member] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(userId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!member) {
      return next(new UserNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      return next(new UnauthorizedError());
    }

    const memberAccessLevel = await getAccessLevel(member, group);
    if (memberAccessLevel === 'owner' || memberAccessLevel === 'admin') {
      return next(new NoBanPermission());
    }

    await group.removeUser(member);
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
  getPendingMembers,
  postGroupJoinRequest,
  postGroupJoinApprove,
  postGroupJoinReject,
  getInviteLink,
  postInviteLink,
  postJoinGroupWithInviteCode,
  deleteGroupMember,
  searchGroup,
};
