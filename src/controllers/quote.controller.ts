import { Request, Response, NextFunction } from 'express';
import { QuoteService } from '../services/quote.service.js';

const quoteService = new QuoteService();

export async function calculateQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { originCity, destinationCity, weightKg, serviceType } = req.body;

    if (!originCity || !destinationCity || !weightKg || !serviceType) {
      res.status(400).json({
        error: true,
        message: 'Parámetros faltantes: originCity, destinationCity, weightKg y serviceType son requeridos.',
      });
      return;
    }

    const result = await quoteService.calculateQuote({
      originCity,
      destinationCity,
      weightKg: Number(weightKg),
      serviceType: String(serviceType),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

