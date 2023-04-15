const request = require('request');
const User = require('../models/user');

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
    } else {
      console.log('error');
      if (response != null) {
        res.status(response.statusCode).end();
        console.log(`error = ${response.statusCode}`);
      }
    }
  });
};

/*
exports.getGoogleUserInfo = async (req, res, next) => {
  console.log("asdfasdfasdfasdf");
};
*/

exports.createSocialUser = async (req, res, next) => {
  const exUser = await User.findOne({ where: { snsId: req.body.id } });
  if (!exUser) {
    await User.create({
      nick: req.body.nickname,
      provider: 'NAVER',
      snsId: req.body.id,
    });
  }
  next();
};
