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
  coordinator: { include: { user: { select: { id: true, name: true } } } },
  problemStatement: { select: { id: true, title: true } },
};

const mapTeam = (t: any) => ({
  ...t,
  coordinator: t.coordinator
    ? { id: t.coordinator.userId, name: t.coordinator.user?.name ?? 'Unknown' }
    : null,
});

const VALID_STATUSES: TeamStatus[] = [
  'REGISTERED', 'CHECKED_IN', 'ACTIVE', 'SUBMITTED', 'DISQUALIFIED',
];

// GET search
teamsRouter.get('/search', async (req: AuthRequest, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.json([]);
  try {
    const teams = await prisma.team.findMany({
      where: {
        hackathonId: req.params.hackathonId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { participants: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      include: teamInclude,
      take: 8,
    });
    res.json(teams.map(mapTeam));
  } catch { res.json([]); }
});

// GET all teams
teamsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, search, coordinatorId } = req.query;
    const isCoordinator = req.user?.role === 'COORDINATOR';
    let coordFilter: Record<string, any> = {};

    if (isCoordinator) {
      const a = await prisma.coordinatorAssignment.findFirst({
        where: { hackathonId: req.params.hackathonId, userId: req.user!.id },
      });
      coordFilter = a ? { coordinatorId: a.id } : { id: '__NONE__' };
    }
    if (coordinatorId && typeof coordinatorId === 'string') {
      coordFilter = { coordinatorId };
    }

    const teams = await prisma.team.findMany({
      where: {
        hackathonId: req.params.hackathonId,
        ...(status && VALID_STATUSES.includes(status as TeamStatus)
          ? { status: status as TeamStatus }
          : {}),
        ...(search && typeof search === 'string'
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { room: { contains: search, mode: 'insensitive' } },
                { participants: { some: { name: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
        ...coordFilter,
      },
      include: teamInclude,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(teams.map(mapTeam));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch teams', details: err.message });
  }
});

// GET single team
teamsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const team = await prisma.team.findFirst({
      where: { id: req.params.id, hackathonId: req.params.hackathonId },
      include: teamInclude,
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(mapTeam(team));
  } catch { res.status(500).json({ error: 'Failed to fetch team' }); }
});

// PATCH update team
teamsRouter.patch('/:id', async (req: AuthRequest, res) => {
  const {
    status, room, tableNumber, notes, coordinatorId,
    projectName, projectUrl, leaderPhone, problemStatementId,
  } = req.body;
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(status && VALID_STATUSES.includes(status) && { status }),
        ...(room !== undefined && { room: room || null }),
        ...(tableNumber !== undefined && { tableNumber: tableNumber || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(coordinatorId !== undefined && { coordinatorId: coordinatorId || null }),
        ...(projectName !== undefined && { projectName: projectName || null }),
        ...(projectUrl !== undefined && { projectUrl: projectUrl || null }),
        ...(leaderPhone !== undefined && { leaderPhone: leaderPhone || null }),
        ...(problemStatementId !== undefined && { problemStatementId: problemStatementId || null }),
      },
      include: teamInclude,
    });

    prisma.activityLog.create({
      data: {
        action: `Team "${team.name}" updated`,
        hackathonId: req.params.hackathonId,
        actorId: req.user!.id,
        teamId: team.id,
        teamName: team.name,
        metadata: req.body,
      },
    }).catch(() => {});

    const mapped = mapTeam(team);
    emitToHackathon(io, req.params.hackathonId, 'team:updated', mapped);
    getMetrics(req.params.hackathonId)
      .then((m) => emitToHackathon(io, req.params.hackathonId, 'metrics:updated', m))
      .catch(() => {});
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update team', details: err.message });
  }
});

// POST check-in
teamsRouter.post('/:id/checkin', async (req: AuthRequest, res) => {
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: { status: 'CHECKED_IN', checkInTime: new Date() },
      include: teamInclude,
    });
    prisma.activityLog.create({
      data: {
        action: `Team "${team.name}" checked in`,
        hackathonId: req.params.hackathonId,
        actorId: req.user!.id,
        teamId: team.id,
        teamName: team.name,
      },
    }).catch(() => {});
    const mapped = mapTeam(team);
    emitToHackathon(io, req.params.hackathonId, 'team:checkin', { team: mapped, timestamp: new Date() });
    emitToHackathon(io, req.params.hackathonId, 'team:updated', mapped);
    getMetrics(req.params.hackathonId)
      .then((m) => emitToHackathon(io, req.params.hackathonId, 'metrics:updated', m))
      .catch(() => {});
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check in', details: err.message });
  }
});

// POST undo check-in
teamsRouter.post('/:id/undo-checkin', async (req: AuthRequest, res) => {
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: { status: 'REGISTERED', checkInTime: null },
      include: teamInclude,
    });
    const mapped = mapTeam(team);
    emitToHackathon(io, req.params.hackathonId, 'team:updated', mapped);
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to undo check-in', details: err.message });
  }
});

// POST create team
teamsRouter.post('/', async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1),
    leaderPhone: z.string().optional(),
    room: z.string().optional(),
    participants: z.array(z.object({
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      isLeader: z.boolean().default(false),
    })).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });

  try {
    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        hackathonId: req.params.hackathonId,
        leaderPhone: parsed.data.leaderPhone,
        room: parsed.data.room,
        participants: parsed.data.participants
          ? { create: parsed.data.participants }
          : undefined,
      },
      include: teamInclude,
    });
    res.status(201).json(mapTeam(team));
  } catch (err: any) {
    if (err.code === 'P2002')
      return res.status(409).json({ error: 'Team name already exists in this hackathon' });
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// DELETE team
teamsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});
