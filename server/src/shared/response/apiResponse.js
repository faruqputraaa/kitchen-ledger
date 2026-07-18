export const successResponse = (
  res,
  { statusCode = 200, message = 'Success', data = null, pagination = null, meta = null } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
    meta,
  });
};

export const errorResponse = (
  res,
  { statusCode = 500, message = 'Internal Server Error', errors = null } = {}
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
