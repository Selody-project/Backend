const jwt = require('jsonwebtoken');
const ApiError = require('../errors/apiError');
const InvalidIdPasswordError = require('../errors/auth/InvalidIdPasswordError');

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
// nickname을 이용해 발급하므로 해당 미들웨어를 이용할 때, req.body에 nickname을 전달해줘야함.
function createToken(req, res, next) {
  try {
    const accessToken = token().access(req.body.nickname);
    const refreshToken = token().access(req.body.nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    return res.status(200).json({
      message: 'JWT 발급에 성공하였습니다',
      nickname: req.body.nickname,
    });
  } catch (error) {
    return next(new ApiError());
  }
}

// jwt 검증
function verifyToken(req, res, next) {
  try {
    const authToken = req.cookies.accessToken;
    req.body.nickname = jwt.verify(authToken, ACCESS_SECRET_KEY).nickname;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpireError') {
      return res.status(401).json({
        code: 401,
        message: '토큰이 만료되었습니다.',
      });
    }
    return res.status(401).json({
      code: 401,
      message: '유효하지 않은 토큰입니다.',
    });
  }
}

// jwt 갱신
function renewToken(req, res) {
  try {
    const authToken = req.cookies.refreshToken;
    if (!authToken) throw new InvalidIdPasswordError();
    const { nickname } = jwt.verify(authToken, REFRESH_SECRET_KEY);
    const accessToken = token().access(nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    return res.status(200).json({
      message: '토큰이 갱신되었습니다.',
      nickname: req.body.nickname,
    });
  } catch (err) {
    console.log(err);
    if (err.name === 'TokenExpireError') {
      return res.status(401).json({
        code: 401,
        message: '토큰이 만료되었습니다.',
      });
    }
    return res.status(401).json({
      code: 401,
      message: '유효하지 않은 토큰입니다.',
    });
  }
}

module.exports = {
  createToken,
  verifyToken,
  renewToken,
};
