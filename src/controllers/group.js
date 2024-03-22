const { Sequelize } = require("sequelize");

const { Op } = Sequelize;
const { deleteBucketImage } = require("../middleware/s3");
const { sequelize } = require("../models/index");

const maxGroupCount = 50;

// Model
const User = require("../models/user");
const UserGroup = require("../models/userGroup");
const Group = require("../models/group");
const Post = require("../models/post");

// Error
const {
    DataFormatError,
    ApiError,
    UserNotFoundError,
    GroupNotFoundError,
    UnauthorizedError,
    ExpiredCodeError,
    InvalidGroupJoinError,
    UserIsLeaderError,
    NoBanPermission,
    EditPermissionError,
    ExceedGroupCountError,
} = require("../errors");

// Validator
const {
    validateGroupSchema,
    validateGroupIdSchema,
    validateLastRecordIdSchema,
    validateGroupJoinInviteCodeSchema,
    validateGroupJoinRequestSchema,
    validateGroupdSearchKeyword,
    validateGroupInviteCodeSchema,
    validateGroupMemberSchema,
    validateAccessLevelSchema,
    validateGroupPublicSchema,
} = require("../utils/validators");
const { getAccessLevel } = require("../utils/accessLevel");
const Comment = require("../models/comment");
const Like = require("../models/like");

