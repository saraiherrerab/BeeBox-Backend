import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '../services/shipment.service.js';

const shipmentService = new ShipmentService();

export async function getShipmentByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const trackingCode = String(req.params.trackingCode);
    const shipment = await shipmentService.getByTrackingCode(trackingCode);

    if (!shipment) {
      res.status(404).json({ error: true, message: 'Envío no encontrado' });
      return;
    }

    res.json(shipment);
  } catch (error) {
    next(error);
  }
}

export async function getAllShipments(req: Request, res: Response, next: NextFunction) {
  try {
    const shipments = await shipmentService.getAll();
    res.json(shipments);
  } catch (error) {
    next(error);
  }
}

export async function createShipment(req: Request, res: Response, next: NextFunction) {
  try {
    const newShipment = await shipmentService.createShipment(req.body);
    res.status(201).json(newShipment);
  } catch (error) {
    next(error);
  }
}

export async function addEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const trackingCode = String(req.params.trackingCode);
    const updated = await shipmentService.addTrackingEvent(trackingCode, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
