import request from 'request';
import bcrypt from 'bcrypt';
import jwt = require('jsonwebtoken');
import jwksClient = require('jwks-rsa');
import { Op } from 'sequelize';

// model
import User from '../models/user';

// error
import ApiError from '../errors/apiError';
import {
  DataFormatError, authErrors,
} from '../errors';

// validator
import {
  validateLoginSchema,
  validateJoinSchema,
} from '../utils/validators';

async function getNaverUserInfo(req, res, next): Promise<void> {
  const { accessToken } = req.body;
  const header = `Bearer ${accessToken}`;
  const apiUrl = 'https://openapi.naver.com/v1/nid/me';

  const options = {
    url: apiUrl,
    headers: { Authorization: header },
  };

  // naver 사용자 정보 조회
  request.get(options, async (error, response, body) => {
    if (!error && response.statusCode === 200) {
      req.body = JSON.parse(body).response;
      next();
    } else if (response !== null) {
      res.status(response.statusCode).end();
    }
  });
}

// Google 로그인 토큰 파싱
const client = jwksClient({
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
});

function getKey(header: jwksClient.CertSigningKey, callback): void {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.getPublicKey; // || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function getGoogleUserInfo(req, res, next) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) throw new authErrors.InvalidTokenError();

    jwt.verify(accessToken, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
      }

      const userEmail = (decoded as {email: string}).email.split('@')[0];

      const user = await User.findOne({ where: { nickname: userEmail } });

      if (!user) {
        await User.create({
          nickname: userEmail,
          provider: 'GOOGLE',
        });
      }

      req.nickname = user.nickname;
      next();
    });
  } catch (error) {
    if (error.name === 'TokenExpireError') {
      return next(new authErrors.TokenExpireError());
    }
    return next(new authErrors.InvalidTokenError());
  }
}

async function joinSocialUser(req, res, next) {
  try {
    const user = await User.findOne({ where: { snsId: req.body.id } });

    if (!user) {
      await User.create({
        nickname: req.body.nickname,
        provider: 'NAVER',
        snsId: req.body.id,
      });
    }

    req.nickname = user.nickname;
    next();
  } catch (error) {
    if (error.name === 'TokenExpireError') {
      return next(new authErrors.TokenExpireError());
    }
    return next(new authErrors.InvalidTokenError());
  }
}

async function join(req, res, next): Promise<Response | void> {
  const { error } = validateJoinSchema(req.body);

  if (error) return next(new DataFormatError());

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
    return next(new authErrors.DuplicateUserError());
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

async function login(req, res, next): Promise<Response | void> {
  const { error } = validateLoginSchema(req.body);

  if (error) return next(new DataFormatError());

  const { email, password } = req.body;

  let user;

  try {
    user = await User.findOne({ where: { email } });
  } catch (err) {
    return next(new ApiError());
  }

  if (!user) {
    return next(new authErrors.InvalidIdPasswordError());
  }

  try {
    const result = await bcrypt.compare(password, user.password);

    if (result) {
      req.nickname = user.nickname;

      return next();
    }
    return next(new authErrors.InvalidIdPasswordError());
  } catch (err) {
    return next(new ApiError());
  }
}

async function logout(req, res, next): Promise<Response | void> {
  try {
    return res.status(200).clearCookie('accessToken').clearCookie('refreshToken').json({ message: 'Logout successful' });
  } catch (err) {
    return next(new ApiError());
  }
}

export {
  getNaverUserInfo,
  getGoogleUserInfo,
  join,
  login,
  logout,
  joinSocialUser,
};
