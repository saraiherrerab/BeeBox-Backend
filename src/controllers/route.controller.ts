import { Request, Response } from 'express';
import { RouteService } from '../services/route.service.js';

const routeService = new RouteService();

export async function getRoutesController(req: Request, res: Response) {
  try {
    const routes = await routeService.getRoutes();
    res.json({ success: true, routes });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener rutas.' });
  }
}

export async function createRouteController(req: Request, res: Response) {
  try {
    const { name, originCity, destCity, vehicleId } = req.body;
    if (!name || !originCity || !destCity) {
      res.status(400).json({ error: true, message: 'Faltan campos requeridos para la ruta.' });
      return;
    }

    const route = await routeService.createRoute({ name, originCity, destCity, vehicleId });
    res.status(201).json({ success: true, route, message: 'Ruta creada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al crear ruta.' });
  }
}

export async function updateRouteController(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, originCity, destCity, vehicleId, status } = req.body;

    const route = await routeService.updateRoute(id, { name, originCity, destCity, vehicleId, status });
    res.json({ success: true, route, message: 'Ruta actualizada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al actualizar ruta.' });
  }
}
