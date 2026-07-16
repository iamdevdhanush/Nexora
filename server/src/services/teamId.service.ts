import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';

const MAX_RETRIES = 10;

export async function generateTeamId(hackathonId: string): Promise<string> {
  const hackathon = await prisma.hackathon.findUnique({
    where: { id: hackathonId },
    select: { slug: true, name: true },
  });

  if (!hackathon) throw new Error('Hackathon not found');

  const code = (hackathon.slug || hackathon.name)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const lastTeam = await prisma.team.findFirst({
      where: { hackathonId, teamId: { startsWith: `NEX-${code}-` } },
      orderBy: { teamId: 'desc' },
      select: { teamId: true },
    });

    let nextNum = 1;
    if (lastTeam?.teamId) {
      const parts = lastTeam.teamId.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    // Add jitter for concurrent calls by adding attempt offset
    nextNum += attempt;

    const teamId = `NEX-${code}-${String(nextNum).padStart(3, '0')}`;

    const existing = await prisma.team.findUnique({ where: { teamId } });
    if (!existing) return teamId;
  }

  throw new Error('Failed to generate unique team ID after maximum retries');
}

export async function generateQrToken(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const token = `qr-${randomBytes(16).toString('hex')}`;
    const existing = await prisma.team.findUnique({ where: { qrToken: token } });
    if (!existing) return token;
  }
  throw new Error('Failed to generate unique QR token after maximum retries');
}

export function generateRegistrationId(slug: string, sequence: number): string {
  const code = slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `REG-${code}-${String(sequence).padStart(4, '0')}`;
}
