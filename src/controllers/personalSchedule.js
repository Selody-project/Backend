const moment = require('moment');
const { isMine } = require('../utils/accessLevel');
const { getScheduleResponse } = require('../utils/rrule');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');

// Error
const {
  ApiError, DataFormatError,
  ScheduleNotFoundError, NotFoundError,
  EditPermissionError,
} = require('../errors');

// Validator
const {
  validateScheduleIdSchema, validateScheduleDateSchema, validateScheduleSchema,
} = require('../utils/validators');

async function postPersonalSchedule(req, res, next) {
  try {
    const { error: bodyError } = validateScheduleSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError(bodyError.details[0].message));
    }

    const { user } = req;

    const {
      requestStartDateTime, requestEndDateTime,
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    const schedule = await PersonalSchedule.create({
      userId: user.userId,
      title,
      content,
      startDateTime,
      endDateTime,
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    });

    const response = await getScheduleResponse(requestStartDateTime, requestEndDateTime, schedule.dataValues);

    return res.status(201).json(response);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getSingleUserSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const { user } = req;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    if (!isMine(user, schedule)) {
      return next(new EditPermissionError());
    }

    return res.status(200).json(schedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserPersonalSchedule(req, res, next) {
  try {
    const { error: queryError } = validateScheduleDateSchema(req.query);
    if (queryError) {
      return next(new DataFormatError());
    }

    const { user } = req;

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();

    const userSchedule = await PersonalSchedule.getSchedule([user.userId], start, end);
    const groups = (await user.getGroups(
      {
        through: {
          where: {
            isPendingMember: 0,
          },
        },
      },
    )
    ).map((group) => group.groupId);
    if (groups.length) {
      const groupSchedule = await GroupSchedule.getSchedule(groups, start, end);
      const response = {};
      response.schedules = [
        ...userSchedule.schedules,
        ...groupSchedule.schedules,
      ];
      return res.status(200).json(response);
    }
    return res.status(200).json(userSchedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserPersonalScheduleSummary(req, res, next) {
  try {
    const { error: queryError } = validateScheduleDateSchema(req.query);
    if (queryError) {
      return next(new DataFormatError());
    }

    const { user } = req;

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();

    const userSchedule = await PersonalSchedule.getSchedule([user.userId], start, end, true);
    const groups = (await user.getGroups(
      {
        through: {
          where: {
            isPendingMember: 0,
          },
        },
      },
    )
    ).map((group) => group.groupId);
    if (groups.length) {
      const groupSchedule = await GroupSchedule.getSchedule(groups, start, end, true);
      let response;
      if (userSchedule.earliestDate === null) {
        response = { earliestDate: groupSchedule.earliestDate };
      } else if (groupSchedule.earliestDate === null) {
        response = { earliestDate: userSchedule.earliestDate };
      } else if (userSchedule.earliestDate > groupSchedule.earliestDate) {
        response = { earliestDate: groupSchedule.earliestDate };
      } else {
        response = { earliestDate: userSchedule.earliestDate };
      }
      response.schedules = [
        ...userSchedule.schedules,
        ...groupSchedule.schedules,
      ];
      return res.status(200).json(response);
    }
    return res.status(200).json(userSchedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function putPersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    const { error: bodyError } = validateScheduleSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const { user } = req;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    if (!isMine(user, schedule)) {
      return next(new EditPermissionError());
    }

    const {
      requestStartDateTime, requestEndDateTime,
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    await PersonalSchedule.update({
      title,
      content,
      startDateTime,
      endDateTime,
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    }, { where: { id: scheduleId } });

    const modifiedSchedule = await PersonalSchedule.findByPk(scheduleId);

    const response = await getScheduleResponse(requestStartDateTime, requestEndDateTime, modifiedSchedule.dataValues);

    return res.status(201).json(response);
  } catch (err) {
    return next(new ApiError());
  }
}

async function deletePersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const { user } = req;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new NotFoundError());
    }

    if (!isMine(user, schedule)) {
      return next(new EditPermissionError());
    }

    await schedule.destroy();

    return res.status(204).json({ message: '성공적으로 삭제되었습니다.' });
  } catch (err) {
    return next(new ApiError());
  }
}
module.exports = {
  postPersonalSchedule,
  getSingleUserSchedule,
  getUserPersonalSchedule,
  getUserPersonalScheduleSummary,
  putPersonalSchedule,
  deletePersonalSchedule,
};
