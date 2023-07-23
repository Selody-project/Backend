const moment = require('moment');
const { parseEventDates, eventProposal } = require('../utils/event');

const User = require('../models/user');
const PersonalSchedule = require('../models/personalSchedule');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');

const ApiError = require('../errors/apiError');
const DataFormatError = require('../errors/DataFormatError');
const ExpiredCodeError = require('../errors/group/ExpiredCodeError');
const InvalidGroupJoinError = require('../errors/group/InvalidGroupJoinError');
const {
  UserNotFoundError, UnathroizedError, ScheduleNotFoundError, GroupNotFoundError,
} = require('../errors');

const {
  validateGroupSchema, validateGroupIdSchema, validateEventProposalSchema,
  validateScheduleIdSchema, validateGroupScheduleSchema, validateScheduleDateScehma,
} = require('../utils/validators');

async function createGroup(req, res, next) {
  try {
    const { error } = validateGroupSchema(req.body);
    if (error) return next(new DataFormatError());
    const { nickname } = req;
    const { name } = req.body;
    const user = await User.findOne({ where: { nickname } });
    const group = await Group.create({ name, member: 1, leader: user.userId });
    await user.addGroup(group);
    return res.status(200).json({ message: 'Successfully create group' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupList(req, res, next) {
  try {
    const { nickname } = req;
    const user = await User.findOne({ where: { nickname } });
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroup(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { id } = req.params;
    const group = await Group.findByPk(id);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return next(new UserNotFoundError());
    }

    if (group.leader !== user.userId) {
      return next(new UnathroizedError());
    }

    await group.destroy();
    return res.status(204).json({ message: 'Successfully delete group' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchGroup(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { id } = req.params;
    const { newLeaderId } = req.body;
    const group = await Group.findByPk(id);
    if (!group) {
      return next(new GroupNotFoundError());
    }

    group.leader = newLeaderId;
    await group.save();

    return res.status(200).json({ message: 'Successfully update group leader' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroupUser(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return next(new UserNotFoundError());
    }
    const { userId } = user;
    const { id: groupId } = req.params;

    const group = await Group.findByPk(groupId);
    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (group.leader === userId) {
      return next(new UnathroizedError());
    }

    await UserGroup.destroy({
      where: {
        userId, groupId,
      },
    });

    await Group.update(
      { where: groupId },
      { member: group.member - 1 },
    );

    return res.status(204).json({ message: 'Successfully delete group user' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { id: groupId } = req.params;
    const group = await Group.findByPk(groupId);
    if (!group) {
      return next(new GroupNotFoundError());
    }

    const { error: queryError } = validateScheduleDateScehma(req.query);
    if (queryError) return next(new DataFormatError());

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();
    const groupEvent = await GroupSchedule.getSchedule([groupId], start, end);
    const users = (await group.getUsers()).map((user) => user.userId);
    const userEvent = await PersonalSchedule.getSchedule(users, start, end);
    const event = {};
    event.nonRecurrenceSchedule = [
      ...userEvent.nonRecurrenceSchedule,
      ...groupEvent.nonRecurrenceSchedule,
    ];
    event.recurrenceSchedule = [
      ...userEvent.recurrenceSchedule,
      ...groupEvent.recurrenceSchedule,
    ];
    return res.status(200).json(event);
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupSchedule(req, res, next) {
  try {
    const { error } = validateGroupScheduleSchema(req.body);
    if (error) return next(new DataFormatError());

    const {
      groupId,
      title,
      content,
      startDateTime,
      endDateTime,
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    } = req.body;

    await GroupSchedule.create({
      groupId,
      title,
      content,
      startDateTime,
      endDateTime,
      recurrence,
      freq,
      interval,
      byweekday,
      until,
      possible: null,
      impossible: null,
    });
    return res.status(201).json({ message: 'Successfully create group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function putGroupSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) return next(new DataFormatError());

    const { error: bodyError } = validateGroupScheduleSchema(req.body);
    if (bodyError) return next(new DataFormatError());

    const { id } = req.params;
    const schedule = await GroupSchedule.findOne({ where: { id } });

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    await GroupSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully modify group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroupSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { id } = req.params;
    const schedule = await GroupSchedule.findOne({ where: { id } });

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    await schedule.destroy();

    return res.status(204).json({ message: 'Successfully delete group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postInviteLink(req, res, next) {
  try {
    const { error } = validateGroupIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { group_id: groupId } = req.params;
    const group = await Group.findOne({ where: { groupId } });

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
    const { error } = validateGroupSchema(req.params);
    if (error) return next(new DataFormatError());

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
    const { error } = validateGroupSchema(req.params);
    if (error) return next(new DataFormatError());

    const { inviteCode } = req.params;
    const group = await Group.findOne({ where: { inviteCode } });
    if (!group) {
      return next(new GroupNotFoundError());
    }
    if (group.inviteExp < new Date()) {
      return next(new ExpiredCodeError());
    }

    const { nickname } = req;
    const user = await User.findOne({ where: { nickname } });
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

async function getEventProposal(req, res, next) {
  try {
    const { error: queryError } = validateEventProposalSchema(req.query);
    if (queryError) return next(new DataFormatError());

    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) return next(new DataFormatError());

    const { group_id: groupId } = req.params;
    const group = await Group.findOne({ where: { groupId } });
    const groupMembers = (await group.getUsers()).map((user) => user.userId);
    const proposal = {};

    /* eslint-disable no-restricted-syntax */
    for (const date of Object.values(req.query)) {
      let events = [];
      const start = moment.utc(date).toDate();
      const end = moment.utc(date).add(24, 'hours').add(-1, 's').toDate();
      const {
        nonRecurrenceSchedule: userNonRecEvent,
        recurrenceSchedule: userRecEvent,
        /* eslint-disable-next-line no-await-in-loop */
      } = await PersonalSchedule.getSchedule(groupMembers, start, end);
      events.push(parseEventDates(userNonRecEvent, userRecEvent));
      const {
        nonRecurrenceSchedule: groupNonRecEvent,
        recurrenceSchedule: groupRecEvent,
        /* eslint-disable-next-line no-await-in-loop */
      } = await GroupSchedule.getSchedule([groupId], start, end);
      events.push(parseEventDates(groupNonRecEvent, groupRecEvent));
      events = events.flat(1);
      events.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

      // 결과값에서 9시~22시 사이의 값들을 먼저 추천할 수 있도록 정렬.
      const result = eventProposal(events, start, end);
      const filteredTimes = result.filter((event) => (
        event.startDateTime.getTime() < (end.getTime() - 1000 * 60 * 60 * 2)
          && event.endDateTime.getTime() > (start.getTime() + 1000 * 60 * 60 * 9)
      ));
      const remainingTimes = result.filter((event) => (
        event.startDateTime.getTime() >= (end.getTime() - 1000 * 60 * 60 * 2)
          || event.endDateTime.getTime() <= (start.getTime() + 1000 * 60 * 60 * 9)
      ));
      const sortedResult = filteredTimes.concat(remainingTimes);
      proposal[date] = sortedResult;
    }
    return res.status(200).json(proposal);
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  createGroup,
  getGroupList,
  deleteGroup,
  patchGroup,
  deleteGroupUser,
  getGroupSchedule,
  postGroupSchedule,
  putGroupSchedule,
  deleteGroupSchedule,
  postInviteLink,
  getInvitation,
  postGroupJoin,
  getEventProposal,
};