// 그룹 생성
async function postGroup(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        // data 값이 비어있는 경우 Error
        if (!req.body?.data) {
            throw new DataFormatError();
        }
        req.body = JSON.parse(req.body.data);

        const { error: bodyError } = validateGroupSchema(req.body);
        // body 형식 Error
        if (bodyError) {
            throw new DataFormatError();
        }

        const { name, description } = req.body;
        const { user } = req;

        // 유저가 가입 가능한 최대 그룹 수 50개를 초과하는 경우 Error
        const groupCount = await user.countGroups();
        if (groupCount >= maxGroupCount) {
            throw new ExceedGroupCountError();
        }

        let group;
        if (req.fileUrl !== null) {
            // 그룹 대표 이미지를 첨부한 경우
            const fileUrl = req.fileUrl.join(", ");
            group = await Group.create(
                {
                    name,
                    description,
                    member: 1,
                    leader: user.userId,
                    image: fileUrl,
                },
                { transaction }
            );
        } else {
            // 그룹 대표 이미지를 따로 첨부하지 않은 경우
            group = await Group.create(
                {
                    name,
                    description,
                    member: 1,
                    leader: user.userId,
                    image: process.env.DEFAULT_GROUP_IMAGE,
                },
                { transaction }
            );
        }

        // 생성된 group을 user테이블에 연결
        await user.addGroup(group, {
            through: { accessLevel: "owner" },
            transaction,
        });

        const response = {
            ...{ message: "성공적으로 생성되었습니다." },
            ...group.dataValues,
        };

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(200).json(response);
    } catch (err) {
        // 에러 발생 시 rollback
        await transaction.rollback();
        // 버킷에 등록된 이미지를 삭제
        await deleteBucketImage(req.fileUrl);

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 단일 그룹의 정보를 조회
async function getGroupDetail(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 그룹에 등록된 피드 개수를 계산
        group.dataValues.feedCount = await Post.count({ where: { groupId } });
        const accessLevel = await getAccessLevel(user, group);

        // 그룹 멤버 정보를 조회하여 response에 넣어줌
        const memberInfo = [];
        let leaderInfo;
        (
            await group.getUsers({
                through: {
                    where: {
                        isPendingMember: 0,
                    },
                },
            })
        ).forEach((member) => {
            const { userId, nickname } = member.dataValues;
            if (userId === group.leader) {
                leaderInfo = { userId, nickname, image: member.profileImage };
            }
            memberInfo.push({ userId, nickname, image: member.profileImage });
        });

        // response
        const response = {
            accessLevel,
            information: { group, leaderInfo, memberInfo },
        };
        return res.status(200).json(response);
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 리스트 조회 (무한 스크롤 방식)
async function getGroupList(req, res, next) {
    try {
        const { error: queryError } = validateLastRecordIdSchema(req.query);
        // 쿼리 형식 Error
        if (queryError) {
            throw new DataFormatError();
        }

        // 페이지의 마지막 레코드 id 값을 전달받음 (last_record_id)
        // 해당 id값을 이용해서 무한 스크롤 구현
        // 처음 조회하는 경우는 last_record_id 값을 0으로 전달받음
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
            order: [["groupId", "DESC"]], // 오름차순
        });

        // 해당 데이터가 마지막 페이지를 조회하고 있는지 판별
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

// 그룹 정보 수정
async function putGroup(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        // data 값이 비어있는 경우 Error
        if (!req.body?.data) {
            throw new DataFormatError();
        }
        req.body = JSON.parse(req.body.data);

        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
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

        // 방장이 아닌 경우 권한 없음 Error
        if (accessLevel !== "owner") {
            throw new UnauthorizedError();
        }

        const { name, description } = req.body;

        // 이전 그룹 대표 이미지 주소
        const previousGroupImage = [group.image];

        let modifiedGroup;
        if (req.fileUrl !== null) {
            // 대표 이미지를 새로 등록한 경우
            const fileUrl = req.fileUrl.join(", ");
            // 그룹 정보 수정
            modifiedGroup = await group.update(
                { name, description, image: fileUrl },
                { transaction }
            );
            // 이전 그룹 대표 이미지를 삭제
            await deleteBucketImage(previousGroupImage);
        } else {
            // 그룹 정보 수정
            modifiedGroup = await group.update(
                { name, description },
                { transaction }
            );
        }

        const response = {
            ...{ message: "성공적으로 수정되었습니다." },
            ...modifiedGroup.dataValues,
        };

        // 트랜잭션 커밋
        await transaction.commit();

        return res.status(200).json(response);
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();
        // 등록된 있는 버킷 이미지 삭제
        await deleteBucketImage(req.fileUrl);

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 삭제
async function deleteGroup(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 사용자 그룹 권한 조회
        const accessLevel = await getAccessLevel(user, group);
        // 방장이 아닌 경우 권함없음 Error
        if (accessLevel !== "owner") {
            throw new UnauthorizedError();
        }

        // 그룹 대표 이미지 주소
        const previousGroupImage = [group.image];

        // 그룹 삭제
        await group.destroy({ transaction });

        // 버킷에 저장된 그룹 이미지 삭제
        await deleteBucketImage(previousGroupImage);

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(204).json({ message: "성공적으로 삭제되었습니다." });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 공개 그룹 여부 변경
async function patchGroupPublic(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        const { error: bodyError } = validateGroupPublicSchema(req.body);
        // 매개변수 또는 body 형식 Error
        if (paramError || bodyError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 사용자 그룹 권한 조회
        const accessLevel = await getAccessLevel(user, group);
        // 방장이 아닌 경우 권함없음 Error
        if (accessLevel !== "owner") {
            throw new UnauthorizedError();
        }

        // 그룹 공개 여부 업데이트
        await group.update(req.body);

        return res.status(200).json({ message: "성공적으로 수정되었습니다." });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 멤버에서 탈퇴
async function deleteGroupUser(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
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

        // 방장인 경우 탈퇴할 수 없음
        if (accessLevel === "owner") {
            throw new UserIsLeaderError();
        }

        // 그룹 탈퇴
        await UserGroup.destroy({
            where: {
                userId: user.userId,
                groupId,
            },
            transaction,
        });

        // 그룹 멤버 수 업데이트
        await group.update({ member: group.member - 1 }, { transaction });

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(204).json({ message: "성공적으로 추방하였습니다." });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 멤버 조회
async function getGroupMembers(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 멤버 조회 (가입 대기중인 멤버는 조회하지 않도록 isPendingMember 값이 0인 레코드만 조회)
        const members = await User.findAll({
            attributes: ["userId", "nickname", "profileImage"],
            include: [
                {
                    model: UserGroup,
                    attributes: [
                        "userId",
                        "groupId",
                        "accessLevel",
                        "isPendingMember",
                    ],
                    where: {
                        groupId,
                        isPendingMember: 0,
                    },
                },
            ],
        });
        // 위 값들을 파싱하여 response를 구성
        const promises = members.map(async (member) => {
            const currentGroup = member.UserGroups[0];

            // 요청 중인 멤버가 아니라면, 즉 그룹에 속한 멤버라면
            // 그룹의 posts 조회 및 각 post마다
            const getPostCommentsAndCounts = async () => {
                let commentCount = 0;
                let likeCount = 0;

                const posts = await Post.findAll({
                    where: {
                        groupId: currentGroup.groupId,
                    },
                    include: [
                        {
                            model: Comment,
                            // 해당 속성은 필요 없지만, 입력하지 않으면 join을 수행하지 않아 추가함
                            attributes: ["commentId"],
                            where: {
                                userId: member.userId,
                            },
                        },
                        {
                            model: Like,
                            // 해당 속성은 필요 없지만, 입력하지 않으면 join을 수행하지 않아 추가함
                            attributes: ["postId"],
                            where: {
                                userId: member.userId,
                            },
                        },
                    ],
                });

                // posts마다 member가 쓴 comment, like가 있다면 그만큼 더함
                posts.forEach((post) => {
                    commentCount += post.Comments.length;
                    likeCount += post.Likes.length;
                });

                return { commentCount, likeCount };
            };
            // user의 그룹 가입 시기
            const getUserJoinedDate = async () =>
                (
                    await UserGroup.findOne({
                        where: {
                            userId: member.userId,
                            groupId: currentGroup.groupId,
                        },
                        attributes: ["createdAt"],
                    })
                ).createdAt;

            const [{ commentCount, likeCount }, joinedDate] = await Promise.all(
                [getPostCommentsAndCounts(), getUserJoinedDate()]
            );

            return {
                accessLevel: currentGroup.dataValues.accessLevel,
                member: {
                    nickname: member.nickname,
                    userId: member.userId,
                    image: member.profileImage,
                    commentCount,
                    likeCount,
                    joinedDate,
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

// 가입 대기중인 유저 리스트를 조회
async function getPendingMembers(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 멤버 조회 (isPendingMember 값이 1인 레코드만 조회)
        const members = await User.findAll({
            attributes: ["userId", "nickname", "profileImage"],
            include: [
                {
                    model: UserGroup,
                    attributes: [
                        "userId",
                        "groupId",
                        "accessLevel",
                        "isPendingMember",
                    ],
                    where: {
                        groupId,
                        isPendingMember: 1,
                    },
                },
            ],
        });

        // 위 값들을 파싱하여 response를 구성
        const promises = members.map(async (member) => ({
            accessLevel: member.UserGroups[0].dataValues.accessLevel,
            member: {
                nickname: member.nickname,
                userId: member.userId,
                image: member.profileImage,
                isPendingMember:
                    member.UserGroups[0].dataValues.isPendingMember,
            },
        }));

        const parsedMembers = await Promise.all(promises);
        return res.status(200).json(parsedMembers);
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 가입 신청
async function postGroupJoinRequest(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId } = req.params;
        const { user } = req;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 가입 그룹 최대 갯수인 50개를 (가입된 그룹 수 + 요청 수) 값이 초과했을 때 Error
        const groupCount = await user.countGroups();
        if (groupCount >= maxGroupCount) {
            throw new ExceedGroupCountError();
        }

        const userBelongGroup = await UserGroup.findOne({
            where: {
                userId: user.userId,
                groupId: group.groupId,
            },
        });
        if (!userBelongGroup) {
            // 유저가 해당 그룹에 속해있지도 않고, 해당 그룹에 가입 신청 중인 상태가 아닌 경우
            await group.addUser(user, {
                through: { isPendingMember: 1 },
                transaction,
            });
        } else if (userBelongGroup.isPendingMember === 0) {
            // 유저가 해당 그룹에 이미 속해있는 경우 Error
            throw new InvalidGroupJoinError();
        } else {
            // 유저가 해당 그룹에 이미 신청을 했으며, 대기중인 상태인 경우. 요청을 취소함.
            await userBelongGroup.destroy({ transaction });

            // 트랜잭션 커밋
            await transaction.commit();
            return res
                .status(200)
                .json({ message: "성공적으로 취소되었습니다." });
        }

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(200).json({ message: "성공적으로 신청되었습니다." });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 가입 요청 승인
async function postGroupJoinApprove(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();
        const { error: paramError } = validateGroupJoinRequestSchema(
            req.params
        );
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId, user_id: applicantId } = req.params;
        const { user } = req;
        const [group, applicant] = await Promise.all([
            Group.findByPk(groupId),
            User.findByPk(applicantId),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 요청한 유저를 찾을 수 없을 때 Error
        if (!applicant) {
            throw new UserNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);
        // 방장이 아닌 경우 수락할 수 없으므로 Error
        if (accessLevel !== "owner") {
            throw new UnauthorizedError();
        }

        // 가입 대기중 상태를 가입 승인 상태로 업데이트
        // 멤버 수를 + 1
        await UserGroup.update(
            { isPendingMember: 0 },
            { where: { userId: applicantId }, transaction }
        );
        const newGroupMember = await User.findOne({
            where: {
                userId: applicantId,
            },
            attributes: ["userId", "nickname", "profileImage"],
            include: [
                {
                    model: UserGroup,
                    attributes: ["createdAt"],
                    where: { groupId },
                },
            ],
        });
        await group.update({ member: group.member + 1 }, { transaction });

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(200).json({
            accessLevel: "viewer",
            member: {
                nickname: newGroupMember.nickname,
                userId: newGroupMember.userId,
                image: newGroupMember.profileImage,
                commentCount: 0,
                likeCount: 0,
                joinedDate: newGroupMember.UserGroups[0].createdAt,
            },
        });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 가입 요청 거절
async function postGroupJoinReject(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();
        const { error: paramError } = validateGroupJoinRequestSchema(
            req.params
        );
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId, user_id: applicantId } = req.params;
        const { user } = req;
        const [group, applicant] = await Promise.all([
            Group.findByPk(groupId),
            User.findByPk(applicantId),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 요청한 유저를 찾을 수 없을 때 Error
        if (!applicant) {
            throw new UserNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);
        // 방장이 아닌 경우 권함 없음 Error
        if (accessLevel !== "owner") {
            throw new UnauthorizedError();
        }

        // 가입 대기 상태 정보 삭제
        await UserGroup.destroy({
            where: { userId: applicantId },
            transaction,
        });

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(200).json({ message: "성공적으로 거절하였습니다." });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 초대 링크 조회
async function getInviteLink(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
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
        // 권한이 없는 경우(read only 권한인 경우) Error
        if (accessLevel == "viewer" || accessLevel === null) {
            throw new UnauthorizedError();
        }

        // 코드와 만료일자를 리턴
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

// 그룹 초대 링크 생성
async function postInviteLink(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
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

        // 권한이 없는 경우(read only 권한인 경우) Error
        if (accessLevel == "viewer" || accessLevel === null) {
            throw new UnauthorizedError();
        }

        // 랜덤한 코드를 생성
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const codeLength = 12;
        let inviteCode = "";
        let duplicate = null;

        while (true) {
            inviteCode = "";
            for (let i = 0; i < codeLength; i += 1) {
                const randomIndex = Math.floor(
                    Math.random() * characters.length
                );
                inviteCode += characters.charAt(randomIndex);
            }
            // eslint-disable-next-line no-await-in-loop
            duplicate = await Group.findOne({ where: { inviteCode } });
            if (!duplicate) {
                break;
            }
        }

        // 만료일은 오늘로부터 하루 뒤
        const inviteExp = new Date();
        inviteExp.setDate(new Date().getDate() + 1);

        // 코드 업데이트
        await group.update({ inviteCode, inviteExp });

        // 코드와 만료일을 리턴
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

// 초대코드를 이용해 그룹 초대장 조회
async function getGroupPreviewWithInviteCode(req, res, next) {
    try {
        const { error: paramError } = validateGroupInviteCodeSchema(req.params);
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { inviteCode } = req.params;
        const group = await Group.findOne({ where: { inviteCode } });

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 초대 코드가 이미 만료된 경우 Error
        if (group.inviteExp < new Date()) {
            throw new ExpiredCodeError();
        }

        // 해당 코드를 가진 그룹의 정보를 리턴
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

// 초대 코드를 총해 초대장을 조회한 후, 초대를 수락
async function postJoinGroupWithInviteCode(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        const { error: paramError } = validateGroupJoinInviteCodeSchema(
            req.params
        );
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId, inviteCode } = req.params;
        const { user } = req;
        const group = await Group.findOne({ where: { inviteCode, groupId } });

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 초대 코드가 이미 만료된 경우 Error
        if (group.inviteExp < new Date()) {
            throw new ExpiredCodeError();
        }

        const userGroup = await UserGroup.findOne({
            where: { userId: user.userId, groupId: group.groupId },
            transaction,
        });
        // 이미 가입된 그룹인 경우 Error
        if (userGroup?.isPendingMember === 0) {
            throw new InvalidGroupJoinError();
        }
        // 가입 신청을 통해 가입 대기중인 상태인 경우
        if (userGroup?.isPendingMember === 1) {
            // 가입 대기중 상태인 유저를 가입 완료 처리
            await userGroup.update({ isPendingMember: 1 }, { transaction });
        } else {
            // 그 외의 경우
            const groupCount = await user.countGroups();
            // (가입된 그룹 수 + 요청중인 그룹 수) 값이 50을 초과하는 경우 Error
            if (groupCount >= maxGroupCount) {
                throw new ExceedGroupCountError();
            }

            // user와 group을 연결
            await user.addGroup(group, { transaction });

            // 멤버 수 + 1
            await group.update({ member: group.member + 1 }, { transaction });
        }

        // 트랜잭션 커밋
        await transaction.commit();

        return res.status(200).json({ message: "성공적으로 가입되었습니다." });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹 멤버 추방
async function deleteGroupMember(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        const { error: paramError } = validateGroupJoinRequestSchema(
            req.params
        );
        // 매개변수 형식 Error
        if (paramError) {
            throw new DataFormatError();
        }

        const { group_id: groupId, user_id: userId } = req.params;

        const { user } = req;
        const [group, member] = await Promise.all([
            Group.findByPk(groupId),
            User.findByPk(userId),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 추방 대상 멤버를 찾을 수 없을 때 Error
        if (!member) {
            throw new UserNotFoundError();
        }

        // 사용자 그룹 접근 권한 조회
        const accessLevel = await getAccessLevel(user, group);
        // 방장이 아닌 경우 다른 멤버를 추방할 수 없으므로 Error
        if (accessLevel !== "owner") {
            throw new UnauthorizedError();
        }

        // 추방 대상 멤버의 그룹 접근 권한 조회
        const memberAccessLevel = await getAccessLevel(member, group);
        // 추방 대상인 멤버가 방장 또는 관리자인 경우, 추방할 수 없으므로 Error
        if (memberAccessLevel === "owner" || memberAccessLevel === "admin") {
            throw new NoBanPermission();
        }

        // user와 group 연결 해제
        await group.removeUser(member, { transaction });

        // 그룹 멤버 수 업데이트
        await group.update({ member: group.member - 1 }, { transaction });

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(204).end();
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 그룹명 검색
async function searchGroup(req, res, next) {
    try {
        const { error: queryError } = validateGroupdSearchKeyword(req.query);
        // 쿼리 형식 Error
        if (queryError) {
            throw new DataFormatError();
        }

        const { keyword } = req.query;
        // 페이지의 마지막 레코드 id 값을 전달받음 (last_record_id)
        // 해당 id값을 이용해서 무한 스크롤 구현
        // 처음 조회하는 경우는 last_record_id 값을 0으로 전달받음
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
            order: [["groupId", "DESC"]],
        });

        // 해당 페이지가 마지막 페이지에 해당하는 지 판별
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

// 유저 접근 권한 수정
async function patchUserAccessLevel(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        const { error: paramError } = validateGroupMemberSchema(req.params);
        const { error: bodyError } = validateAccessLevelSchema(req.body);
        // 매개변수 또는 body 형식 Error
        if (paramError || bodyError) {
            throw new DataFormatError();
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
                        attributes: ["userId", "groupId", "accessLevel"],
                        where: {
                            userId,
                            groupId,
                        },
                    },
                ],
            }),
        ]);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // 대상 멤버를 찾을 수 없을 때 Error
        if (!member) {
            throw new UserNotFoundError();
        }

        // 사용자 접근 권한 정보 조회
        const userAccessLevel = await getAccessLevel(user, group);
        // 방장이 아닌 경우 멤버의 권한을 수정할 수 없으므로 Error
        if (userAccessLevel !== "owner") {
            throw new EditPermissionError();
        }

        const { access_level: accessLevel } = req.body;

        const userGroup = member.UserGroups[0];
        // 만일 다른 유저의 권한을 방장(owner)로 바꾸고자 한다면,
        // 자신은 자동으로 regular 권한을 가진 일반 유저로 전환됨.
        if (accessLevel === "owner") {
            const myUserGroup = await UserGroup.findOne({
                where: {
                    userId: user.userId,
                    groupId,
                },
            });
            myUserGroup.accessLevel = "regular";
            group.leader = userGroup.userId;
            await group.save({ transaction });
            await myUserGroup.save({ transaction });
        }
        if (userGroup) {
            userGroup.accessLevel = accessLevel;
            await userGroup.save({ transaction });
        }

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(204).end();
    } catch (err) {
        // 오류 발생 시 rollback
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
    patchGroupPublic,
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
