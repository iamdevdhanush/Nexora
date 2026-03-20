import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const coordinatorsRouter = Router({ mergeParams: true });
coordinatorsRouter.use(authenticate);

// GET coordinators for a hackathon
coordinatorsRouter.get('/', async (req: AuthRequest, res) => {
  const assignments = await prisma.coordinatorAssignment.findMany({
    where: { hackathonId: req.params.hackathonId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      _count: { select: { teams: true } },
    },
  });
  res.json(assignments.map((a) => ({
    assignmentId: a.id,
    ...a.user,
    assignedTeamCount: a._count.teams,
  })));
});

// POST add coordinator to hackathon
coordinatorsRouter.post('/', requireAdmin, async (req: AuthRequest, res) => {
  const schema = z.object({
    contact: z.string().min(3),
    name: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { contact, name } = parsed.data;
  const isEmail = contact.includes('@');

  // Find or create user
  let user = await prisma.user.findFirst({
    where: isEmail ? { email: contact } : { phone: contact },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email: isEmail ? contact : undefined,
        phone: !isEmail ? contact : undefined,
        role: 'COORDINATOR',
      },
    });
  }

  // Create assignment (upsert)
  const assignment = await prisma.coordinatorAssignment.upsert({
    where: { hackathonId_userId: { hackathonId: req.params.hackathonId, userId: user.id } },
    update: {},
    create: { hackathonId: req.params.hackathonId, userId: user.id },
  });

  res.json({ assignmentId: assignment.id, ...user, assignedTeamCount: 0 });
});

// DELETE remove coordinator from hackathon
coordinatorsRouter.delete('/:assignmentId', requireAdmin, async (req, res) => {
  await prisma.coordinatorAssignment.delete({ where: { id: req.params.assignmentId } });
  res.json({ success: true });
});
