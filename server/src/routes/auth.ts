import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nexora-secret-change-in-prod';

// ─── MOCK OTP REQUEST (SAFE FOR DEV) ──────────────────────────────────────────
authRouter.post('/otp/request', authLimiter, async (req, res) => {
  const schema = z.object({
    contact: z.string().min(3),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email or phone required' });
  }

  const { contact } = parsed.data;

  // 🚀 MOCK RESPONSE (NO DB, NO FAILURES)
  logger.info(`[MOCK OTP] ${contact} → 123456`);

  return res.json({
    message: 'OTP sent (mock)',
    devOtp: '123456',
  });
});

// ─── MOCK OTP VERIFY ──────────────────────────────────────────────────────────
authRouter.post('/otp/verify', authLimiter, async (req, res) => {
  const schema = z.object({
    contact: z.string().min(3),
    code: z.string().length(6),
    name: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { contact, code, name } = parsed.data;

  // 🚀 MOCK VALIDATION
  if (code !== '123456') {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  const isEmail = contact.includes('@');

  const fakeUser = {
    id: 'demo-user',
    name: name || 'User',
    email: isEmail ? contact : null,
    phone: !isEmail ? contact : null,
    role: 'SUPER_ADMIN',
  };

  const token = jwt.sign(fakeUser, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: fakeUser,
  });
});

// ─── ME (mock safe) ───────────────────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json(req.user);
});
