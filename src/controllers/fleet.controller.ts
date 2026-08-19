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
