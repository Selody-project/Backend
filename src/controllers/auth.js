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

// 구글 소셜 로그인
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
    // 구글로부터 사용자 정보를 얻어옴
    request(userInfoOptions, async (error, response, body) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error');
      } else {
        userInfo = JSON.parse(body);

        // 랜덤한 문자열 생성
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
          // 중복일 경우 다시 생성
          // eslint-disable-next-line no-await-in-loop
          duplicate = await User.findOne({ where: { nickname: `google-${randomString}}` } });
          if (!duplicate) {
            break;
          }
        }

        // email, nickname, profileImage, snsId 값을 초기화
        const { email } = userInfo;
        const name = `google-${randomString}`;
        const { picture } = userInfo;
        const { sub } = userInfo;

        // 해당 이메일의 아이디가 있는 경우에는 find 없는 경우에은 create
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

        // 기존에 있는 아이디인 경우 소셜 아이디의 profileImage부분만 업데이트
        if (!created) {
          user.profileImage = picture;
        }

        // 다음 미들웨어로 user를 넘겨줌
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

// 네이버 유저 정보 요청
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

// 네이버 유저 회원 가입
async function joinNaverUser(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    // 랜덤한 문자열 생성
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
      // 중복일 경우 다시 생성
      // eslint-disable-next-line no-await-in-loop
      duplicate = await User.findOne({ where: { nickname: `naver-${randomString}}` } });
      if (!duplicate) {
        break;
      }
    }

    // 초기 닉네임으로 랜덤한 문자열을 사용
    const nickname = `naver-${randomString}`;

    // 해당 이메일의 아이디가 있는 경우에는 find 없는 경우에은 create
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

    // 기존에 있는 아이디인 경우 소셜 아이디의 profileImage부분만 업데이트
    if (!created) {
      user.profileImage = req.body.profile_image;
    }

    // 다음 미들웨어로 유저를 넘겨줌
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

// 회원 가입
async function join(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { error: bodyError } = validateJoinSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { email, nickname, password } = req.body;

    // 이미 존재하는 닉네임인 경우 Error
    if (nickname) {
      const user = await User.findOne({ where: { nickname } });
      if (user) {
        throw (new DuplicateNicknameError());
      }
    }

    // 이미 존재하는 이메일인 경우 Error
    if (email) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        throw (new DuplicateEmailError());
      }
    }

    // 회원가입 처리
    if (email && nickname && password) {
      const hash = await bcrypt.hash(password, 12);
      req.user = await User.create({
        email,
        nickname,
        password: hash,
        provider: 'local',
      }, { transaction });

      // createToken 미들웨어에서 토큰을 발급하기 위해 nickname을 createtoken미들웨어로 넘겨줌
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

// 로그인
async function login(req, res, next) {
  try {
    const { error: bodyError } = validateLoginSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { email, password } = req.body;

    // 존재하는 email인지 검색
    const user = await User.findOne({ where: { email } });

    // 존재하지 않는 유저인 경우 Error
    if (!user) {
      throw (new InvalidIdPasswordError());
    }

    // 비밀번호 비교 후, 동일하면 createToken 미들웨어로 이동
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      req.user = user;
      return next();
    }

    // 동일하지 않은 경우, Error
    throw (new InvalidIdPasswordError());
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 로그 아웃 (브라우저에 저장되어 있는 쿠키를 삭제)
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
