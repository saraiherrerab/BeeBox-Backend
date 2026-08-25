import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { NotificationService } from '../services/notification.service.js';

const notificationService = new NotificationService();

export async function getUserNotificationsController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    const notifications = await notificationService.getUserNotifications(userId);
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener notificaciones.' });
  }
}

export async function markNotificationAsReadController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await notificationService.markAsRead(id, userId);

    res.json({ success: true, notification: updated, message: 'Notificación marcada como leída.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al marcar notificación.' });
  }
}

export async function markAllNotificationsAsReadController(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: true, message: 'Usuario no autenticado.' });
      return;
    }

    await notificationService.markAllAsRead(userId);
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al marcar todas las notificaciones.' });
  }
}
