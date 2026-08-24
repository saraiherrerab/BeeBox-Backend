import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { MetricsService } from '../services/metrics.service.js';

const metricsService = new MetricsService();

export async function getAdminMetricsController(req: AuthenticatedRequest, res: Response) {
  try {
    const metrics = await metricsService.getAdminMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener métricas del administrador.' });
  }
}
