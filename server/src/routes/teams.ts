import { Router } from 'express';
import { z } from 'zod';
import { TeamStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { emitToHackathon } from '../lib/socket';
import { getMetrics } from '../services/metricsService';

export const teamsRouter = Router({ mergeParams: true });
teamsRouter.use(authenticate);

const teamInclude = {
  participants: true,
  coordinator: {
    include: { user: { select: { id: true, name: true } } },
  },
};

const mapTeam = (t: any) => ({
  ...t,
  coordinator: t.coordinator ? { id: t.coordinator.userId, name: t.coordinator.user.name } : null,
});

// GET search (lightweight for command palette)
teamsRouter.get('/search', async (req: AuthRequest, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const teams = await prisma.team.findMany({
    where: {
      hackathonId: req.hackathonId,
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { participants: { some: { name: { contains: q as string, mode: 'insensitive' } } } },
      ],
    },
    include: teamInclude,
    take: 8,
  });
  res.json(teams.map(mapTeam));
});

// GET all teams
teamsRouter.get('/', async (req: AuthRequest, res) => {
  const { status, search, coordinatorId } = req.query;
  const isCoordinator = req.user?.role === 'COORDINATOR';

  let coordinatorFilter = {};
  if (isCoordinator) {
    const assignment = await prisma.coordinatorAssignment.findFirst({
      where: { hackathonId: req.hackathonId, userId: req.user!.id },
    });
    if (assignment) coordinatorFilter = { coordinatorId: assignment.id };
  }
  if (coordinatorId) coordinatorFilter = { coordinatorId: coordinatorId as string };

  const teams = await prisma.team.findMany({
    where: {
      hackathonId: req.hackathonId,
      ...(status ? { status: status as TeamStatus } : {}),
      ...(search ? { name: { contains: search as string, mode: 'insensitive' } } : {}),
      ...coordinatorFilter,
    },
    include: teamInclude,
    orderBy: { updatedAt: 'desc' },
  });
  res.json(teams.map(mapTeam));
});

// GET single team
teamsRouter.get('/:id', async (req: AuthRequest, res) => {
  const team = await prisma.team.findFirst({
    where: { id: req.params.id, hackathonId: req.hackathonId },
    include: teamInclude,
  });
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(mapTeam(team));
});

// PATCH update team
teamsRouter.patch('/:id', async (req: AuthRequest, res) => {
  const { status, room, tableNumber, notes, coordinatorId, projectName, projectUrl } = req.body;
  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(room !== undefined && { room }),
      ...(tableNumber !== undefined && { tableNumber }),
      ...(notes !== undefined && { notes }),
      ...(coordinatorId !== undefined && { coordinatorId }),
      ...(projectName !== undefined && { projectName }),
      ...(projectUrl !== undefined && { projectUrl }),
    },
    include: teamInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: `Team "${team.name}" updated`,
      hackathonId: req.hackathonId!,
      actorId: req.user!.id,
      teamId: team.id,
      teamName: team.name,
      metadata: req.body,
    },
  });

  const mapped = mapTeam(team);
  emitToHackathon(io, req.hackathonId!, 'team:updated', mapped);
  const metrics = await getMetrics(req.hackathonId!);
  emitToHackathon(io, req.hackathonId!, 'metrics:updated', metrics);

  res.json(mapped);
});

// POST check-in
teamsRouter.post('/:id/checkin', async (req: AuthRequest, res) => {
  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: { status: 'CHECKED_IN', checkInTime: new Date() },
    include: teamInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: `Team "${team.name}" checked in`,
      hackathonId: req.hackathonId!,
      actorId: req.user!.id,
      teamId: team.id,
      teamName: team.name,
    },
  });

  const mapped = mapTeam(team);
  emitToHackathon(io, req.hackathonId!, 'team:checkin', { team: mapped, timestamp: new Date() });
  emitToHackathon(io, req.hackathonId!, 'team:updated', mapped);
  const metrics = await getMetrics(req.hackathonId!);
  emitToHackathon(io, req.hackathonId!, 'metrics:updated', metrics);

  res.json(mapped);
});

// POST undo check-in
teamsRouter.post('/:id/undo-checkin', async (req: AuthRequest, res) => {
  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: { status: 'REGISTERED', checkInTime: null },
    include: teamInclude,
  });
  const mapped = mapTeam(team);
  emitToHackathon(io, req.hackathonId!, 'team:updated', mapped);
  res.json(mapped);
});
