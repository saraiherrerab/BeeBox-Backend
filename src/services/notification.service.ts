import prisma from '../config/db.js';
import { notificationEmail } from '../emails/templates.js';
import { sendMail } from './mail.service.js';

export class NotificationService {
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNotification(userId: string, title: string, message: string, type: string = 'info') {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
    // En segundo plano: el correo nunca debe frenar ni romper la operación que notifica.
    void this.emailNotification(userId, title, message, type);
    return notification;
  }

  private async emailNotification(userId: string, title: string, message: string, type: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, active: true },
      });
      if (!user) return;
      // A una cuenta inhabilitada solo se le avisa justamente eso.
      if (!user.active && type !== 'account_status') return;
      const content = notificationEmail(user.name, title, message);
      await sendMail({ to: user.email, ...content });
    } catch (error) {
      console.error('[mail] No se pudo enviar el correo de la notificación:', error);
    }
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada o no pertenece al usuario.');
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
