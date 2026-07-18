import rateLimit from 'express-rate-limit';

// Brute-force protection untuk endpoint auth
// 10 request / 15 menit per IP
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,

    message:
      'Too many attempts, please try again later',
  },
});

export default authRateLimit;
