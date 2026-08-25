import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: true, message: 'Nombre, email y contraseña son obligatorios.' });
      return;
    }

    const result = await authService.register({ name, email, password, phone });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message || 'Error al registrar usuario.' });
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: true, message: 'Email y contraseña son requeridos.' });
      return;
    }

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: true, message: error.message || 'Credenciales inválidas.' });
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: true, message: 'No autenticado.' });
      return;
    }

    const userProfile = await authService.getUserById(userId);

    if (!userProfile) {
      res.status(404).json({ error: true, message: 'Usuario no encontrado.' });
      return;
    }

    res.json({ user: userProfile });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ error: true, message: 'No autenticado.' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: true, message: 'La contraseña actual y la nueva son requeridas.' });
      return;
    }

    const result = await authService.updatePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message || 'Error al cambiar contraseña.' });
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    const { name, phone } = req.body;

    if (!userId) {
      res.status(401).json({ error: true, message: 'No autenticado.' });
      return;
    }

    const updatedUser = await authService.updateProfile(userId, { name, phone });
    res.json({ user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message || 'Error al actualizar perfil.' });
  }
}
