const jwt = require('jsonwebtoken');

// Model
const User = require('../models/user');
const Post = require('../models/post');

// Error
const {
  ApiError,
  TokenExpireError, InvalidTokenError, UserNotFoundError,
} = require('../errors');

const ACCESS_SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_SECRET;

const token = () => ({
  access(nickname) {
    return jwt.sign({
      nickname,
    }, ACCESS_SECRET_KEY, {
      expiresIn: '60m',
      issuer: 'selody',
    });
  },
  refresh(nickname) {
    return jwt.sign({
      nickname,
    }, REFRESH_SECRET_KEY, {
      expiresIn: '180 days',
      issuer: 'selody',
    });
  },
});

// jwt 발급
// nickname을 이용해 발급하므로 해당 미들웨어를 이용할 때, req에 nickname을 전달해줘야함.
async function createToken(req, res, next) {
  try {
    const { user } = req;
    const accessToken = token().access(user.nickname);
    const refreshToken = token().access(user.nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    const postCount = await Post.getUserPostCount(user.userId);
    const groupCount = await user.countGroups({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    });
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
    console.log(err);
    return next(new ApiError());
  }
}

// jwt 검증
async function verifyToken(req, res, next) {
  try {
    const authToken = req.cookies.accessToken;
    if (!authToken) {
      return next(new InvalidTokenError());
    }
    req.nickname = jwt.verify(authToken, ACCESS_SECRET_KEY).nickname;
    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new UserNotFoundError());
    }
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new TokenExpireError());
    }
    if (err.name === 'InvalidTokenError') {
      return next(new InvalidTokenError());
    }

    return next(new ApiError());
  }
}

async function renewToken(req, res, next) {
  try {
    const authToken = req.cookies.refreshToken;
    if (!authToken) throw new InvalidTokenError();
    const { nickname } = jwt.verify(authToken, REFRESH_SECRET_KEY);
    const accessToken = token().access(nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    const user = await User.findOne({ where: { nickname } });
    const postCount = await Post.getUserPostCount(user.userId);
    const groupCount = await user.countGroups({
      through: {
        where: {
          isPendingMember: 0,
        },
      },
    });
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
    if (err.name === 'TokenExpireError') {
      return next(new TokenExpireError());
    }
    if (err.name === 'InvalidTokenError') {
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
