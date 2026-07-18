import env from '#config/env';

const cookieConfig = {
  refreshToken: {
    httpOnly: true,

    secure:
      env.nodeEnv === 'production',

    sameSite: 'lax',

    path: '/api/v1/auth',

    maxAge:
      7 *
      24 *
      60 *
      60 *
      1000,
  },
};

export default cookieConfig;