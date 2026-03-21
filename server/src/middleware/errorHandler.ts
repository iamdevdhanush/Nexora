import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
export const errorHandler = (err: Error & { status?: number; statusCode?: number }, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) logger.error(`[Error] ${req.method} ${req.path} → ${status}: ${message}`);
  try { res.status(status).json({ error: message }); } catch { res.status(500).send('Internal server error'); }
};
