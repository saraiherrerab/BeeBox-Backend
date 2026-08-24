import { Request, Response } from 'express';
import { RateService } from '../services/rate.service.js';

const rateService = new RateService();

export async function getRatesController(req: Request, res: Response) {
  try {
    const rates = await rateService.getRates();
    res.json({ success: true, rates });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener tarifas.' });
  }
}

export async function upsertRateController(req: Request, res: Response) {
  try {
    const { serviceType, basePrice, pricePerKg, insuranceRate } = req.body;
    if (!serviceType || basePrice === undefined || pricePerKg === undefined) {
      res.status(400).json({ error: true, message: 'Faltan parámetros requeridos: serviceType, basePrice, pricePerKg.' });
      return;
    }

    const rate = await rateService.upsertRate({ serviceType, basePrice, pricePerKg, insuranceRate });
    res.json({ success: true, rate, message: 'Configuración de tarifa guardada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al guardar tarifa.' });
  }
}
