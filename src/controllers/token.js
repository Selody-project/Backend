const jwt = require('jsonwebtoken');

const ACCESS_SECRET_KEY = process.env.ACCESS_JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.REFRESH_JWT_SECRET;

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
  res.json({
    status: 200,
    message: 'success',
    jwt: {
      accessToken: token().access(req.data.id, req.data.nick),
      refeshToken: token().refresh(req.data.id, req.data.nick),
    },
  });
};

/*
// jwt 검증
exports.verifyToken = (req, res, next) => {
  console.log('authenticateAccessToken');
  res.end();
};
*/
