const jwt = require('jsonwebtoken');

// Model
const User = require('../models/user');

// Error
const { 
  ApiError, 
  TokenExpireError, InvalidTokenError
} = require('../errors');

const ACCESS_SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_SECRET;

const token = () => ({
  access(nickname) {
    return jwt.sign({
      nickname,
    }, ACCESS_SECRET_KEY, {
      expiresIn: '60m',
      issuer: 'xernserver',
    });
  },
  refresh(nickname) {
    return jwt.sign({
      nickname,
    }, REFRESH_SECRET_KEY, {
      expiresIn: '180 days',
      issuer: 'xernserver',
    });
  },
});

// jwt 발급
// nickname을 이용해 발급하므로 해당 미들웨어를 이용할 때, req에 nickname을 전달해줘야함.
async function createToken(req, res, next) {
  try {
    const { nickname } = req;
    const accessToken = token().access(nickname);
    const refreshToken = token().access(nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    const user = await User.findOne({ where: { nickname } });
    return res.status(200).json({
      message: 'JWT 발급에 성공하였습니다',
      email: user.email,
      nickname,
      provider: user.provider,
      snsId: user.snsId,
    });
  } catch (error) {
    return next(new ApiError());
  }
}

// jwt 검증
function verifyToken(req, res, next) {
  try {
    const authToken = req.cookies.accessToken;
    if (!authToken) throw new InvalidTokenError();
    req.nickname = jwt.verify(authToken, ACCESS_SECRET_KEY).nickname;
    return next();
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

function renewToken(req, res, next) {
  try {
    const authToken = req.cookies.refreshToken;
    if (!authToken) throw new InvalidTokenError();
    const { nickname } = jwt.verify(authToken, REFRESH_SECRET_KEY);
    const accessToken = token().access(nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    return res.status(200).json({
      message: 'Token renewal successful',
      nickname: req.nickname,
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
