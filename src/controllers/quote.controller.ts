import { Request, Response, NextFunction } from 'express';
import { QuoteService } from '../services/quote.service.js';

const quoteService = new QuoteService();

export async function calculateQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      originCity,
      destinationCity,
      destCountryId,
      destCityId,
      weightKg,
      serviceType,
      lengthCm,
      widthCm,
      heightCm,
      declaredValue,
    } = req.body;

    const result = await quoteService.calculateQuote({
      originCity: originCity || 'Broken Arrow, OK (EE.UU.)',
      destinationCity: destinationCity || 'Caracas, Venezuela',
      destCountryId,
      destCityId,
      weightKg: Number(weightKg || 1),
      serviceType: String(serviceType || 'Aéreo Express'),
      lengthCm: Number(lengthCm || 0),
      widthCm: Number(widthCm || 0),
      heightCm: Number(heightCm || 0),
      declaredValue: Number(declaredValue || 0),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

