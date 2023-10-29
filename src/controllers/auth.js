const request = require('request');
const bcrypt = require('bcrypt');
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

async function getGoogleUserInfo(req, res, next) {
  try {
    const { access_token: accessToken } = req.body;
    if (!accessToken) throw (new InvalidTokenError());

    // 사용자 정보 요청
    const userInfoURL = 'https://www.googleapis.com/oauth2/v3/userinfo';

    const userInfoOptions = {
      url: userInfoURL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    let userInfo;
    request(userInfoOptions, async (error, response, body) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error');
      } else {
        userInfo = JSON.parse(body);

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const codeLength = 12;
        let randomString = '';
        let duplicate = null;

        while (true) {
          randomString = '';
          for (let i = 0; i < codeLength; i += 1) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomIndex);
          }
          // eslint-disable-next-line no-await-in-loop
          duplicate = await User.findOne({ where: { nickname: `google-${randomString}}` } });
          if (!duplicate) {
            break;
          }
        }

        const { email } = userInfo;
        const name = `google-${randomString}`;
        const { picture } = userInfo;
        const { sub } = userInfo;

        const [user, created] = await User.findCreateFind({
          where: { email },
          defaults: {
            email,
            nickname: name,
            provider: 'GOOGLE',
            snsId: sub,
            profileImage: picture,
          },
        });

        if (!created) {
          user.profileImage = picture;
        }
        req.user = user;
        return next();
      }
    });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function joinNaverUser(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeLength = 12;
    let randomString = '';
    let duplicate = null;

    while (true) {
      randomString = '';
      for (let i = 0; i < codeLength; i += 1) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
      }
      // eslint-disable-next-line no-await-in-loop
      duplicate = await User.findOne({ where: { nickname: `naver-${randomString}}` } });
      if (!duplicate) {
        break;
      }
    }
    const nickname = `naver-${randomString}`;

    const [user, created] = await User.findCreateFind({
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
    if (!created) {
      user.profileImage = req.body.profile_image;
    }
    req.user = user;
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
    transaction = await sequelize.transaction();
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
      }, { transaction });
      req.nickname = nickname;
      await transaction.commit();
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
  joinNaverUser,
  getGoogleUserInfo,
  join,
  login,
  logout,
};
