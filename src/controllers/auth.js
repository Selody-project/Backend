const request = require('request');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { sequelize } = require('../models/index');

// Model
const User = require('../models/user');

// Error
const {
  ApiError, DataFormatError,
  DuplicateEmailError, DuplicateNicknameError,
  InvalidIdPasswordError, InvalidTokenError,
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
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { access_token: accessToken } = req.body;
    if (!accessToken) throw (new InvalidTokenError());

    jwt.verify(accessToken, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
      }
      const userEmail = decoded.email;
      const nickname = decoded.email.split('@')[0];

      const [user, created] = await User.findCreateFind({
        where: { email: userEmail },
        defaults: {
          email: userEmail,
          nickname,
          provider: 'GOOGLE',
          profileImage: decoded.picture,
        },
        transaction,
      });

      if (!created) {
        user.profileImage = decoded.picture;
      }

      await transaction.commit();
      return next();
    });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function joinSocialUser(req, res, next) {
  let transaction;
  try {
    const user = await User.findOne({ where: { email: req.body.email }, transaction });
    if (!user) {
      const nickname = `naver-${req.body.id}`.slice(0, 15);

      const [createdUser] = await User.findCreateFind({
        where: { email: req.body.email },
        defaults: {
          email: req.body.email,
          nickname,
          provider: 'NAVER',
          snsId: req.body.id,
          profileImage: req.body.profile_image,
        },
        transaction,
      });
      req.user = createdUser;
    } else {
      user.profileImage = req.body.profile_image;
      req.user = user;
    }

    await transaction.commit();
    return next();
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function join(req, res, next) {
  let transaction;
  try {
    const { error: bodyError } = validateJoinSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { email, nickname, password } = req.body;
    if (nickname) {
      const user = await User.findOne({ where: { nickname } });
      if (user) {
        throw (new DuplicateNicknameError());
      }
    }
    if (email) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        throw (new DuplicateEmailError());
      }
    }
    if (email && nickname && password) {
      const hash = await bcrypt.hash(password, 12);
      req.user = await User.create({
        email,
        nickname,
        password: hash,
        provider: 'local',
      });
      req.nickname = nickname;
      return next();
    }

    return res.status(200).send({ message: '사용가능한 이메일/닉네임 입니다.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { error: bodyError } = validateLoginSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw (new InvalidIdPasswordError());
    }

    const result = await bcrypt.compare(password, user.password);
    if (result) {
      req.user = user;
      return next();
    }

    throw (new InvalidIdPasswordError());
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    return res.status(200).clearCookie('accessToken').clearCookie('refreshToken').json({ message: '로그아웃되었습니다.' });
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
