import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { emitToHackathon } from '../lib/socket';

interface TeamTarget {
  id: string;
  name: string;
  leaderPhone?: string | null;
}

const queue: Array<() => Promise<void>> = [];
let processing = false;

setInterval(async () => {
  if (processing || queue.length === 0) return;
  processing = true;
  try {
    await queue.shift()?.();
  } catch (e) {
    logger.error(`[Queue] ${e}`);
  }
  processing = false;
}, 300);

export const enqueueMessages = (
  messageId: string,
  teams: TeamTarget[],
  content: string,
  channel: string,
  hackathonId: string,
  io: Server
) => {
  for (const team of teams) {
    queue.push(() =>
      sendToTeam(messageId, team, content, channel, hackathonId, io)
    );
  }
  logger.info(`[Queue] Enqueued ${teams.length} messages`);
};

const sendToTeam = async (
  messageId: string,
  team: TeamTarget,
  _content: string,
  _channel: string,
  hackathonId: string,
  io: Server
) => {
  await new Promise((r) => setTimeout(r, 150 + Math.random() * 100));
  try {
    const recipient = await prisma.messageRecipient.findFirst({
      where: { messageId, teamId: team.id },
    });
    if (!recipient) return;

    // Mock: 90% success if team has a phone
    const success = !!team.leaderPhone && Math.random() > 0.1;

    await prisma.messageRecipient.update({
      where: { id: recipient.id },
      data: {
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : undefined,
        error: success ? undefined : 'No phone / delivery failed',
      },
    });

    // Check if whole message is done
    const all = await prisma.messageRecipient.findMany({ where: { messageId } });
    const allDone = all.every((r) => r.status === 'SENT' || r.status === 'FAILED');
    if (allDone) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: all.some((r) => r.status === 'FAILED') ? 'FAILED' : 'SENT',
        },
      });
    }

    emitToHackathon(io, hackathonId, 'message:status', {
      messageId,
      teamId: team.id,
      status: success ? 'SENT' : 'FAILED',
    });
  } catch (e) {
    logger.error(`[Queue] Send error: ${e}`);
  }
};
