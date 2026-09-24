import { Router } from 'express';
import {
  getWarehousesController,
  createWarehouseController,
  updateWarehouseController,
  deleteWarehouseController,
} from '../controllers/warehouse.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const warehouseRouter = Router();

warehouseRouter.get('/', getWarehousesController);
warehouseRouter.post('/', authenticateToken, createWarehouseController);
warehouseRouter.patch('/:id', authenticateToken, updateWarehouseController);
warehouseRouter.delete('/:id', authenticateToken, deleteWarehouseController);

export default warehouseRouter;
