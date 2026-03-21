import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'nexora-secret-change-in-prod-min-32-chars!!';

// ✅ KEEP THIS AT TOP LEVEL (not inside anything)
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: string;
    name: string;
  };
  hackathonId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — no token' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];

    if (req.params?.hackathonId) {
      req.hackathonId = req.params.hackathonId;
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
