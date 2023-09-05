const moment = require('moment');
const {
  parseEventDates, eventProposal,
} = require('../utils/event');
const {
  getAccessLevel,
} = require('../utils/accessLevel');

// Model
const User = require('../models/user');
const PersonalSchedule = require('../models/personalSchedule');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');
const UserGroup = require('../models/userGroup');

// Error
const {
  DataFormatError, ApiError,
  UserNotFoundError, ScheduleNotFoundError, GroupNotFoundError, EditPermissionError,
} = require('../errors');

// Validator
const {
  validateGroupIdSchema, validateEventProposalSchema,
  validateGroupScheduleSchema, validateScheduleDateSchema,
  validateGroupScheduleIdSchema,
} = require('../utils/validators');

async function postGroupSchedule(req, res, next) {
  try {
    const { error: bodyError } = validateGroupScheduleSchema(req.body);
    const { error: paramError } = validateGroupIdSchema(req.params);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [user, group] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      Group.findByPk(groupId),
    ]);

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || accessLevel === 'regular') {
      return next(new EditPermissionError());
    }

    const {
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

async function getSingleGroupSchedule(req, res, next) {
  try {
    const { error: paramError } = validateGroupScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId, group_id: groupId } = req.params;

    const [user, group, schedule] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      Group.findByPk(groupId),
      GroupSchedule.findByPk(scheduleId),
    ]);

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }
    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, schedule });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupSchedule(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: queryError } = validateScheduleDateSchema(req.query);
    if (paramError || queryError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [user, group] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      Group.findByPk(groupId),
    ]);

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();
    const groupEvent = await GroupSchedule.getSchedule([groupId], start, end);
    const users = (await UserGroup.findAll({
      where: {
        groupId,
        sharePersonalEvent: 1,
      },
      attributes: ['userId'],
    })).map((member) => member.userId);
    const userEvent = await PersonalSchedule.getSchedule(users, start, end);
    const schedule = {};
    schedule.nonRecurrenceSchedule = [
      ...userEvent.nonRecurrenceSchedule,
      ...groupEvent.nonRecurrenceSchedule,
    ];
    schedule.recurrenceSchedule = [
      ...userEvent.recurrenceSchedule,
      ...groupEvent.recurrenceSchedule,
    ];

    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, schedule });
  } catch (err) {
    return next(new ApiError());
  }
}

async function putGroupSchedule(req, res, next) {
  try {
    const { error: paramError } = validateGroupScheduleIdSchema(req.params);
    const { error: bodyError } = validateGroupScheduleSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId, group_id: groupId } = req.params;
    const [user, group, schedule] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      Group.findByPk(groupId),
      GroupSchedule.findByPk(scheduleId),
    ]);

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || accessLevel === 'regular') {
      return next(new EditPermissionError());
    }

    await schedule.update(req.body);
    return res.status(201).json({ message: 'Successfully modify group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroupSchedule(req, res, next) {
  try {
    const { error: paramError } = validateGroupScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId, group_id: groupId } = req.params;
    const [user, group, schedule] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      Group.findByPk(groupId),
      GroupSchedule.findByPk(scheduleId),
    ]);

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || accessLevel === 'regular') {
      return next(new EditPermissionError());
    }

    await schedule.destroy();

    return res.status(204).json({ message: 'Successfully delete group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getEventProposal(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: queryError } = validateEventProposalSchema(req.query);

    if (paramError || queryError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [user, group] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      Group.findByPk(groupId),
    ]);

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || accessLevel === 'regular') {
      return next(new EditPermissionError());
    }

    const groupMembers = (await UserGroup.findAll({
      where: {
        groupId,
        sharePersonalEvent: 1,
      },
      attributes: ['userId'],
    })).map((member) => member.userId);
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
  postGroupSchedule,
  getSingleGroupSchedule,
  getGroupSchedule,
  putGroupSchedule,
  deleteGroupSchedule,
  getEventProposal,
};
