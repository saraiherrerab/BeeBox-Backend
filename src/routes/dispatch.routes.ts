import { Router } from 'express';
import {
  getGuiasSalidaController,
  createGuiaSalidaController,
  updateGuiaSalidaController,
  deleteGuiaSalidaController,
} from '../controllers/dispatch.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const dispatchRouter = Router();

dispatchRouter.get('/', getGuiasSalidaController);
dispatchRouter.post('/', authenticateToken, createGuiaSalidaController);
dispatchRouter.patch('/:id', authenticateToken, updateGuiaSalidaController);
dispatchRouter.delete('/:id', authenticateToken, deleteGuiaSalidaController);

export default dispatchRouter;
