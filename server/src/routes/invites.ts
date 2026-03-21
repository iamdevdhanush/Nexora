import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';

export const inviteRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nexora-secret-change-in-prod-min-32-chars!!';

// POST /api/invites — generate invite link for a hackathon
inviteRouter.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const schema = z.object({
    hackathonId: z.string(),
    expiresInDays: z.number().min(1).max(30).optional().default(7),
    requireApproval: z.boolean().optional().default(false),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { hackathonId, expiresInDays, requireApproval } = parsed.data;

  try {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 3600000);

    const invite = await prisma.inviteLink.create({
      data: {
        hackathonId,
        createdById: req.user!.id,
        expiresAt,
        approved: !requireApproval,
      },
    });

    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${invite.token}`;
    const message = `Hi, I've created a hackathon on Nexora — "${hackathon.name}". Join as a coordinator using this link: ${inviteUrl}`;

    res.json({
      token: invite.token,
      url: inviteUrl,
      expiresAt: invite.expiresAt,
      message,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create invite', details: err.message });
  }
});

// GET /api/invites/:token — preview invite info (no auth required)
inviteRouter.get('/:token', async (req, res) => {
  try {
    const invite = await prisma.inviteLink.findUnique({
      where: { token: req.params.token },
      include: {
        hackathon: {
          select: { id: true, name: true, description: true, venue: true, startDate: true, endDate: true, status: true },
        },
        createdBy: { select: { name: true } },
      },
    });

    if (!invite) return res.status(404).json({ error: 'Invite not found or expired' });
    if (invite.expiresAt && invite.expiresAt < new Date())
      return res.status(410).json({ error: 'Invite link has expired' });
    if (invite.usedAt)
      return res.status(409).json({ error: 'Invite has already been used' });

    res.json({
      hackathon: invite.hackathon,
      createdBy: invite.createdBy.name,
      expiresAt: invite.expiresAt,
      requiresApproval: !invite.approved,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch invite' });
  }
});

// POST /api/invites/:token/accept — accept invite (requires auth)
inviteRouter.post('/:token/accept', authenticate, async (req: AuthRequest, res) => {
  try {
    const invite = await prisma.inviteLink.findUnique({
      where: { token: req.params.token },
      include: { hackathon: true },
    });

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.expiresAt && invite.expiresAt < new Date())
      return res.status(410).json({ error: 'Invite link has expired' });
    if (invite.usedAt)
      return res.status(409).json({ error: 'Invite has already been used' });

    // Add coordinator to hackathon
    await prisma.coordinatorAssignment.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: invite.hackathonId,
          userId: req.user!.id,
        },
      },
      update: {},
      create: {
        hackathonId: invite.hackathonId,
        userId: req.user!.id,
      },
    });

    // Mark invite as used
    await prisma.inviteLink.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedBy: req.user!.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `${req.user!.name} joined as coordinator via invite`,
        hackathonId: invite.hackathonId,
        actorId: req.user!.id,
      },
    });

    res.json({ success: true, hackathon: invite.hackathon });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to accept invite', details: err.message });
  }
});

// GET /api/hackathons/:hackathonId/invites — list invites for a hackathon
inviteRouter.get('/hackathon/:hackathonId', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const invites = await prisma.inviteLink.findMany({
      where: { hackathonId: req.params.hackathonId },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invites.map((i) => ({
      ...i,
      url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${i.token}`,
      isExpired: i.expiresAt ? i.expiresAt < new Date() : false,
    })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});
