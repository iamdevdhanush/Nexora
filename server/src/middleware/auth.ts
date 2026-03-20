import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexora-secret-change-in-prod';

export interface AuthRequest extends Request {
  user?: { id: string; email?: string; phone?: string; role: string; name: string };
  hackathonId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    // Also extract hackathonId from params if present
    if (req.params.hackathonId) req.hackathonId = req.params.hackathonId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Admin only' });
  next();
};

// Middleware to inject hackathonId from params
export const withHackathon = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.hackathonId = req.params.hackathonId;
  next();
};
