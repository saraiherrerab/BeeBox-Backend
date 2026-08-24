import { Router } from 'express';
import {
  getRoutesController,
  createRouteController,
  updateRouteController,
} from '../controllers/route.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, getRoutesController as any);
router.post('/', authenticateToken as any, requireRole(['admin']) as any, createRouteController as any);
router.patch('/:id', authenticateToken as any, requireRole(['admin']) as any, updateRouteController as any);

export default router;
