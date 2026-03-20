import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const hackathonsRouter = Router();
hackathonsRouter.use(authenticate);

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  maxTeams: z.number().optional(),
});

// GET all hackathons for current user
hackathonsRouter.get('/', async (req: AuthRequest, res) => {
  const isAdmin = req.user?.role === 'SUPER_ADMIN';

  const hackathons = isAdmin
    ? await prisma.hackathon.findMany({
        orderBy: { createdAt: 'desc' }
      })
    : await prisma.hackathon.findMany({
        where: {
          assignments: { some: { userId: req.user!.id } },
        },
        orderBy: { createdAt: 'desc' }
      });

  res.json(hackathons);
});

// GET single hackathon
hackathonsRouter.get('/:id', async (req, res) => {
  const h = await prisma.hackathon.findUnique({
    where: { id: req.params.id }
  });

  if (!h) return res.status(404).json({ error: 'Not found' });

  res.json(h);
});

// POST create hackathon (admin only)
hackathonsRouter.post('/', requireAdmin, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parsed.error.errors
    });
  }

  const h = await prisma.hackathon.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      createdById: req.user!.id,
    },
  });

  res.status(201).json(h);
});

// PATCH update hackathon
hackathonsRouter.patch('/:id', requireAdmin, async (req, res) => {
  const { name, description, venue, startDate, endDate, status, maxTeams } = req.body;

  const h = await prisma.hackathon.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(venue !== undefined && { venue }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(status && { status }),
      ...(maxTeams !== undefined && { maxTeams }),
    },
  });

  res.json(h);
});

// DELETE hackathon
hackathonsRouter.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.hackathon.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
