import { Router } from 'express';
import {
  getGuiasSalidaController,
  createGuiaSalidaController,
  updateGuiaSalidaController,
  deleteGuiaSalidaController,
} from '../controllers/dispatch.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const dispatchRouter = Router();

dispatchRouter.use(authenticateToken, requireRole(['admin']));

dispatchRouter.get('/', getGuiasSalidaController);
dispatchRouter.post('/', createGuiaSalidaController);
dispatchRouter.patch('/:id', updateGuiaSalidaController);
dispatchRouter.delete('/:id', deleteGuiaSalidaController);

export default dispatchRouter;
