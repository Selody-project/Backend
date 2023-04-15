const jwt = require('jsonwebtoken');

const ACCESS_SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_SECRET;

const token = () => ({
  access(id, nick) {
    return jwt.sign({
      id,
      nick,
    }, ACCESS_SECRET_KEY, {
      expiresIn: '60m',
      issuer: 'xernserver',
    });
  },
  refresh(id, nick) {
    return jwt.sign({
      id,
      nick,
    }, REFRESH_SECRET_KEY, {
      expiresIn: '180 days',
      issuer: 'xernserver',
    });
  },
});

// jwt 발급
exports.createToken = (req, res) => {
  try {
    res.json({
      status: 200,
      message: 'success',
      jwt: {
        accessToken: token().access(req.body.id ? req.body.id : req.body.email, req.body.nickname),
        refeshToken: token().refresh(req.body.id ? req.body.id : req.body.email, req.body.nickname),
      },
    });
  } catch (error) {
    console.log(error);
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
