import { Router } from 'express';
import {
  getRetirosController,
  createRetiroController,
  verifyRetiroPINController,
} from '../controllers/retiro.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, getRetirosController as any);
router.post('/', authenticateToken as any, createRetiroController as any);
router.post('/verify', authenticateToken as any, requireRole(['admin']) as any, verifyRetiroPINController as any);

export default router;
