import { Router } from 'express';
import {
  getUsersController,
  getUserByIdController,
  updateUserController,
  updateUserRoleController,
  updateUserStatusController,
} from '../controllers/user.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, requireRole(['admin']) as any, getUsersController as any);
router.get('/:id', authenticateToken as any, getUserByIdController as any);
router.patch('/:id', authenticateToken as any, updateUserController as any);
router.patch('/:id/role', authenticateToken as any, requireRole(['admin']) as any, updateUserRoleController as any);
router.patch('/:id/status', authenticateToken as any, requireRole(['admin']) as any, updateUserStatusController as any);

export default router;
