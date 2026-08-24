import { Router } from 'express';
import {
  getCMSContentController,
  createCMSContentController,
  deleteCMSContentController,
} from '../controllers/cms.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getCMSContentController as any);
router.post('/', authenticateToken as any, requireRole(['admin']) as any, createCMSContentController as any);
router.delete('/:id', authenticateToken as any, requireRole(['admin']) as any, deleteCMSContentController as any);

export default router;
