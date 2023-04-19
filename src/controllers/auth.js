const request = require('request');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const User = require('../models/user');

const { Op } = Sequelize;

exports.getNaverUserInfo = async (req, res, next) => {
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
      // res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      req.body = JSON.parse(body).response;
      next();
    } else if (response != null) {
      res.status(response.statusCode).end();
      // console.log(`error = ${response.statusCode}`);
    }
  });
};

/*
exports.getGoogleUserInfo = async (req, res, next) => {
  console.log("asdfasdfasdfasdf");
};
*/

exports.joinSocialUser = async (req, res, next) => {
  const exUser = await User.findOne({ where: { snsId: req.body.id } });
  if (!exUser) {
    await User.create({
      nickname: req.body.nickname,
      provider: 'NAVER',
      snsId: req.body.id,
    });
  }
  next();
};

exports.join = async (req, res, next) => {
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
    res.status(409).send({ message: 'Already exists' });
  } else if (email && nickname && password) {
    try {
      const hash = await bcrypt.hash(password, 12);
      await User.create({
        email,
        nickname,
        password: hash,
        provider: 'local',
      });
      next();
    } catch (error) {
      next(error);
    }
  } else {
    res.status(200).send({ message: "It's possible to use" });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const exUser = await User.findOne({ where: { email } });
  if (exUser) {
    try {
      const result = await bcrypt.compare(password, exUser.password);
      if (result) {
        req.body = { nickname: exUser.nickname };
        next();
      }
    } catch (error) {
      return next(error);
    }
  } else {
    res.status(401).send({ message: 'Invalid User ID/Password' });
  }
};
