import { Router } from 'express';
import { getAdminMetricsController } from '../controllers/metrics.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/metrics', authenticateToken as any, requireRole(['admin']) as any, getAdminMetricsController as any);

export default router;
