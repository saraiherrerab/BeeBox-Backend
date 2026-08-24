import prisma from '../config/db.js';
import { RateQuoteQuery, RateQuoteResult } from '../types/index.js';

export class QuoteService {
  async calculateQuote(query: RateQuoteQuery): Promise<RateQuoteResult> {
    const { weightKg, serviceType } = query;

    // Intentar buscar tarifa en la base de datos
    const dbRate = await prisma.rateConfig.findFirst({
      where: {
        serviceType: {
          contains: serviceType,
        },
        active: true,
      },
    });

    let basePrice = dbRate ? dbRate.basePrice : 15.0;
    let pricePerKg = dbRate ? dbRate.pricePerKg : 5.5;
    let minHours = 24;
    let maxHours = 48;

    if (serviceType.toLowerCase().includes('express')) {
      if (!dbRate) {
        basePrice = 25.0;
        pricePerKg = 8.5;
      }
      minHours = 12;
      maxHours = 24;
    } else if (serviceType.toLowerCase().includes('marítimo') || serviceType.toLowerCase().includes('maritimo')) {
      if (!dbRate) {
        basePrice = 10.0;
        pricePerKg = 3.0;
      }
      minHours = 120;
      maxHours = 240;
    }

    const estimatedCostUSD = Number((basePrice + weightKg * pricePerKg).toFixed(2));

    return {
      estimatedCostCLP: Math.round(estimatedCostUSD * 950), // Conversión demostrativa a CLP
      deliveryHoursMin: minHours,
      deliveryHoursMax: maxHours,
    };
  }
}
