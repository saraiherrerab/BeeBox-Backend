import { RateQuoteQuery, RateQuoteResult } from '../types/index.js';

export class QuoteService {
  calculateQuote(query: RateQuoteQuery): RateQuoteResult {
    const { weightKg, serviceType } = query;

    let basePrice = 4500;
    let pricePerKg = 850;
    let minHours = 24;
    let maxHours = 48;

    if (serviceType.toLowerCase().includes('express')) {
      basePrice = 8900;
      pricePerKg = 1200;
      minHours = 6;
      maxHours = 12;
    } else if (serviceType.toLowerCase().includes('carga pesada')) {
      basePrice = 25000;
      pricePerKg = 500;
      minHours = 48;
      maxHours = 72;
    } else if (serviceType.toLowerCase().includes('última milla') || serviceType.toLowerCase().includes('ultima milla')) {
      basePrice = 3500;
      pricePerKg = 600;
      minHours = 12;
      maxHours = 24;
    }

    const estimatedCostCLP = Math.round(basePrice + weightKg * pricePerKg);

    return {
      estimatedCostCLP,
      deliveryHoursMin: minHours,
      deliveryHoursMax: maxHours,
    };
  }
}
