import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { UserService } from '../services/user.service.js';

const userService = new UserService();

export async function getUsersController(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener usuarios.' });
  }
}

export async function getUserByIdController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.userId !== id) {
      res.status(403).json({ error: true, message: 'No tienes permiso para ver este usuario.' });
      return;
    }

    const user = await userService.getUserById(id);
    if (!user) {
      res.status(404).json({ error: true, message: 'Usuario no encontrado.' });
      return;
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener usuario.' });
  }
}

export async function updateUserController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, phone } = req.body;

    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.userId !== id) {
      res.status(403).json({ error: true, message: 'No tienes permiso para modificar este usuario.' });
      return;
    }

    const updated = await userService.updateUser(id, { name, phone });
    res.json({ success: true, user: updated, message: 'Usuario actualizado correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar usuario.' });
  }
}

export async function updateUserRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { role } = req.body;

    if (!role || (role !== 'client' && role !== 'admin')) {
      res.status(400).json({ error: true, message: 'El rol especificado debe ser "client" o "admin".' });
      return;
    }

    const updated = await userService.updateUserRole(id, role);
    res.json({ success: true, user: updated, message: 'Rol de usuario actualizado correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar rol.' });
  }
}

export async function updateUserStatusController(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { active, disabledReason } = req.body;

    if (req.user?.userId === id) {
      res.status(400).json({ error: true, message: 'Un usuario administrativo no puede inhabilitar su propia cuenta.' });
      return;
    }

    if (typeof active !== 'boolean') {
      res.status(400).json({ error: true, message: 'El campo active debe ser booleano (true o false).' });
      return;
    }

    const updated = await userService.updateUserStatus(id, active, disabledReason);
    res.json({
      success: true,
      user: updated,
      message: active
        ? 'Cliente activado exitosamente.'
        : 'Cliente inhabilitado exitosamente.',
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar estado del usuario.' });
  }
}

export async function getAdminUsersController(req: AuthenticatedRequest, res: Response) {
  try {
    const admins = await userService.getAdminUsers();
    res.json({ success: true, admins });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener administradores.' });
  }
}

export async function createAdminUserController(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: true, message: 'Faltan parámetros requeridos: name, email, password.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: true, message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    const newAdmin = await userService.createAdminUser({ name, email, password, phone });
    res.status(201).json({ success: true, admin: newAdmin, message: 'Administrador registrado exitosamente.' });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message || 'Error al crear administrador.' });
  }
}
