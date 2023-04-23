const jwt = require('jsonwebtoken');

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
exports.createToken = (req, res) => {
  try {
    const accessToken = token().access(req.body.nickname);
    const refreshToken = token().access(req.body.nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.status(200).json({
      message: 'JWT 발급에 성공하였습니다',
      nickname: req.body.nickname,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal Sever Error',
    });
  }
};

// jwt 검증
exports.verifyToken = (req, res, next) => {
  try {
    req.body = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    next();
  } catch (error) {
    if (error.name === 'TokenExpireError') {
      res.status(419).json({
        code: 419,
        message: '토큰이 만료되었습니다.',
      });
    }
    res.status(401).json({
      code: 401,
      message: '유효하지 않은 토큰입니다.',
    });
  }
};
