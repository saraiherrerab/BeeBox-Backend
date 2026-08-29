import prisma from '../config/db.js';
import { RateQuoteQuery, RateQuoteResult } from '../types/index.js';

export class QuoteService {
  async calculateQuote(query: RateQuoteQuery): Promise<RateQuoteResult> {
    const {
      weightKg = 0,
      lengthCm = 0,
      widthCm = 0,
      heightCm = 0,
      declaredValue = 0,
      destCountryId,
      destCityId,
      serviceType,
    } = query;

    // 1. Calcular Peso Volumétrico
    const volKg = (lengthCm > 0 && widthCm > 0 && heightCm > 0)
      ? Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2))
      : 0;

    const chargeableWeight = Math.max(weightKg, volKg);
    const isVolumetric = volKg > weightKg;

    // 2. Buscar Tarifa por (countryId, cityId, serviceType) o Fallback
    let dbRate = null;

    if (destCityId) {
      dbRate = await prisma.rateConfig.findFirst({
        where: {
          cityId: destCityId,
          serviceType: { contains: serviceType },
          active: true,
        },
      });
    }

    if (!dbRate && destCountryId) {
      dbRate = await prisma.rateConfig.findFirst({
        where: {
          countryId: destCountryId,
          cityId: null,
          serviceType: { contains: serviceType },
          active: true,
        },
      });
    }

    if (!dbRate) {
      dbRate = await prisma.rateConfig.findFirst({
        where: {
          countryId: null,
          cityId: null,
          serviceType: { contains: serviceType },
          active: true,
        },
      });
    }

    let basePrice = dbRate ? dbRate.basePrice : 15.0;
    let pricePerKg = dbRate ? dbRate.pricePerKg : 5.5;
    let insuranceRate = dbRate ? dbRate.insuranceRate : 0.02;
    let minHours = (dbRate?.estimatedDaysMin || 3) * 24;
    let maxHours = (dbRate?.estimatedDaysMax || 5) * 24;

    if (!dbRate) {
      if (serviceType.toLowerCase().includes('express')) {
        basePrice = 25.0;
        pricePerKg = 8.5;
        minHours = 12;
        maxHours = 24;
      } else if (serviceType.toLowerCase().includes('marítimo') || serviceType.toLowerCase().includes('maritimo')) {
        basePrice = 10.0;
        pricePerKg = 3.0;
        minHours = 120;
        maxHours = 240;
      }
    }

    const freightCost = Number((chargeableWeight * pricePerKg).toFixed(2));
    const insuranceCost = Number((declaredValue * insuranceRate).toFixed(2));
    const totalUSD = Number((basePrice + freightCost + insuranceCost).toFixed(2));

    return {
      estimatedCostCLP: Math.round(totalUSD * 950),
      basePrice,
      freightCost,
      insuranceCost,
      chargeableWeight,
      isVolumetric,
      volumetricWeightKg: volKg,
      totalUSD,
      deliveryHoursMin: minHours,
      deliveryHoursMax: maxHours,
    };
  }
}
