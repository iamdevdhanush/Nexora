import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth';
import { hackathonsRouter } from './routes/hackathons';
import { teamsRouter } from './routes/teams';
import { coordinatorsRouter } from './routes/coordinators';
import { messagesRouter } from './routes/messages';
import {
  metricsRouter,
  activityRouter,
  sheetsRouter,
  certificatesRouter,
} from './routes/other';
import { inviteRouter } from './routes/invites';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { setupSocketHandlers } from './lib/socket';
import { logger } from './lib/logger';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Trust proxy for rate limiting (Render, etc.)
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173',
];

export const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        cb(null, true);
      } else {
        cb(null, true); // Allow all in dev; tighten in prod
      }
    },
    credentials: true,
  },
  path: '/socket.io',
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on all /api routes
app.use('/api', apiLimiter);

// ════════ ROUTES ════════
// Auth — /api/auth/*
app.use('/api/auth', authRouter);

// Hackathons — /api/hackathons/*
app.use('/api/hackathons', hackathonsRouter);

// Teams — /api/hackathons/:hackathonId/teams/*
app.use('/api/hackathons/:hackathonId/teams', teamsRouter);

// Coordinators — /api/hackathons/:hackathonId/coordinators/*
app.use('/api/hackathons/:hackathonId/coordinators', coordinatorsRouter);

// Messages — /api/hackathons/:hackathonId/messages/*
app.use('/api/hackathons/:hackathonId/messages', messagesRouter);

// Certificates — /api/hackathons/:hackathonId/certificates/*
app.use('/api/hackathons/:hackathonId/certificates', certificatesRouter);

// Metrics — /api/hackathons/:hackathonId/metrics/*
app.use('/api/hackathons/:hackathonId/metrics', metricsRouter);

// Activity — /api/hackathons/:hackathonId/activity/*
app.use('/api/hackathons/:hackathonId/activity', activityRouter);

// Sheets — /api/hackathons/:hackathonId/sheets/*
app.use('/api/hackathons/:hackathonId/sheets', sheetsRouter);

// Invites — /api/invites/*
app.use('/api/invites', inviteRouter);

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// Error handler (must be last)
app.use(errorHandler);

// Socket.io
setupSocketHandlers(io);

// Start server
const PORT = parseInt(process.env.PORT || '4000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(
    `🚀 Nexora API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
  );
  logger.info(`📡 Socket.io enabled`);
});

export default app;
