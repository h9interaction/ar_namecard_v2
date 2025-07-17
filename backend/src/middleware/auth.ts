import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const secret = process.env['JWT_SECRET'] || 'your-secret-key';
  
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    
    req.user = user;
    next();
  });
};

export const generateToken = (payload: any): string => {
  const secret = process.env['JWT_SECRET'] || 'your-secret-key';
  const expiresIn = process.env['JWT_EXPIRES_IN'] || '24h';
  
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};