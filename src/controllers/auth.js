const request = require('request');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const User = require('../models/user');
const ApiError = require('../errors/apiError');
const DuplicateUserError = require('../errors/auth/DuplicateUserError');
const InvalidIdPasswordError = require('../errors/auth/InvalidIdPasswordError');

const { Op } = Sequelize;

async function getNaverUserInfo(req, res, next) {
  const accessToken = req.body.access_token;
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
  const { email, nickname, password } = req.body;
  let options;

  // sequelize where undefined 관련하여
  if (email && !nickname) {
    options = { where: { [Op.or]: [{ email }] } };
  } else if (!email && nickname) {
    options = { where: { [Op.or]: [{ nickname }] } };
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
      return next();
    } catch (error) {
      return next(new ApiError());
    }
  } else {
    return res.status(200).send({ message: "It's possible to use" });
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  let exUser;
  try {
    exUser = await User.findOne({ where: { email } });
  } catch (error) {
    return new ApiError();
  }

  if (!exUser) {
    return next(new InvalidIdPasswordError());
  }

  try {
    const result = await bcrypt.compare(password, exUser.password);
    if (result) {
      req.body = { nickname: exUser.nickname };
      return next();
    }
  } catch (error) {
    return next(new ApiError());
  }
}

/*
exports.getGoogleUserInfo = async (req, res, next) => {
};
*/

module.exports = {
  getNaverUserInfo,
  join,
  login,
  joinSocialUser,
};
