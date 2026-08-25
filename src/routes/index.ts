import { Router } from 'express';
import authRoutes from './auth.routes.js';
import shipmentRoutes from './shipment.routes.js';
import fleetRoutes from './fleet.routes.js';
import quoteRoutes from './quote.routes.js';
import userRoutes from './user.routes.js';
import prealertaRoutes from './prealerta.routes.js';
import pickupRoutes from './pickup.routes.js';
import retiroRoutes from './retiro.routes.js';
import adminRoutes from './admin.routes.js';
import routeRoutes from './route.routes.js';
import rateRoutes from './rate.routes.js';
import cmsRoutes from './cms.routes.js';
import notificationRoutes from './notification.routes.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BeeBox Backend API', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/cms', cmsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/prealertas', prealertaRoutes);
apiRouter.use('/pickups', pickupRoutes);
apiRouter.use('/retiros', retiroRoutes);
apiRouter.use('/routes', routeRoutes);
apiRouter.use('/rates', rateRoutes);
apiRouter.use('/shipments', shipmentRoutes);
apiRouter.use('/fleet', fleetRoutes);
apiRouter.use('/quotes', quoteRoutes);

export default apiRouter;
