import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'beebox_super_secret_jwt_key';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'client' | 'admin' | 'super_admin';
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: true, message: 'Acceso denegado. Token no proporcionado.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: 'client' | 'admin' | 'super_admin';
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: true, message: 'Token inválido o expirado.' });
  }
}

export function requireRole(allowedRoles: Array<'client' | 'admin' | 'super_admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    const userRole = req.user.role;

    // Jerarquía de roles: super_admin siempre tiene acceso si se permite admin o super_admin
    const hasPermission =
      allowedRoles.includes(userRole) ||
      (userRole === 'super_admin' && (allowedRoles.includes('admin') || allowedRoles.includes('super_admin')));

    if (!hasPermission) {
      res.status(403).json({
        error: true,
        message: `Acceso restringido. Se requiere rol de ${allowedRoles.join(' o ')}.`,
      });
      return;
    }

    next();
  };
}
