import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many attempts' } });
export const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, message: { error: 'Too many requests' } });
