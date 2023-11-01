const moment = require('moment');
const { getScheduleResponse } = require('../utils/rrule');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');

// Error
const {
  ApiError, DataFormatError,
  ScheduleNotFoundError, NotFoundError,
} = require('../errors');

// Validator
const {
  validateScheduleIdSchema, validateScheduleDateSchema, validateScheduleSchema,
} = require('../utils/validators');

// 개인 일정 등록
async function postPersonalSchedule(req, res, next) {
  try {
    const { error: bodyError } = validateScheduleSchema(req.body);
    // body 형식 Error
    if (bodyError) {
      throw (new DataFormatError(bodyError.details[0].message));
    }

    const { user } = req;

    // requestStartDateTime, requestEndDateTime 값에 대한 설명은
    // controller의 groupSchedule.js 파일 568번 라인 참고
    const {
      requestStartDateTime, requestEndDateTime,
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    // 개인 일정 생성
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

    // response로 오늘 일정, 다가오는 일정을 구분하여 보내줌 (getScheduleResponse)
    const response = await getScheduleResponse(requestStartDateTime, requestEndDateTime, schedule.dataValues);

    return res.status(201).json(response);
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 단일 개인 일정 조회
async function getSingleUserSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    // 매개변수 형식 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const { user } = req;
    const schedule = await PersonalSchedule.findOne({ where: { userId: user.userId, id: scheduleId } });

    // 일정을 찾을 수 없을 때 Error
    if (!schedule) {
      throw (new ScheduleNotFoundError());
    }

    return res.status(200).json(schedule);
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 개인 일정 조회 ( 범위를 지정하여 조회합니다. )
// startDateTime ~ endDateTime 기간에 속하는 일정
async function getUserPersonalSchedule(req, res, next) {
  try {
    const { error: queryError } = validateScheduleDateSchema(req.query);
    // 쿼리 형식 Error
    if (queryError) {
      throw (new DataFormatError());
    }

    const { user } = req;

    const { startDateTime, endDateTime } = req.query;

    // 받아온 값을 Date 객체로 저장
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();

    // PersonalSchedule 모델에 정의된 getSchedule 메소드를 이용하여 스케줄 리스트를 받아옴
    const userSchedule = await PersonalSchedule.getSchedule([user.userId], start, end);

    // 유저가 가입되어있는 그룹 리스트 ex) [ 1, 2, 3 ]
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

    // 가입된 그룹이 존재하는 경우, 리스트의 길이가 0이 아닌 경우
    if (groups.length) {
      // 해당 그룹들의 모든 일정을 가져옴
      const groupSchedule = await GroupSchedule.getSchedule(groups, start, end);
      const response = {};

      // 개인 일정과 그룹 일정의 조회 결과를 소합하여 response를 구성
      response.schedules = [
        ...userSchedule.schedules,
        ...groupSchedule.schedules,
      ];
      return res.status(200).json(response);
    }

    // 가입된 그룹이 존재하지 않는 경우
    return res.status(200).json(userSchedule);
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 요약된 개인 일정 정보를 가져옴 (일반 조회에서 title과 content가 제외된 결과를 반환)
async function getUserPersonalScheduleSummary(req, res, next) {
  try {
    const { error: queryError } = validateScheduleDateSchema(req.query);
    // 쿼리 형식 Error
    if (queryError) {
      throw (new DataFormatError());
    }

    const { user } = req;

    // 받아온 값을 Date 객체로 저장
    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();

    // PersonalSchedule 모델에 정의된 getSchedule 메소드를 이용하여 스케줄 리스트를 받아옴
    // 마지막 인자 값으로 true 값을 주어서 요약된 일정을 조회하고자 함을 알려줌
    const userSchedule = await PersonalSchedule.getSchedule([user.userId], start, end, true);

    // 유저가 가입되어있는 그룹 리스트 ex) [ 1, 2, 3 ]
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

    // 가입된 그룹이 존재하는 경우, 리스트의 길이가 0이 아닌 경우
    if (groups.length) {
      // 해당 그룹들의 모든 일정을 가져옴
      const groupSchedule = await GroupSchedule.getSchedule(groups, start, end, true);

      // 개인 일정과 그룹 일정의 조회 결과를 소합하여 response를 구성
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
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 개인 일정 수정
async function putPersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    const { error: bodyError } = validateScheduleSchema(req.body);

    // 매개변수 형식 또는 body 형식 Error
    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const { user } = req;
    const schedule = await PersonalSchedule.findOne({ where: { userId: user.userId, id: scheduleId } });

    // 일정을 찾을 수 없을 때 Error
    if (!schedule) {
      throw (new ScheduleNotFoundError());
    }

    // requestStartDateTime, requestEndDateTime 값에 대한 설명은
    // controller의 groupSchedule.js 파일 568번 라인 참고
    const {
      requestStartDateTime, requestEndDateTime,
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    // 일정 수정
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

    // 수정된 일정을 조회하여 해당 값을 이용하여 response를 구성하여 리턴
    const modifiedSchedule = await PersonalSchedule.findByPk(scheduleId);

    const response = await getScheduleResponse(requestStartDateTime, requestEndDateTime, modifiedSchedule.dataValues);

    return res.status(201).json(response);
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 개인 일정 삭제
async function deletePersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    // 매개변수 형식 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const { user } = req;
    const schedule = await PersonalSchedule.findOne({ where: { userId: user.userId, id: scheduleId } });

    // 일정을 찾을 수 없을 때 Error
    if (!schedule) {
      throw (new NotFoundError());
    }

    // 일정 삭제
    await schedule.destroy();

    return res.status(204).json({ message: '성공적으로 삭제되었습니다.' });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
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
