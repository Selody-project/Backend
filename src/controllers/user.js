const { Sequelize } = require("sequelize");

const { Op } = Sequelize;
const bcrypt = require("bcrypt");
const { deleteBucketImage } = require("../middleware/s3");
const { getAccessLevel } = require("../utils/accessLevel");
const { sequelize } = require("../models/index");

// Model
const User = require("../models/user");
const UserGroup = require("../models/userGroup");
const Group = require("../models/group");
const PersonalSchedule = require("../models/personalSchedule");

// Error
const {
    ApiError,
    DataFormatError,
    BelongToGroupError,
    DuplicateNicknameError,
    DuplicateEmailError,
    GroupNotFoundError,
    InvalidPasswordError,
} = require("../errors");

// Validator
const {
    validateProfileSchema,
    validateGroupIdSchema,
    validatePasswordSchema,
    validateUserSettingSchema,
    validateUserIntroductionSchema,
} = require("../utils/validators");

// 유저가 속한 그룹 리스트 조회
async function getUserGroup(req, res, next) {
    try {
        const { user } = req;

        // 가입된 그룹 (isPendingMember 값이 0인) select 후, 필요한 정보만을 파싱하여 리턴
        let groups = await user.getGroups({
            through: {
                where: {
                    isPendingMember: 0,
                },
            },
        });
        groups = groups.map((group) => ({
            groupId: group.groupId,
            name: group.name,
            description: group.description,
            member: group.member,
            image: group.image,
        }));
        return res.status(200).json(groups);
    } catch (err) {
        return next(new ApiError());
    }
}

// 가입 요청 후, 가입 대기 중인 그룹 리스트 조회
async function getPendingGroupList(req, res, next) {
    try {
        const { user } = req;

        // 가입 대기중인 그룹 (isPendingMember 값이 1인) select 후, 필요한 정보만을 파싱하여 리턴
        let pendingGroups = await user.getGroups({
            where: {
                "$UserGroup.isPendingMember$": 1,
            },
        });
        pendingGroups = pendingGroups.map((group) => ({
            groupId: group.groupId,
            name: group.name,
            description: group.description,
            member: group.member,
            image: group.image,
        }));
        return res.status(200).json(pendingGroups);
    } catch (err) {
        return next(new ApiError());
    }
}

