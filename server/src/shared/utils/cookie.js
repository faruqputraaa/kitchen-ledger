import cookieConfig from '#config/cookie';

export const setRefreshCookie = (
  res,
  token
) => {
  res.cookie(
    'refreshToken',
    token,
    cookieConfig.refreshToken
  );
};

export const clearRefreshCookie = (
  res
) => {
  res.clearCookie(
    'refreshToken',
    cookieConfig.refreshToken
  );
};