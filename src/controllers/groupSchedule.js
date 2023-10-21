const moment = require('moment');
const { eventProposal } = require('../utils/event');
const {
  getAccessLevel,
} = require('../utils/accessLevel');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');
const UserGroup = require('../models/userGroup');
const User = require('../models/user');
const Vote = require('../models/vote');
const VoteResult = require('../models/voteResult');

// Error
const {
  DataFormatError, ApiError,
  ScheduleNotFoundError, GroupNotFoundError, EditPermissionError,
} = require('../errors');

// Validator
const {
  validateGroupIdSchema, validateEventProposalSchema,
  validateScheduleDateSchema,
  validateGroupScheduleIdSchema,
  validateScheduleProposalSchema,
  validateScheduleProposalIdSchema,
  validateGroupScheduleConfirmSchema,
  validateVoteSchema,
} = require('../utils/validators');
const { getScheduleResponse } = require('../utils/rrule');

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
      GroupSchedule.findOne({ where: { groupId, id: scheduleId } }),
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
        isPendingMember: 0,
      },
      attributes: ['userId'],
    })).map((member) => member.userId);
    const userSchedule = await PersonalSchedule.getSchedule(users, start, end);
    const response = {};
    response.schedules = [
      ...userSchedule.schedules,
      ...groupSchedule.schedules,
    ];

    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, ...response });
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
        isPendingMember: 0,
      },
      attributes: ['userId'],
    })).map((member) => member.userId);
    const userSchedule = await PersonalSchedule.getSchedule(users, start, end, true);
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

    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, ...response });
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
      GroupSchedule.findOne({ where: { groupId, id: scheduleId } }),
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

    return res.status(204).json({ message: '성공적으로 삭제되었습니다.' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postScheduleProposal(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: bodyError } = validateScheduleProposalSchema(req.body);

    if (paramError) {
      return next(new DataFormatError(paramError.details[0].message));
    }

    if (bodyError) {
      return next(new DataFormatError(bodyError.details[0].message));
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

    const {
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    // 투표 종료일은 후보 등록 후 7일후로 고정.
    const votingEndDate = moment.utc().add(7, 'days').toDate();
    const pendingSchedule = await Vote.create({
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
      votingEndDate,
    });

    return res.status(200).json(pendingSchedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getScheduleProposal(req, res, next) {
  try {
    const { error: paramError } = validateScheduleProposalIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, proposal_id: proposalId } = req.params;
    const [group, pendingSchedule] = await Promise.all([
      Group.findByPk(groupId),
      Vote.findOne({ where: { groupId, voteId: proposalId } }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!pendingSchedule) {
      return next(new ScheduleNotFoundError());
    }

    return res.status(200).json(pendingSchedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getScheduleProposalsList(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const [group, pendingSchedules] = await Promise.all([
      Group.findByPk(groupId),
      Vote.findAll({
        where: {
          groupId,
        },
        include: [
          {
            model: VoteResult,
            attributes: ['userId', 'choice'],
            include: {
              model: User,
              attributes: ['nickname', 'profileImage'],
            },
          },
        ],
      }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!pendingSchedules) {
      return next(new ScheduleNotFoundError());
    }

    const response = await Promise.all(pendingSchedules.map(async (pendingSchedule) => {
      const votesCount = await VoteResult.count({
        where: { voteId: pendingSchedule.voteId, choice: true },
      });

      return {
        voteId: pendingSchedule.voteId,
        title: pendingSchedule.title,
        content: pendingSchedule.content,
        startDateTime: pendingSchedule.startDateTime,
        endDateTime: pendingSchedule.endDateTime,
        recurrence: pendingSchedule.recurrence,
        freq: pendingSchedule.freq,
        interval: pendingSchedule.interval,
        byweekday: pendingSchedule.byweekday,
        until: pendingSchedule.until,
        votingEndDate: pendingSchedule.votingEndDate,
        groupId: pendingSchedule.groupId,
        votesCount,
        voteResults: pendingSchedule.dataValues.VoteResults,
      };
    }));
    return res.status(200).json(response);
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteScheduleProposal(req, res, next) {
  try {
    const { error: paramError } = validateScheduleProposalIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, proposal_id: proposalId } = req.params;
    const [group, pendingSchedule] = await Promise.all([
      Group.findByPk(groupId),
      Vote.findOne({
        where: {
          groupId,
          voteId: proposalId,
        },
      }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!pendingSchedule) {
      return next(new ScheduleNotFoundError());
    }

    await pendingSchedule.destroy();
    return res.status(204).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function postScheduleProposalVote(req, res, next) {
  try {
    const { error: paramError } = validateScheduleProposalIdSchema(req.params);
    const { error: bodyError } = validateVoteSchema(req.body);
    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, proposal_id: proposalId } = req.params;
    const { user } = req;
    const [group, pendingSchedule] = await Promise.all([
      Group.findByPk(groupId),
      Vote.findOne({
        where: {
          groupId,
          voteId: proposalId,
        },
      }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!pendingSchedule) {
      return next(new ScheduleNotFoundError());
    }

    const { attendance } = req.body;
    const voteResult = await VoteResult.findOne({
      where: {
        userId: user.userId,
        voteId: pendingSchedule.voteId,
      },
    });
    if (voteResult) {
      voteResult.update({ choice: attendance });
    } else {
      await VoteResult.create({
        userId: user.userId,
        voteId: pendingSchedule.voteId,
        choice: attendance,
      });
    }

    return res.status(200).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function postScheduleProposalConfirm(req, res, next) {
  try {
    const { error: paramError } = validateScheduleProposalIdSchema(req.params);
    const { error: bodyError } = validateGroupScheduleConfirmSchema(req.body);
    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, proposal_id: proposalId } = req.params;
    const { user } = req;
    const [group, pendingSchedule] = await Promise.all([
      Group.findByPk(groupId),
      Vote.findOne({
        where: {
          groupId,
          voteId: proposalId,
        },
      }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!pendingSchedule) {
      return next(new ScheduleNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || accessLevel === 'regular') {
      return next(new EditPermissionError());
    }

    const {
      requestStartDateTime, requestEndDateTime,
    } = req.body;

    const groupSchedule = await GroupSchedule.create({
      groupId: group.groupId,
      title: pendingSchedule.title,
      content: pendingSchedule.content,
      startDateTime: pendingSchedule.startDateTime,
      endDateTime: pendingSchedule.endDateTime,
      recurrence: pendingSchedule.recurrence,
      freq: pendingSchedule.freq,
      interval: pendingSchedule.interval,
      byweekday: pendingSchedule.byweekday,
      until: pendingSchedule.until,
    });

    await Vote.destroy({
      where: {
        groupId,
      },
    });

    const response = await getScheduleResponse(requestStartDateTime, requestEndDateTime, groupSchedule.dataValues, true);

    return res.status(201).json(response);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getScheduleProposals(req, res, next) {
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

    const { startDateTime, endDateTime, duration } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();
    /* eslint-disable-next-line no-await-in-loop */
    const userSchedules = await PersonalSchedule.getProposalSchedule(groupMembers, start, end);
    /* eslint-disable-next-line no-await-in-loop */
    const groupSchedules = await GroupSchedule.getProposalSchedule([groupId], start, end);
    const events = [...userSchedules, ...groupSchedules];
    events.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    // 결과값에서 9시~22시 사이의 값들을 먼저 추천할 수 있도록 정렬.
    const result = eventProposal(events, start, end, duration);
    const filteredTimes = result.filter((event) => (
      event.startDateTime.getTime() < (end.getTime() - 1000 * 60 * 60 * 2)
        && event.endDateTime.getTime() > (start.getTime() + 1000 * 60 * 60 * 9)
    ));
    const remainingTimes = result.filter((event) => (
      event.startDateTime.getTime() >= (end.getTime() - 1000 * 60 * 60 * 2)
        || event.endDateTime.getTime() <= (start.getTime() + 1000 * 60 * 60 * 9)
    ));
    const sortedResult = filteredTimes.concat(remainingTimes);
    proposal.proposals = sortedResult;

    return res.status(200).json(proposal);
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  getSingleGroupSchedule,
  getGroupSchedule,
  getGroupScheduleSummary,
  deleteGroupSchedule,
  postScheduleProposal,
  getScheduleProposal,
  getScheduleProposalsList,
  deleteScheduleProposal,
  postScheduleProposalVote,
  postScheduleProposalConfirm,
  getScheduleProposals,
};
