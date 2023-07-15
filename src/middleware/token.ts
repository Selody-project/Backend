import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../errors/apiError';
import TokenExpireError from '../errors/auth/TokenExpireError';
import InvalidTokenError from '../errors/auth/InvalidTokenError';

const ACCESS_SECRET_KEY: string = process.env.JWT_SECRET || '';
const REFRESH_SECRET_KEY: string = process.env.JWT_SECRET || '';

interface TokenPayload {
  nickname: string;
}

const token = () => ({
  access(nickname: string): string {
    return jwt.sign({
      nickname,
    }, ACCESS_SECRET_KEY, {
      expiresIn: '60m',
      issuer: 'xernserver',
    });
  },
  refresh(nickname: string): string {
    return jwt.sign({
      nickname,
    }, REFRESH_SECRET_KEY, {
      expiresIn: '180 days',
      issuer: 'xernserver',
    });
  },
});

// jwt 발급
// nickname을 이용해 발급하므로 해당 미들웨어를 이용할 때, req에 nickname을 전달해줘야함.
function createToken(req: Request, res: Response, next: NextFunction): Response | void {
  try {
    const { nickname } = req;
    const accessToken: string = token().access(nickname);
    const refreshToken: string = token().access(nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    return res.status(200).json({
      message: 'JWT 발급에 성공하였습니다',
      nickname,
    });
  } catch (error) {
    return next(new ApiError());
  }
}

// jwt 검증
function verifyToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const authToken: string | undefined = req.cookies.accessToken;
    if (!authToken) throw new InvalidTokenError();
    const { nickname } = jwt.verify(authToken, ACCESS_SECRET_KEY) as { nickname: string };
    req.nickname = nickname;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new TokenExpireError());
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new InvalidTokenError());
    }

    return next(new ApiError());
  }
}

function renewToken(req: Request, res: Response, next: NextFunction): Response | void {
  try {
    const authToken: string | undefined = req.cookies.refreshToken;
    if (!authToken) throw new InvalidTokenError();
    const { nickname }: TokenPayload = jwt.verify(authToken, REFRESH_SECRET_KEY) as TokenPayload;
    const accessToken: string = token().access(nickname);
    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
    return res.status(200).json({
      message: 'Token renewal successful',
      nickname: req.nickname,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new TokenExpireError());
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new InvalidTokenError());
    }

    return next(new ApiError());
  }
}

export default {
  createToken,
  verifyToken,
  renewToken,
};
