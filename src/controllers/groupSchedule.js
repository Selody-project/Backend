const moment = require("moment");
const { sequelize } = require("../models/index");
const { eventProposal } = require("../utils/event");
const { getAccessLevel } = require("../utils/accessLevel");

// Model
const PersonalSchedule = require("../models/personalSchedule");
const Group = require("../models/group");
const GroupSchedule = require("../models/groupSchedule");
const UserGroup = require("../models/userGroup");
const User = require("../models/user");
const Vote = require("../models/vote");
const VoteResult = require("../models/voteResult");

// Error
const {
    DataFormatError,
    ApiError,
    ScheduleNotFoundError,
    GroupNotFoundError,
    EditPermissionError,
} = require("../errors");

// Validator
const {
    validateGroupIdSchema,
    validateEventProposalSchema,
    validateScheduleDateSchema,
    validateGroupScheduleIdSchema,
    validateScheduleProposalSchema,
    validateScheduleProposalIdSchema,
    validateGroupScheduleConfirmSchema,
    validateVoteSchema,
} = require("../utils/validators");
const { getScheduleResponse } = require("../utils/rrule");

// 그룹 일정 단일 조회
async function getSingleGroupSchedule(req, res, next) {
    try {
        const { error: paramError } = validateGroupScheduleIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { schedule_id: scheduleId, group_id: groupId } = req.params;
        const { user } = req;
        const [group, schedule] = await Promise.all([
            Group.findByPk(groupId),
            GroupSchedule.findOne({ where: { groupId, id: scheduleId } }),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 일정을 찾을 수 없을 때 Error
        if (!schedule) {
            throw new ScheduleNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        // 해당 값을 response에 넣어서 리턴
        return res.status(200).json({ accessLevel, schedule });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 일정 조회 ( 범위를 지정하여 조회합니다. )
// startDateTime ~ endDateTime 기간에 속하는 일정
async function getGroupSchedule(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        const { error: queryError } = validateScheduleDateSchema(req.query);
        // 매개변수 형식 또는 쿼리 형식 Error
        if (paramError || queryError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        const { startDateTime, endDateTime } = req.query;

        // 받아온 값을 Date 객체로 저장
        const start = moment.utc(startDateTime).toDate();
        const end = moment.utc(endDateTime).toDate();

        // GroupSchedule 모델에 정의된 getSchedule 메소드를 이용하여 스케줄 리스트를 받아옴
        const groupSchedule = await GroupSchedule.getSchedule(
            [groupId],
            start,
            end
        );

        // 그룹에 속한 멤버들 중, 개인 일정 공유 옵션이 열려 있는 멤버를 리스트로 가져옴
        // ex) [ 1, 2, 3 ]
        const users = (
            await UserGroup.findAll({
                where: {
                    groupId,
                    shareScheduleOption: 1,
                    isPendingMember: 0,
                },
                attributes: ["userId"],
            })
        ).map((member) => member.userId);

        // 해당 멤버들의 모든 일정을 가져옴
        const userSchedule = await PersonalSchedule.getSchedule(
            users,
            start,
            end
        );

        // 개인 일정과 그룹 일정의 조회 결과를 소합하여 response를 구성
        const response = {};
        response.schedules = [
            ...userSchedule.schedules,
            ...groupSchedule.schedules,
        ];

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        return res.status(200).json({ accessLevel, ...response });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 요약된 그룹 일정 정보를 가져옴 (일반 조회에서 title과 content가 제외된 결과를 반환)
async function getGroupScheduleSummary(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        const { error: queryError } = validateScheduleDateSchema(req.query);
        // 매개변수 형식 또는 쿼리 형식 Error
        if (paramError || queryError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 받아온 값을 Date 객체로 저장
        const { startDateTime, endDateTime } = req.query;
        const start = moment.utc(startDateTime).toDate();
        const end = moment.utc(endDateTime).toDate();

        // GroupSchedule 모델에 정의된 getSchedule 메소드를 이용하여 스케줄 리스트를 받아옴
        const groupSchedule = await GroupSchedule.getSchedule(
            [groupId],
            start,
            end,
            true
        );

        // 그룹에 속한 멤버들 중, 개인 일정 공유 옵션이 열려 있는 멤버를 리스트로 가져옴
        // ex) [ 1, 2, 3 ]
        const users = (
            await UserGroup.findAll({
                where: {
                    groupId,
                    shareScheduleOption: 1,
                    isPendingMember: 0,
                },
                attributes: ["userId"],
            })
        ).map((member) => member.userId);

        // 해당 멤버들의 모든 일정을 가져옴
        const userSchedule = await PersonalSchedule.getSchedule(
            users,
            start,
            end,
            true
        );

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

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        return res.status(200).json({ accessLevel, ...response });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 일정 삭제
async function deleteGroupSchedule(req, res, next) {
    try {
        const { error: paramError } = validateGroupScheduleIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { schedule_id: scheduleId, group_id: groupId } = req.params;
        const { user } = req;
        const [group, schedule] = await Promise.all([
            Group.findByPk(groupId),
            GroupSchedule.findOne({ where: { groupId, id: scheduleId } }),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 일정을 찾을 수 없을 때 Error
        if (!schedule) {
            throw new ScheduleNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        // 접근 권한이 없는 경우 Error
        if (
            accessLevel === "viewer" ||
            accessLevel === "regular" ||
            accessLevel === null
        ) {
            throw new EditPermissionError();
        }

        // 일정 삭제
        await schedule.destroy();

        return res.status(204).json({ message: "성공적으로 삭제되었습니다." });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 일정 후보 등록
async function postScheduleProposal(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        const { error: bodyError } = validateScheduleProposalSchema(req.body);

        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError(paramError.details[0].message);
        }

        // body 형식 Error
        if (bodyError) {
            throw new DataFormatError(bodyError.details[0].message);
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        // 권한이 없는 경우 수정 권한 Error
        if (
            accessLevel === "viewer" ||
            accessLevel === "regular" ||
            accessLevel === null
        ) {
            throw new EditPermissionError();
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

        // 투표 종료일은 후보 등록 후 7일후로 고정.
        const votingEndDate = moment.utc().add(7, "days").toDate();

        // Vote에 해당 일정을 등록
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
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 일정 후보 단일 조회
// (투표중인 단일 후보를 리스트로 가져옵니다)
async function getScheduleProposal(req, res, next) {
    try {
        const { error: paramError } = validateScheduleProposalIdSchema(
            req.params
        );
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId, proposal_id: proposalId } = req.params;
        const [group, pendingSchedule] = await Promise.all([
            Group.findByPk(groupId),
            Vote.findOne({ where: { groupId, voteId: proposalId } }),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 투표중인 일정 후보를 찾을 수 없을 때 Error
        if (!pendingSchedule) {
            throw new ScheduleNotFoundError();
        }

        return res.status(200).json(pendingSchedule);
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 일정 후보들을 리스트로 조회
// (투표중인 후보들을 리스트로 가져옵니다)
async function getScheduleProposalsList(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
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
                        attributes: ["userId", "choice"],
                        include: {
                            model: User,
                            attributes: ["nickname", "profileImage"],
                        },
                    },
                ],
            }),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 투표중인 일정 후보를 찾을 수 없을 때 Error
        if (!pendingSchedules) {
            throw new ScheduleNotFoundError();
        }

        // response를 구성
        // 투표 진행상황을 같이 리턴하기 위해 VeteResult에서 choice가 true 레코드의 개수를 count
        const response = await Promise.all(
            pendingSchedules.map(async (pendingSchedule) => {
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
            })
        );
        return res.status(200).json(response);
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 일정 후보 삭제
async function deleteScheduleProposal(req, res, next) {
    try {
        const { error: paramError } = validateScheduleProposalIdSchema(
            req.params
        );
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
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

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 투표중인 후보 일정을 찾을 수 없을 때 Error
        if (!pendingSchedule) {
            throw new ScheduleNotFoundError();
        }

        // 일정 후보 삭제
        await pendingSchedule.destroy();

        return res.status(204).end();
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹의 멤버가 일정 후보에 대해 투표를 진행합니다.
// attendance가 true면 참가, false면 불참
async function postScheduleProposalVote(req, res, next) {
    try {
        const { error: paramError } = validateScheduleProposalIdSchema(
            req.params
        );
        const { error: bodyError } = validateVoteSchema(req.body);
        // 매개변수 형식 또는 body 형식 Error
        if (paramError || bodyError) {
            throw new DataFormatError();
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

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 투표중인 후보 일정을 찾을 수 없을 때 Error
        if (!pendingSchedule) {
            throw new ScheduleNotFoundError();
        }

        const { attendance } = req.body;
        // 사용자가 이전에 이미 투표했던 후보인 경우, 새로운 attendance 값으로 업데이트
        const voteResult = await VoteResult.findOne({
            where: {
                userId: user.userId,
                voteId: pendingSchedule.voteId,
            },
        });
        if (voteResult) {
            voteResult.update({ choice: attendance });
        } else {
            // 이전에 투표한 적이 없는 경우 새로 생성
            await VoteResult.create({
                userId: user.userId,
                voteId: pendingSchedule.voteId,
                choice: attendance,
            });
        }

        return res.status(200).end();
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 일정 후보 확정
// 후보를 확정하여 그룹 일정으로 전환시킵니다.
// 해당 일정은 GroupSchedule 테이블로 이동합니다.
async function postScheduleProposalConfirm(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        const { error: paramError } = validateScheduleProposalIdSchema(
            req.params
        );
        const { error: bodyError } = validateGroupScheduleConfirmSchema(
            req.body
        );
        // 매개변수 형식 Error 또는 body 형식 Error
        if (paramError || bodyError) {
            throw new DataFormatError();
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

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 투표중인 후보 일정을 찾을 수 없을 때 Error
        if (!pendingSchedule) {
            throw new ScheduleNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        // 권한이 없는 경우 Error
        if (
            accessLevel === "viewer" ||
            accessLevel === "regular" ||
            accessLevel === null
        ) {
            throw new EditPermissionError();
        }

        /*
      사용자의 타임존을 고려하기 위해서,
      api를 호출하는 시점에서, 사용자의 로컬 타임존에서의 하루를 utc 타임으로 변환했을 때,
      어느 구간에 해당하는 지를 같이 전달받습니다.
      예를 들어 대한민국의 유저가 2023-10-31일에 해당 api를 호출하는 경우
      대한민국은 utc 타임존에 비해 +9:00의 시간차를 가지므로
      requestStartDateTime : 2023-10-30 15:00:00.000
      requestEndDateTime : 2023-10-31 14:59:59.999
      값을 전달받게 됩니다.
      해당 변환은 프론트앤드 단에서 이루어진 채로 전달되므로 서버에서 크게 신경쓰실 필요는 없으나,
      알아두어야 하는 부분이라 적어둡니다.
    */
        const { requestStartDateTime, requestEndDateTime } = req.body;

        // 그룹 일정으로 등록
        const groupSchedule = await GroupSchedule.create(
            {
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
            },
            { transaction }
        );

        // 해당 그룹의 모든 일정 후보를 삭제 ( 여러개의 일정 후보 중에서 단 하나의 후보가 확정되었으므로 )
        await Vote.destroy({
            where: {
                groupId,
            },
            transaction,
        });

        // response를 구성
        const response = await getScheduleResponse(
            requestStartDateTime,
            requestEndDateTime,
            groupSchedule.dataValues,
            true
        );

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(201).json(response);
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

/*
  일정 후보 추천 구간 조회
  멤버들의 개인 일정을 참고하여, 비어있는 시간대를 산출하고
  해당 구간들을 제공합니다.
  duration: 구간의 최소 길이(분단위)
  startDateTime: 추천을 받을 구간의 시작점
  endDateTime: 추천을 받을 구간의 종점
*/
async function getScheduleProposals(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        const { error: queryError } = validateEventProposalSchema(req.query);
        // 매개변수 또는 쿼리 형식 Error
        if (paramError || queryError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);

        // 권한이 없는 경우 Error
        if (
            accessLevel === "viewer" ||
            accessLevel === "regular" ||
            accessLevel === null
        ) {
            throw new EditPermissionError();
        }

        // shareScheduleOption이 켜져있는(1인 경우) 멤버 리스트를 조회
        // ex) [ 1, 2, 3 ]
        const groupMembers = (
            await UserGroup.findAll({
                where: {
                    groupId,
                    shareScheduleOption: 1,
                },
                attributes: ["userId"],
            })
        ).map((member) => member.userId);

        // 비어있는 구간 계산
        const proposal = {};

        const { startDateTime, endDateTime, duration } = req.query;
        const start = moment.utc(startDateTime).toDate();
        const end = moment.utc(endDateTime).toDate();
        /* eslint-disable-next-line no-await-in-loop */
        const userSchedules = await PersonalSchedule.getProposalSchedule(
            groupMembers,
            start,
            end
        );
        /* eslint-disable-next-line no-await-in-loop */
        const groupSchedules = await GroupSchedule.getProposalSchedule(
            [groupId],
            start,
            end
        );
        const events = [...userSchedules, ...groupSchedules];
        events.sort(
            (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
        );

        // 결과값에서 9시~22시 사이의 값들을 먼저 추천할 수 있도록 정렬.
        const result = eventProposal(events, start, end, duration);
        const filteredTimes = result.filter(
            (event) =>
                event.startDateTime.getTime() <
                    end.getTime() - 1000 * 60 * 60 * 2 &&
                event.endDateTime.getTime() >
                    start.getTime() + 1000 * 60 * 60 * 9
        );
        const remainingTimes = result.filter(
            (event) =>
                event.startDateTime.getTime() >=
                    end.getTime() - 1000 * 60 * 60 * 2 ||
                event.endDateTime.getTime() <=
                    start.getTime() + 1000 * 60 * 60 * 9
        );
        const sortedResult = filteredTimes.concat(remainingTimes);
        proposal.proposals = sortedResult;

        return res.status(200).json(proposal);
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
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
