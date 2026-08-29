import { Router } from 'express';
import {
  getUsersController,
  getUserByIdController,
  updateUserController,
  updateUserRoleController,
  updateUserStatusController,
  getAdminUsersController,
  createAdminUserController,
} from '../controllers/user.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/admins', authenticateToken as any, requireRole(['super_admin']) as any, getAdminUsersController as any);
router.post('/admins', authenticateToken as any, requireRole(['super_admin']) as any, createAdminUserController as any);

router.get('/', authenticateToken as any, requireRole(['admin', 'super_admin']) as any, getUsersController as any);
router.get('/:id', authenticateToken as any, getUserByIdController as any);
router.patch('/:id', authenticateToken as any, updateUserController as any);
router.patch('/:id/role', authenticateToken as any, requireRole(['super_admin']) as any, updateUserRoleController as any);
router.patch('/:id/status', authenticateToken as any, requireRole(['super_admin']) as any, updateUserStatusController as any);

export default router;
