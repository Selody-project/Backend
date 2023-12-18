const jwt = require("jsonwebtoken");

// Model
const User = require("../models/user");
const Post = require("../models/post");

// Error
const {
    ApiError,
    TokenExpireError,
    InvalidTokenError,
    UserNotFoundError,
} = require("../errors");

const ACCESS_SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_SECRET;

const token = () => ({
    access(nickname) {
        return jwt.sign(
            {
                nickname,
            },
            ACCESS_SECRET_KEY,
            {
                expiresIn: "60m",
                issuer: "selody",
            }
        );
    },
    refresh(nickname) {
        return jwt.sign(
            {
                nickname,
            },
            REFRESH_SECRET_KEY,
            {
                expiresIn: "180 days",
                issuer: "selody",
            }
        );
    },
});

// jwt 발급
// nickname을 이용해 발급하므로 해당 미들웨어를 이용할 때, req에 nickname을 전달해줘야함.
async function createToken(req, res, next) {
    try {
        const { user } = req;

        // jwt에 유저의 nickname을 담아줍니다.
        const accessToken = token().access(user.nickname);
        const refreshToken = token().access(user.nickname);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
        });

        // 유저가 작성한 피드의 개수
        const postCount = await Post.getUserPostCount(user.userId);

        // 유저가 가입된 그룹의 개수
        const groupCount = await user.countGroups({
            through: {
                where: {
                    isPendingMember: 0,
                },
            },
        });

        // 유저 정보를 response에 담아 리턴
        return res.status(200).json({
            userId: user.userId,
            email: user.email,
            nickname: user.nickname,
            provider: user.provider,
            snsId: user.snsId,
            profileImage: user.profileImage,
            introduction: user.introduction,
            postCount,
            groupCount,
        });
    } catch (err) {
        return next(new ApiError());
    }
}

// jwt 검증
async function verifyToken(req, res, next) {
    try {
        const authToken = req.cookies.accessToken;
        // 토큰을 찾을 수 없을 때 Error
        if (!authToken) {
            return next(new InvalidTokenError());
        }
        // 토큰 verify
        req.nickname = jwt.verify(authToken, ACCESS_SECRET_KEY).nickname;
        const user = await User.findOne({ where: { nickname: req.nickname } });

        // 해당 토큰을 가진 유저를 찾을 수 없을 때 Error
        if (!user) {
            return next(new UserNotFoundError());
        }
        req.user = user;
        return next();
    } catch (err) {
        // 만료된 토큰일 경우 Error
        if (err.name === "TokenExpiredError") {
            return next(new TokenExpireError());
        }
        // 사용할 수 없는 토큰일 경우 Error
        if (err.name === "InvalidTokenError") {
            return next(new InvalidTokenError());
        }

        return next(new ApiError());
    }
}

// 토큰 갱신
async function renewToken(req, res, next) {
    try {
        const authToken = req.cookies.refreshToken;
        // 토큰을 찾을 수 없을 때 Error
        if (!authToken) throw new InvalidTokenError();

        // 토큰 verify
        const { nickname } = jwt.verify(authToken, REFRESH_SECRET_KEY);
        const user = await User.findOne({ where: { nickname } });
        // 해당 토큰을 가진 유저를 찾을 수 없을 때 Error
        if (!user) {
            throw new UserNotFoundError();
        }

        // 토큰 생성
        const accessToken = token().access(nickname);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
        });

        // 유저가 작성한 피드 수
        const postCount = await Post.getUserPostCount(user.userId);

        // 유저가 가입된 그룹 수
        const groupCount = await user.countGroups({
            through: {
                where: {
                    isPendingMember: 0,
                },
            },
        });

        // 유저 정보를 response에 담아 리턴
        return res.status(200).json({
            userId: user.userId,
            email: user.email,
            nickname,
            provider: user.provider,
            snsId: user.snsId,
            profileImage: user.profileImage,
            introduction: user.introduction,
            postCount,
            groupCount,
        });
    } catch (err) {
        // 만료된 토큰일 경우 Error
        if (err.name === "TokenExpireError") {
            return next(new TokenExpireError());
        }
        // 사용할 수 없는 토큰일 경우 Error
        if (err.name === "InvalidTokenError") {
            return next(new InvalidTokenError());
        }
        return next(new ApiError());
    }
}

module.exports = {
    createToken,
    verifyToken,
    renewToken,
};
