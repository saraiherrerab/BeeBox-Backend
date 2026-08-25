import { Router } from 'express';
import {
  getUserNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, getUserNotificationsController as any);
router.patch('/read-all', authenticateToken as any, markAllNotificationsAsReadController as any);
router.patch('/:id/read', authenticateToken as any, markNotificationAsReadController as any);

export default router;
