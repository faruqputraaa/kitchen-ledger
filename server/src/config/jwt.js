import jwt from 'jsonwebtoken';
import env from '#config/env';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: '15m',
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret);
};
