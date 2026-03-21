import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const JWT_SECRET =
  process.env.JWT_SECRET || 'nexora-secret-change-in-prod-min-32-chars!!';
const IS_DEV = process.env.NODE_ENV !== 'production';

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── POST /otp/request ────────────────────────────────────────────────────────
authRouter.post('/otp/request', authLimiter, async (req, res) => {
  const schema = z.object({ contact: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Email or phone required' });

  const { contact } = parsed.data;

  try {
    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: { contact, used: false },
      data: { used: true },
    });

    const code = IS_DEV ? '123456' : generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const isEmail = contact.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: contact } : { phone: contact },
    });

    await prisma.otpCode.create({
      data: { code, contact, expiresAt, userId: user?.id },
    });

    logger.info(`[OTP] ${contact} → ${IS_DEV ? code : '******'}`);

    // Production: send via email/SMS here
    // if (!IS_DEV) await sendOtpEmail(contact, code);

    return res.json({
      message: 'OTP sent',
      ...(IS_DEV && { devOtp: code }),
    });
  } catch (err) {
    logger.error(`[OTP request] ${err}`);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ─── POST /otp/verify ─────────────────────────────────────────────────────────
authRouter.post('/otp/verify', authLimiter, async (req, res) => {
  const schema = z.object({
    contact: z.string().min(3),
    code: z.string().length(6),
    name: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid input' });

  const { contact, code, name } = parsed.data;
  const isEmail = contact.includes('@');

  try {
    const otp = await prisma.otpCode.findFirst({
      where: { contact, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp)
      return res.status(401).json({ error: 'Invalid or expired code' });

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    let user = await prisma.user.findFirst({
      where: isEmail ? { email: contact } : { phone: contact },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || (isEmail ? contact.split('@')[0] : 'User'),
          email: isEmail ? contact : undefined,
          phone: !isEmail ? contact : undefined,
          role: 'COORDINATOR',
        },
      });
      logger.info(`[Auth] New user: ${user.id}`);
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: payload });
  } catch (err) {
    logger.error(`[OTP verify] ${err}`);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── GET /me ──────────────────────────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.json(req.user);
  }
});

// ─── PATCH /me ────────────────────────────────────────────────────────────────
authRouter.patch('/me', authenticate, async (req: AuthRequest, res) => {
  const { name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }) },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
