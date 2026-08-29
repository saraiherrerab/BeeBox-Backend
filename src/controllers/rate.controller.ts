import { Request, Response } from 'express';
import { RateService } from '../services/rate.service.js';

const rateService = new RateService();

export async function getRatesController(req: Request, res: Response) {
  try {
    const countryId = req.query.countryId ? String(req.query.countryId) : undefined;
    const cityId = req.query.cityId ? String(req.query.cityId) : undefined;

    const result = await rateService.getRates({ countryId, cityId });
    res.json({ success: true, rates: result.rates, isCustom: result.isCustom });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al obtener tarifas.' });
  }
}

export async function upsertRateController(req: Request, res: Response) {
  try {
    const { serviceType, countryId, cityId, basePrice, pricePerKg, pricePerCubicFeet, insuranceRate, estimatedDaysMin, estimatedDaysMax } = req.body;
    if (!serviceType || basePrice === undefined || pricePerKg === undefined) {
      res.status(400).json({ error: true, message: 'Faltan parámetros requeridos: serviceType, basePrice, pricePerKg.' });
      return;
    }

    const rate = await rateService.upsertRate({
      serviceType,
      countryId,
      cityId,
      basePrice,
      pricePerKg,
      pricePerCubicFeet,
      insuranceRate,
      estimatedDaysMin,
      estimatedDaysMax,
    });
    res.json({ success: true, rate, message: 'Configuración de tarifa guardada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al guardar tarifa.' });
  }
}

export async function deleteCustomRatesController(req: Request, res: Response) {
  try {
    const countryId = req.query.countryId ? String(req.query.countryId) : undefined;
    const cityId = req.query.cityId ? String(req.query.cityId) : undefined;

    await rateService.deleteCustomRates({ countryId, cityId });
    res.json({ success: true, message: 'Tarifas personalizadas eliminadas. El destino ahora usa las tarifas globales.' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Error al restablecer tarifas.' });
  }
}
