import { Router } from 'express';
import authRoutes from './auth.routes.js';
import shipmentRoutes from './shipment.routes.js';
import fleetRoutes from './fleet.routes.js';
import quoteRoutes from './quote.routes.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BeeBox Backend API', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/shipments', shipmentRoutes);
apiRouter.use('/fleet', fleetRoutes);
apiRouter.use('/quotes', quoteRoutes);

export default apiRouter;