// 유저 프로필 수정
async function patchUserProfile(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        // data에 값이 없다면 Error
        if (!req.body?.data) {
            throw new DataFormatError();
        }
        // data 값을 JSON으로 파싱
        req.body = JSON.parse(req.body.data);

        const { error: bodyError } = validateProfileSchema(req.body);

        // body 형식 Error
        if (bodyError) {
            throw new DataFormatError();
        }

        const { nickname, email, introduction } = req.body;
        const { user } = req;

        // nickname 중복 검사
        const nicknameDuplicate = await User.findAll({
            where: { userId: { [Op.not]: user.userId }, nickname },
        });

        // 중복인 경우 Error
        if (nicknameDuplicate.length !== 0) {
            throw new DuplicateNicknameError();
        }

        // email 중복 검사
        const emailDuplicate = await User.findAll({
            where: { userId: { [Op.not]: user.userId }, email },
        });

        // 중복인 경우 Error
        if (emailDuplicate.length !== 0) {
            throw new DuplicateEmailError();
        }

        // 기존의 프로필 이미지 주소
        const previousProfileImage = [user.profileImage];

        if (req.fileUrl !== null) {
            // 새로 등록된 이미지가 있다면
            const fileUrl = req.fileUrl.join(", ");
            // 프로필 업데이트
            await user.update(
                {
                    nickname,
                    email,
                    introduction,
                    profileImage: fileUrl,
                },
                { transaction }
            );
            // 기존 이미지 버킷에서 삭제
            await deleteBucketImage(previousProfileImage);
        } else {
            // 새로 등록된 이미지가 없다면
            await user.update(
                { nickname, email, introduction },
                { transaction }
            );
        }

        // 다음 미들웨어로 user를 전달 (createToken을 위해서)
        req.user = user;

        // 트랜잭션 커밋
        await transaction.commit();
        return next();
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        // 새로 등록된 이미지를 버킷에서 삭제
        await deleteBucketImage(req.fileUrl);
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 유저 비밀번호 수정
async function patchUserPassword(req, res, next) {
    try {
        const { error: bodyError } = validatePasswordSchema(req.body);

        // body 형식 Error
        if (bodyError) {
            throw new DataFormatError();
        }

        const { currentPassword, newPassword, newPasswordCheck } = req.body;
        const { user } = req;
        // 현재 비밀번호를 맞게 입력했는지 확인
        const isCurrentPwdSame = await bcrypt.compare(
            currentPassword,
            user.password
        );

        // 현재 비밀번호가 일치하는지
        if (!isCurrentPwdSame) {
            throw new InvalidPasswordError(
                "현재 비밀번호가 일치하지 않습니다."
            );
        }
        // 현재 비밀번호와 새 비밀번호가 동일한지
        if (currentPassword === newPassword) {
            throw new InvalidPasswordError(
                "현재 비밀번호와 다른 비밀번호를 입력해야 합니다."
            );
        }
        // 새 비밀번호 확인
        if (newPassword !== newPasswordCheck) {
            throw new InvalidPasswordError("새 비밀번호가 일치하지 않습니다.");
        }
        // 비밀번호를 업데이트
        await user.update({
            password: await bcrypt.hash(newPassword, 12),
        });

        return res.status(200).end();
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 회원 탈퇴
async function withdrawal(req, res, next) {
    let transaction;
    try {
        // 트랜잭션 시작
        transaction = await sequelize.transaction();

        const { user } = req;

        // 그룹 리스트 조회 후, 아직 가입된 그룹이 있다면 Error
        const groupList = await user.getGroups();
        if (groupList != 0) {
            throw new BelongToGroupError();
        }

        // 유저 프로필 이미지 주소
        const previousProfileImage = [user.profileImage];

        // 유저 DB데이터 삭제
        await PersonalSchedule.destroy(
            { where: { userId: user.userId } },
            { transaction }
        );
        await user.destroy({ transaction });

        // 유저 프로필 이미지를 버킷에서 삭제
        await deleteBucketImage(previousProfileImage);

        // 트랜잭션 커밋
        await transaction.commit();
        return res.status(204).json({ message: "성공적으로 탈퇴되었습니다." });
    } catch (err) {
        // 오류 발생 시 rollback
        await transaction.rollback();

        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 유저 그룹 설정 조회
async function getUserSetup(req, res, next) {
    try {
        const { user } = req;

        // UserGroup 테이블에 존재하는 값을 포함하여 조회
        // (유저와 그룹 사이의 옵션 값들은 UserGroup테이블에 존재)
        const options = await User.findAll({
            attributes: ["userId"],
            include: [
                {
                    model: Group,
                    through: {
                        attributes: [
                            "shareScheduleOption",
                            "notificationOption",
                        ],
                    },
                    attributes: ["groupId", "name"],
                },
            ],
            where: { userId: user.userId },
        });

        // 필요한 데이터 형식으로 파싱하여 리턴
        const parsedOptions = await Promise.all(
            options[0].Groups.map(async (option) => {
                const accessLevel = await getAccessLevel(
                    user,
                    option.dataValues
                );
                return {
                    groupId: option.dataValues.groupId,
                    name: option.dataValues.name,
                    shareScheduleOption:
                        option.UserGroup.dataValues.shareScheduleOption,
                    notificationOption:
                        option.UserGroup.dataValues.notificationOption,
                    accessLevel,
                };
            })
        );
        return res.status(200).json(parsedOptions);
    } catch (err) {
        return next(new ApiError());
    }
}

// 유저 그룹 설정 변경
async function patchUserSetUp(req, res, next) {
    try {
        const { error: paramError } = validateGroupIdSchema(req.params);
        const { error: bodyError } = validateUserSettingSchema(req.body);

        // 매개변수 형식 또는 body 형식 Error
        if (paramError || bodyError) {
            throw new DataFormatError();
        }

        const { user } = req;
        const { group_id: groupId } = req.params;
        const group = await Group.findByPk(groupId);

        // 그룹을 찾을 수 없을 때 Error
        if (!group) {
            throw new GroupNotFoundError();
        }

        // UserGroup테이블에 그룹 설정을 update
        await UserGroup.update(req.body, {
            where: { userId: user.userId, groupId },
        });

        return res.status(200).json({ message: "성공적으로 수정되었습니다." });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

// 유저 소개글 수정
async function patchIntroduction(req, res, next) {
    try {
        const { error: bodyError } = validateUserIntroductionSchema(req.body);
        if (bodyError) {
            throw new DataFormatError();
        }

        const { user } = req;

        const modifiedUser = await user.update(req.body);

        return res.status(200).json({
            message: "성공적으로 수정되었습니다.",
            introduction: modifiedUser.introduction,
        });
    } catch (err) {
        if (!err || err.status === undefined) {
            return next(new ApiError());
        }
        return next(err);
    }
}

module.exports = {
    getUserGroup,
    getPendingGroupList,
    patchUserProfile,
    patchUserPassword,
    withdrawal,
    getUserSetup,
    patchUserSetUp,
    patchIntroduction,
};
