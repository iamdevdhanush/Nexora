import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const errorHandler = (
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    logger.error(`[Error] ${req.method} ${req.path} → ${status}: ${message}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.error(err.stack || '');
    }
  }

  try {
    res.status(status).json({ error: message });
  } catch {
    res.status(500).send('Internal server error');
  }
};
