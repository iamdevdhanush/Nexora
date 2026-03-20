import { Server } from 'socket.io';
import { logger } from './logger';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    logger.info(`[WS] Connected: ${socket.id}`);

    socket.on('join:hackathon', (hackathonId: string) => {
      socket.join(`hackathon:${hackathonId}`);
      logger.info(`[WS] ${socket.id} joined hackathon:${hackathonId}`);
    });

    socket.on('leave:hackathon', (hackathonId: string) => {
      socket.leave(`hackathon:${hackathonId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[WS] Disconnected: ${socket.id}`);
    });
  });
};

export const emitToHackathon = (io: Server, hackathonId: string, event: string, payload: unknown) => {
  io.to(`hackathon:${hackathonId}`).emit(event, { hackathonId, payload });
};
