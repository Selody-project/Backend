const request = require('request');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Model
const User = require('../models/user');

// Error
const {
  ApiError, DataFormatError,
  DuplicateUserError, InvalidIdPasswordError, InvalidTokenError,
  TokenExpireError,
} = require('../errors');

// Validator
const {
  validateLoginSchema, validateJoinSchema,
} = require('../utils/validators');

async function getNaverUserInfo(req, res, next) {
  try {
    const { access_token: accessToken } = req.body;
    const header = `Bearer ${accessToken}`;
    const apiUrl = 'https://openapi.naver.com/v1/nid/me';
    const options = {
      url: apiUrl,
      headers: { Authorization: header },
    };
    // naver 사용자 정보 조회
    request.get(options, async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        req.body = JSON.parse(body).response;
        next();
      } else if (response != null) {
        res.status(response.statusCode).end();
      }
    });
  } catch (err) {
    return next(new ApiError());
  }
}

// Google 로그인 토큰 파싱
const client = jwksClient({
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function getGoogleUserInfo(req, res, next) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) throw new InvalidTokenError();

    jwt.verify(accessToken, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
      }
      const userEmail = decoded.email;
      const nickname = decoded.email.split('@')[0];

      const user = await User.findOne({ where: { email: userEmail } });
      if (!user) {
        await User.create({
          email: userEmail,
          nickname,
          provider: 'GOOGLE',
        });
        req.nickname = nickname;
      } else {
        req.nickname = user.nickname;
      }
      next();
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

async function joinSocialUser(req, res, next) {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      const nickname = `naver-${req.body.id}`.slice(0, 15);
      await User.create({
        email: req.body.email,
        nickname,
        provider: 'NAVER',
        snsId: req.body.id,
      });
      req.nickname = nickname;
    } else {
      req.nickname = user.nickname;
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpireError') {
      return next(new TokenExpireError());
    }
    return next(new InvalidTokenError());
  }
}

async function join(req, res, next) {
  const { error: bodyError } = validateJoinSchema(req.body);
  if (bodyError) {
    return next(new DataFormatError());
  }

  const { email, nickname, password } = req.body;
  let options;
  if (email && !nickname) {
    options = { where: { email } };
  } else if (!email && nickname) {
    options = { where: { nickname } };
  } else {
    options = { where: { [Op.or]: [{ email }, { nickname }] } };
  }
  const user = await User.findOne(options);
  if (user) {
    return next(new DuplicateUserError());
  }
  if (email && nickname && password) {
    try {
      const hash = await bcrypt.hash(password, 12);
      await User.create({
        email,
        nickname,
        password: hash,
        provider: 'local',
      });
      req.nickname = nickname;
      return next();
    } catch (err) {
      return next(new ApiError());
    }
  } else {
    return res.status(200).send({ message: "It's possible to use" });
  }
}

async function login(req, res, next) {
  try {
    const { error: bodyError } = validateLoginSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new InvalidIdPasswordError());
    }

    const result = await bcrypt.compare(password, user.password);
    if (result) {
      req.nickname = user.nickname;
      return next();
    }

    return next(new InvalidIdPasswordError());
  } catch (err) {
    return next(new ApiError());
  }
}

async function logout(req, res, next) {
  try {
    return res.status(200).clearCookie('accessToken').clearCookie('refreshToken').json({ message: 'Logout successful' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  getNaverUserInfo,
  getGoogleUserInfo,
  join,
  login,
  logout,
  joinSocialUser,
};
