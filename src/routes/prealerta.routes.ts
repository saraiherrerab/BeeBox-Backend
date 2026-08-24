import { Router } from 'express';
import {
  getPrealertasController,
  createPrealertaController,
  linkPrealertaController,
  updateStatusController,
} from '../controllers/prealerta.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken as any, getPrealertasController as any);
router.post('/', authenticateToken as any, createPrealertaController as any);
router.post('/:id/link', authenticateToken as any, requireRole(['admin']) as any, linkPrealertaController as any);
router.patch('/:id/status', authenticateToken as any, requireRole(['admin']) as any, updateStatusController as any);

export default router;
