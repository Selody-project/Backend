const request = require('request');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const User = require('../models/user');
const ApiError = require('../errors/apiError');
const DuplicateUserError = require('../errors/auth/DuplicateUserError');
const InvalidIdPasswordError = require('../errors/auth/InvalidIdPasswordError');
const DataFormatError = require('../errors/DataFormatError');
const { validateLoginSchema, validateJoinSchema } = require('../utils/validators');

async function getNaverUserInfo(req, res, next) {
  const { accessToken } = req.body;
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
}

async function joinSocialUser(req, res, next) {
  const exUser = await User.findOne({ where: { snsId: req.body.id } });
  if (!exUser) {
    await User.create({
      nickname: req.body.nickname,
      provider: 'NAVER',
      snsId: req.body.id,
    });
  }
  next();
}

async function join(req, res, next) {
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

  const exUser = await User.findOne(options);
  if (exUser) {
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
  const { error } = validateLoginSchema(req.body);
  if (error) return next(new DataFormatError());

  const { email, password } = req.body;
  let exUser;
  try {
    exUser = await User.findOne({ where: { email } });
  } catch (err) {
    return new ApiError();
  }

  if (!exUser) {
    return next(new InvalidIdPasswordError());
  }
  try {
    const result = await bcrypt.compare(password, exUser.password);
    if (result) {
      req.nickname = exUser.nickname;
      return next();
    }
    return next(new InvalidIdPasswordError());
  } catch (err) {
    return next(new ApiError());
  }
}

async function logout(req, res, next) {
  return res.status(200).clearCookie('accessToken').clearCookie('refreshToken').json({ message: 'Logout successful' });
}

/*
exports.getGoogleUserInfo = async (req, res, next) => {
};
*/

module.exports = {
  getNaverUserInfo,
  join,
  login,
  logout,
  joinSocialUser,
};
