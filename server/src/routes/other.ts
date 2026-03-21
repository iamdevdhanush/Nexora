import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { getMetrics } from '../services/metricsService';

// ─── Metrics ──────────────────────────────────────────────────────────────────
export const metricsRouter = Router({ mergeParams: true });
metricsRouter.use(authenticate);
metricsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    res.json(await getMetrics(req.params.hackathonId!));
  } catch {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ─── Activity ─────────────────────────────────────────────────────────────────
export const activityRouter = Router({ mergeParams: true });
activityRouter.use(authenticate);
activityRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { hackathonId: req.params.hackathonId! },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// ─── Google Sheets Sync ───────────────────────────────────────────────────────
export const sheetsRouter = Router({ mergeParams: true });
sheetsRouter.use(authenticate);

sheetsRouter.post('/sync', requireAdmin, async (req: AuthRequest, res) => {
  const { sheetId, range = 'Sheet1!A:Z' } = req.body;
  if (!sheetId) return res.status(400).json({ error: 'sheetId required' });

  const hackathonId = req.params.hackathonId!;
  let rows: string[][];

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
      const r = await fetch(url);
      if (!r.ok)
        return res.status(400).json({ error: `Sheets API error: ${r.status}` });
      const data = (await r.json()) as any;
      rows = data.values || [];
    } else {
      rows = [
        ['Timestamp', 'Team Name', 'Member 1', 'Member 2', 'Member 3', 'Leader Phone'],
        ['2024-01-01', 'AlphaBuilders', 'John Doe', 'Jane Smith', 'Bob Lee', '+919000000001'],
        ['2024-01-01', 'BetaLabs', 'Alice Wang', 'Carlos Ruiz', '', '+919000000002'],
      ];
    }

    if (rows.length < 2) return res.json({ created: 0, updated: 0, skipped: 0 });

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const teamNameIdx = headers.findIndex((h) => h.includes('team'));
    const phoneIdx = headers.findIndex(
      (h) => h.includes('phone') || h.includes('mobile')
    );
    const memberIndices = headers
      .map((h, i) =>
        h.includes('member') || (h.includes('name') && i !== teamNameIdx) ? i : -1
      )
      .filter((i) => i !== -1);

    let created = 0, updated = 0, skipped = 0;

    for (const row of rows.slice(1)) {
      const teamName = row[teamNameIdx]?.trim();
      if (!teamName) { skipped++; continue; }
      const leaderPhone = phoneIdx >= 0 ? row[phoneIdx]?.trim() : undefined;
      const memberNames = memberIndices.map((i) => row[i]?.trim()).filter(Boolean);

      try {
        const existing = await prisma.team.findFirst({
          where: { hackathonId, name: teamName },
        });
        if (existing) {
          await prisma.team.update({
            where: { id: existing.id },
            data: { leaderPhone: leaderPhone || existing.leaderPhone },
          });
          updated++;
        } else {
          await prisma.team.create({
            data: {
              hackathonId,
              name: teamName,
              leaderPhone,
              participants: {
                create: memberNames.map((name, idx) => ({
                  name,
                  isLeader: idx === 0,
                  phone: idx === 0 ? leaderPhone : undefined,
                })),
              },
            },
          });
          created++;
        }
      } catch { skipped++; }
    }

    await prisma.activityLog.create({
      data: {
        action: `Sheets synced: ${created} created, ${updated} updated`,
        hackathonId,
        actorId: req.user!.id,
      },
    });

    res.json({ created, updated, skipped });
  } catch (err: any) {
    res.status(500).json({ error: 'Sheets sync failed', details: err.message });
  }
});

// ─── Certificates ─────────────────────────────────────────────────────────────
export const certificatesRouter = Router({ mergeParams: true });
certificatesRouter.use(authenticate);

certificatesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { hackathonId: req.params.hackathonId! },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(certs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

certificatesRouter.post('/generate', requireAdmin, async (req: AuthRequest, res) => {
  const { teamIds, type = 'PARTICIPATION' } = req.body;
  const hackathonId = req.params.hackathonId!;

  try {
    const teams = await prisma.team.findMany({
      where: teamIds ? { hackathonId, id: { in: teamIds } } : { hackathonId },
      include: { participants: true },
    });

    let created = 0;
    for (const team of teams) {
      for (const p of team.participants) {
        if (!p.email) continue;
        await prisma.certificate.upsert({
          where: { id: `cert-${team.id}-${p.id}` },
          update: {},
          create: {
            id: `cert-${team.id}-${p.id}`,
            hackathonId,
            teamId: team.id,
            participantName: p.name,
            email: p.email,
            type,
            status: 'PENDING',
          },
        });
        created++;
      }
    }

    res.json({ created, message: `${created} certificates queued` });
  } catch {
    res.status(500).json({ error: 'Failed to generate certificates' });
  }
});

certificatesRouter.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const cert = await prisma.certificate.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(cert);
  } catch {
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// ─── Problem Statements ───────────────────────────────────────────────────────
export const problemsRouter = Router({ mergeParams: true });
problemsRouter.use(authenticate);

problemsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const problems = await prisma.problemStatement.findMany({
      where: { hackathonId: req.params.hackathonId! },
      include: { _count: { select: { teams: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(problems);
  } catch {
    res.status(500).json({ error: 'Failed to fetch problem statements' });
  }
});

problemsRouter.post('/', requireAdmin, async (req: AuthRequest, res) => {
  const { title, description } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'title and description required' });
  try {
    const problem = await prisma.problemStatement.create({
      data: { title, description, hackathonId: req.params.hackathonId! },
    });
    res.status(201).json(problem);
  } catch {
    res.status(500).json({ error: 'Failed to create problem statement' });
  }
});

problemsRouter.patch('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const problem = await prisma.problemStatement.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(problem);
  } catch {
    res.status(500).json({ error: 'Failed to update problem statement' });
  }
});

problemsRouter.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.problemStatement.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete problem statement' });
  }
});
