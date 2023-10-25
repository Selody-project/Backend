const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const { deleteBucketImage } = require('../middleware/s3');
const { sequelize } = require('../models/index');

const maxGroupCount = 50;

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
  InvalidGroupJoinError, UserIsLeaderError, NoBanPermission, EditPermissionError,
  ExceedGroupCountError,
} = require('../errors');

// Validator
const {
  validateGroupSchema, validateGroupIdSchema, validateLastRecordIdSchema,
  validateGroupJoinInviteCodeSchema, validateGroupJoinRequestSchema,
  validateGroupdSearchKeyword, validateGroupInviteCodeSchema,
  validateGroupMemberSchema, validateAccessLevelSchema,
} = require('../utils/validators');
const { getAccessLevel } = require('../utils/accessLevel');

async function postGroup(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: bodyError } = validateGroupSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { name, description } = req.body;
    const { user } = req;

    const groupCount = await user.countGroups();
    if (groupCount >= maxGroupCount) {
      throw (new ExceedGroupCountError());
    }

    let group;
    if (req.fileUrl !== null) {
      const fileUrl = req.fileUrl.join(', ');
      group = await Group.create({
        name, description, member: 1, leader: user.userId, image: fileUrl,
      }, { transaction });
    } else {
      group = await Group.create({
        name, description, member: 1, leader: user.userId, image: process.env.DEFAULT_GROUP_IMAGE,
      }, { transaction });
    }

    await user.addGroup(group, { through: { accessLevel: 'owner' }, transaction });

    const response = {
      ...{ message: '성공적으로 생성되었습니다.' },
      ...group.dataValues,
    };

    await transaction.commit();
    return res.status(200).json(response);
  } catch (err) {
    await transaction.rollback();
    await deleteBucketImage(req.fileUrl);

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getGroupDetail(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    group.dataValues.feedCount = await Post.count({ where: { groupId } });
    const accessLevel = await getAccessLevel(user, group);

    const memberInfo = [];
    let leaderInfo;
    (await group.getUsers({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    })).forEach((member) => {
      const { userId, nickname } = member.dataValues;
      if (userId === group.leader) {
        leaderInfo = { userId, nickname };
      }
      memberInfo.push({ userId, nickname });
    });
    const response = { accessLevel, information: { group, leaderInfo, memberInfo } };
    return res.status(200).json(response);
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getGroupList(req, res, next) {
  try {
    const { error: queryError } = validateLastRecordIdSchema(req.query);
    if (queryError) {
      throw (new DataFormatError());
    }

    let { last_record_id: lastRecordId } = req.query;
    if (lastRecordId == 0) {
      lastRecordId = Number.MAX_SAFE_INTEGER;
    }

    const pageSize = 9;
    let groups = await Group.findAll({
      where: {
        groupId: { [Sequelize.Op.lt]: lastRecordId },
      },
      limit: pageSize,
      order: [['groupId', 'DESC']],
    });
    let isEnd;
    if (groups.length < pageSize) {
      isEnd = true;
    } else {
      isEnd = false;
    }
    groups = groups.map((group) => ({
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      image: group.image,
    }));
    return res.status(200).json({ isEnd, groups });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function putGroup(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      throw (new UnauthorizedError());
    }

    const { name, description } = req.body;
    const previousGroupImage = [group.image];
    let modifiedGroup;
    if (req.fileUrl !== null) {
      const fileUrl = req.fileUrl.join(', ');
      modifiedGroup = await group.update({ name, description, image: fileUrl }, { transaction });
      await deleteBucketImage(previousGroupImage);
    } else {
      modifiedGroup = await group.update({ name, description }, { transaction });
    }

    const response = {
      ...{ message: '성공적으로 수정되었습니다.' },
      ...modifiedGroup.dataValues,
    };

    await transaction.commit();
    return res.status(200).json(response);
  } catch (err) {
    await transaction.rollback();
    await deleteBucketImage(req.fileUrl);

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function deleteGroup(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      throw (new UnauthorizedError());
    }

    const previousGroupImage = [group.image];
    await group.destroy({ transaction });
    await deleteBucketImage(previousGroupImage);

    await transaction.commit();
    return res.status(204).json({ message: '성공적으로 삭제되었습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function deleteGroupUser(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'owner') {
      throw (new UserIsLeaderError());
    }

    await UserGroup.destroy({
      where: {
        userId: user.userId,
        groupId,
      },
      transaction,
    });

    await group.update({ member: group.member - 1 }, { transaction });

    await transaction.commit();
    return res.status(204).json({ message: '성공적으로 추방하였습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getGroupMembers(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const members = await group.getUsers({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    });
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
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getPendingMembers(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const members = await group.getUsers({
      through: {
        where: {
          isPendingMember: 1,
        },
      },
    });
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
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function postGroupJoinRequest(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const groupCount = await user.countGroups();
    if (groupCount >= maxGroupCount) {
      throw (new ExceedGroupCountError());
    }

    const userBelongGroup = await UserGroup.findOne({
      where: {
        userId: user.userId,
        groupId: group.groupId,
      },
    });

    if (userBelongGroup) {
      throw (new InvalidGroupJoinError());
    }

    await group.addUser(user, { through: { isPendingMember: 1 }, transaction });

    await transaction.commit();
    return res.status(200).json({ message: '성공적으로 신청되었습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function postGroupJoinApprove(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupJoinRequestSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, user_id: applicantId } = req.params;
    const { user } = req;
    const [group, applicant] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(applicantId),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!applicant) {
      throw (new UserNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      throw (new UnauthorizedError());
    }

    await UserGroup.update({ isPendingMember: 0 }, { where: { userId: applicantId }, transaction });
    await group.update({ member: (group.member + 1) }, { transaction });

    await transaction.commit();
    return res.status(200).json({ message: '성공적으로 수락하였습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function postGroupJoinReject(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupJoinRequestSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, user_id: applicantId } = req.params;
    const { user } = req;
    const [group, applicant] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(applicantId),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!applicant) {
      throw (new UserNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      throw (new UnauthorizedError());
    }

    await UserGroup.destroy({ where: { userId: applicantId }, transaction });

    await transaction.commit();
    return res.status(200).json({ message: '성공적으로 거절하였습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getInviteLink(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel == 'viewer') {
      throw (new UnauthorizedError());
    }

    return res.status(200).json({
      inviteCode: group.inviteCode,
      exp: group.inviteExp,
    });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function postInviteLink(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel == 'viewer') {
      throw (new UnauthorizedError());
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
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getGroupPreviewWithInviteCode(req, res, next) {
  try {
    const { error: paramError } = validateGroupInviteCodeSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { inviteCode } = req.params;
    const group = await Group.findOne({ where: { inviteCode } });

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (group.inviteExp < new Date()) {
      throw (new ExpiredCodeError());
    }

    return res.status(200).json({
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      image: group.image,
    });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function postJoinGroupWithInviteCode(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupJoinInviteCodeSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, inviteCode } = req.params;
    const { user } = req;
    const group = await Group.findOne({ where: { inviteCode, groupId } });

    if (!group) {
      throw (new GroupNotFoundError());
    }
    if (group.inviteExp < new Date()) {
      throw (new ExpiredCodeError());
    }
    const userGroup = await UserGroup.findOne({ where: { userId: user.userId, groupId: group.groupId }, transaction });
    if (userGroup?.isPendingMember === 0) {
      throw (new InvalidGroupJoinError());
    }
    if (userGroup?.isPendingMember === 1) {
      await userGroup.update({ isPendingMember: 1 }, { transaction });
    } else {
      const groupCount = await user.countGroups();
      if (groupCount >= maxGroupCount) {
        throw (new ExceedGroupCountError());
      }
      await user.addGroup(group, { transaction });
      await group.update({ member: (group.member + 1) }, { transaction });
    }

    await transaction.commit();
    return res.status(200).json({ message: '성공적으로 가입되었습니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function deleteGroupMember(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupJoinRequestSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, user_id: userId } = req.params;

    const { user } = req;
    const [group, member] = await Promise.all([
      Group.findByPk(groupId),
      User.findByPk(userId),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!member) {
      throw (new UserNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel !== 'owner') {
      throw (new UnauthorizedError());
    }

    const memberAccessLevel = await getAccessLevel(member, group);
    if (memberAccessLevel === 'owner' || memberAccessLevel === 'admin') {
      throw (new NoBanPermission());
    }

    await group.removeUser(member, { transaction });
    await group.update({ member: (group.member - 1) }, { transaction });

    await transaction.commit();
    return res.status(204).end();
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function searchGroup(req, res, next) {
  try {
    const { error: queryError } = validateGroupdSearchKeyword(req.query);
    if (queryError) {
      throw (new DataFormatError());
    }

    const { keyword } = req.query;
    let { last_record_id: lastRecordId } = req.query;

    if (lastRecordId == 0) {
      lastRecordId = Number.MAX_SAFE_INTEGER;
    }

    const pageSize = 9;

    let groups = await Group.findAll({
      where: {
        name: {
          [Op.like]: `%${keyword}%`,
        },
        groupId: { [Sequelize.Op.lt]: lastRecordId },
      },
      limit: pageSize,
      order: [['groupId', 'DESC']],
    });
    let isEnd;
    if (groups.length < pageSize) {
      isEnd = true;
    } else {
      isEnd = false;
    }

    groups = groups.map((group) => ({
      groupId: group.groupId,
      name: group.name,
      description: group.description,
      member: group.member,
      image: group.image,
    }));

    return res.status(200).json({ isEnd, groups });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function patchUserAccessLevel(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateGroupMemberSchema(req.params);
    const { error: bodyError } = validateAccessLevelSchema(req.body);
    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, user_id: userId } = req.params;
    const { user } = req;
    const [group, member] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({
        where: {
          userId,
        },
        include: [
          {
            model: UserGroup,
            attributes: ['userId', 'groupId', 'accessLevel'],
            where: {
              userId,
              groupId,
            },
          },
        ],
      }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }
    if (!member) {
      throw (new UserNotFoundError());
    }

    const userAccessLevel = await getAccessLevel(user, group);
    if (userAccessLevel !== 'owner') {
      throw (new EditPermissionError());
    }

    const { access_level: accessLevel } = req.body;
    if (accessLevel === 'owner') {
      user.accessLevel = 'regular';
      await user.save({ transaction });
    }
    const userGroup = member.UserGroups[0];
    if (userGroup) {
      userGroup.accessLevel = accessLevel;
      await userGroup.save({ transaction });
    }

    await transaction.commit();
    return res.status(204).end();
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

module.exports = {
  postGroup,
  getGroupList,
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
  getGroupPreviewWithInviteCode,
  postJoinGroupWithInviteCode,
  deleteGroupMember,
  searchGroup,
  patchUserAccessLevel,
};
