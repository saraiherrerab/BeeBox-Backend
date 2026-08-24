import { Request, Response, NextFunction } from 'express';
import { FleetService } from '../services/fleet.service.js';

const fleetService = new FleetService();

export async function getFleet(req: Request, res: Response, next: NextFunction) {
  try {
    const fleet = await fleetService.getActiveVehicles();
    res.json(fleet);
  } catch (error) {
    next(error);
  }
}

export async function addVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await fleetService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
}

export async function updateVehicleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const vehicle = await fleetService.updateVehicle(id, req.body);
    res.json({ success: true, vehicle, message: 'Vehículo actualizado correctamente.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteVehicleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await fleetService.deleteVehicle(id);
    res.json({ success: true, message: 'Vehículo desactivado correctamente.' });
  } catch (error) {
    next(error);
  }
}

