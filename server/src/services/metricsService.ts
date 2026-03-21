import { prisma } from '../lib/prisma';

export const getMetrics = async (hackathonId: string) => {
  const [total, checkedIn, active, submitted, participants, messages] =
    await Promise.all([
      prisma.team.count({ where: { hackathonId } }),
      prisma.team.count({ where: { hackathonId, status: 'CHECKED_IN' } }),
      prisma.team.count({ where: { hackathonId, status: 'ACTIVE' } }),
      prisma.team.count({ where: { hackathonId, status: 'SUBMITTED' } }),
      prisma.participant.count({ where: { team: { hackathonId } } }),
      prisma.message.count({
        where: {
          hackathonId,
          sentAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
    ]);

  const checkedInAll = checkedIn + active + submitted;
  return {
    totalTeams: total,
    checkedIn: checkedInAll,
    checkedInPercent: total ? Math.round((checkedInAll / total) * 100) : 0,
    active,
    submitted,
    missing: total - checkedInAll,
    totalParticipants: participants,
    messagesToday: messages,
  };
};
