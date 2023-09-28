const moment = require('moment');
const {
  parseEventDates, eventProposal,
} = require('../utils/event');
const {
  getAccessLevel,
} = require('../utils/accessLevel');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');
const UserGroup = require('../models/userGroup');

// Error
const {
  DataFormatError, ApiError,
  ScheduleNotFoundError, GroupNotFoundError, EditPermissionError,
} = require('../errors');

// Validator
const {
  validateGroupIdSchema, validateEventProposalSchema,
  validateScheduleSchema, validateScheduleDateSchema,
  validateGroupScheduleIdSchema,
} = require('../utils/validators');

async function postGroupSchedule(req, res, next) {
  try {
    const { error: bodyError } = validateScheduleSchema(req.body);
    const { error: paramError } = validateGroupIdSchema(req.params);

    if (paramError) {
      return next(new DataFormatError(paramError.details[0].message));
    }

    if (bodyError) {
      return next(new DataFormatError(bodyError.details[0].message));
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

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

    const groupSchedule = await GroupSchedule.create({
      groupId: group.groupId,
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
    const response = {
      ...{ message: 'Successfully create group schedule' },
      ...groupSchedule.dataValues,
    };

    return res.status(201).json(response);
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
    const { user } = req;
    const [group, schedule] = await Promise.all([
      Group.findByPk(groupId),
      GroupSchedule.findByPk(scheduleId),
    ]);

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
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();
    const groupSchedule = await GroupSchedule.getSchedule([groupId], start, end);
    const users = (await UserGroup.findAll({
      where: {
        groupId,
        shareScheduleOption: 1,
      },
      attributes: ['userId'],
    })).map((member) => member.userId);
    const userSchedule = await PersonalSchedule.getSchedule(users, start, end);
    let schedule;
    if (userSchedule.earliestDate === null) {
      schedule = { earliestDate: groupSchedule.earliestDate };
    } else if (groupSchedule.earliestDate === null) {
      schedule = { earliestDate: userSchedule.earliestDate };
    } else if (userSchedule.earliestDate > groupSchedule.earliestDate) {
      schedule = { earliestDate: groupSchedule.earliestDate };
    } else {
      schedule = { earliestDate: userSchedule.earliestDate };
    }
    schedule.nonRecurrenceSchedule = [
      ...userSchedule.nonRecurrenceSchedule,
      ...groupSchedule.nonRecurrenceSchedule,
    ];
    schedule.recurrenceSchedule = [
      ...userSchedule.recurrenceSchedule,
      ...groupSchedule.recurrenceSchedule,
    ];

    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, schedule });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupScheduleSummary(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: queryError } = validateScheduleDateSchema(req.query);
    if (paramError || queryError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();
    const groupSchedule = await GroupSchedule.getSchedule([groupId], start, end, true);
    const users = (await UserGroup.findAll({
      where: {
        groupId,
        shareScheduleOption: 1,
      },
      attributes: ['userId'],
    })).map((member) => member.userId);
    const userSchedule = await PersonalSchedule.getSchedule(users, start, end, true);
    let schedule;
    if (userSchedule.earliestDate === null) {
      schedule = { earliestDate: groupSchedule.earliestDate };
    } else if (groupSchedule.earliestDate === null) {
      schedule = { earliestDate: userSchedule.earliestDate };
    } else if (userSchedule.earliestDate > groupSchedule.earliestDate) {
      schedule = { earliestDate: groupSchedule.earliestDate };
    } else {
      schedule = { earliestDate: userSchedule.earliestDate };
    }
    schedule.nonRecurrenceSchedule = [
      ...userSchedule.nonRecurrenceSchedule,
      ...groupSchedule.nonRecurrenceSchedule,
    ];
    schedule.recurrenceSchedule = [
      ...userSchedule.recurrenceSchedule,
      ...groupSchedule.recurrenceSchedule,
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
    const { error: bodyError } = validateScheduleSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId, group_id: groupId } = req.params;
    const { user } = req;
    const [group, schedule] = await Promise.all([
      Group.findByPk(groupId),
      GroupSchedule.findByPk(scheduleId),
    ]);

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

    const modifiedSchedule = await schedule.update(req.body);
    const response = {
      ...{ message: 'Successfully modify group schedule' },
      ...modifiedSchedule.dataValues,
    };

    return res.status(201).json(response);
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
    const { user } = req;
    const [group, schedule] = await Promise.all([
      Group.findByPk(groupId),
      GroupSchedule.findByPk(scheduleId),
    ]);

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
    const { user } = req;
    const group = await Group.findByPk(groupId);

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
        shareScheduleOption: 1,
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
  getGroupScheduleSummary,
  putGroupSchedule,
  deleteGroupSchedule,
  getEventProposal,
};
