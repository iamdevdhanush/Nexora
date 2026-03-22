import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { sendOtpEmail } from '../lib/mail';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nexora-secret-change-in-prod-min-32-chars!!';
const IS_DEV = process.env.NODE_ENV !== 'production';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ─── POST /auth/otp/request ─── */
authRouter.post('/otp/request', authLimiter, async (req, res) => {
  const schema = z.object({ contact: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email or phone required' });
  }
  const { contact } = parsed.data;
  const isEmail = contact.includes('@');

  try {
    // Invalidate old OTPs
    await prisma.otpCode.updateMany({
      where: { contact, used: false },
      data: { used: true },
    });

    const code = IS_DEV ? '123456' : generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: contact } : { phone: contact },
    });

    await prisma.otpCode.create({
      data: {
        code,
        contact,
        expiresAt,
        ...(user?.id ? { userId: user.id } : {}),
      },
    });

    // Send email in production
    if (!IS_DEV && isEmail) {
      try {
        await sendOtpEmail(contact, code);
      } catch (mailErr) {
        logger.error(`[OTP] Email send failed: ${mailErr}`);
        // Don't fail the request — log and continue
      }
    }

    logger.info(`[OTP] Request for ${contact} → ${IS_DEV ? code : '******'}`);

    return res.json({
      message: 'OTP sent successfully',
      ...(IS_DEV && { devOtp: code }),
    });
  } catch (err: any) {
    logger.error(`[OTP request error] ${err}`);
    return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

/* ─── POST /auth/otp/verify ─── */
authRouter.post('/otp/verify', authLimiter, async (req, res) => {
  const schema = z.object({
    contact: z.string().min(3),
    code: z.string().length(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { contact, code } = parsed.data;
  const isEmail = contact.includes('@');

  try {
    const otp = await prisma.otpCode.findFirst({
      where: {
        contact,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // Find or create user
    let user = await prisma.user.findFirst({
      where: isEmail ? { email: contact } : { phone: contact },
    });

    if (!user) {
      const defaultName = isEmail ? contact.split('@')[0] : 'User';
      user = await prisma.user.create({
        data: {
          name: defaultName,
          email: isEmail ? contact : undefined,
          phone: !isEmail ? contact : undefined,
          role: 'COORDINATOR',
        },
      });
      logger.info(`[Auth] New user created: ${user.id} (${contact})`);
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    logger.info(`[Auth] Login: ${user.id} (${contact}) role=${user.role}`);

    return res.json({ token, user: payload });
  } catch (err) {
    logger.error(`[OTP verify error] ${err}`);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

/* ─── GET /auth/me ─── */
authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch {
    return res.json(req.user);
  }
});

/* ─── PATCH /auth/me ─── */
authRouter.patch('/me', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.avatarUrl && { avatarUrl: parsed.data.avatarUrl }),
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});
