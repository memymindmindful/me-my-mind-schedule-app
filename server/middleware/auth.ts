import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'me_my_mind_mindfulness_jwt_secret_2026_super_secure_key';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token is required',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired authentication token',
        code: 'FORBIDDEN'
      });
      return;
    }

    req.user = user as { id: string; username: string };
    next();
  });
}
