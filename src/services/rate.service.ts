import prisma from '../config/db.js';

export class RateService {
  async getRates(query?: { countryId?: string; cityId?: string }) {
    const isTargetingDestination = !!(query?.countryId || query?.cityId);

    if (isTargetingDestination) {
      const where: any = { active: true };
      if (query?.cityId) where.cityId = query.cityId;
      else if (query?.countryId) where.countryId = query.countryId;

      const customRates = await prisma.rateConfig.findMany({
        where,
        orderBy: { serviceType: 'asc' },
      });

      if (customRates.length > 0) {
        return { rates: customRates, isCustom: true };
      }
    }

    // Si no hay tarifas personalizadas o se solicitó global, buscar globales
    const globalRates = await prisma.rateConfig.findMany({
      where: { active: true, countryId: null, cityId: null },
      orderBy: { serviceType: 'asc' },
    });

    // Si la tabla está vacía para tarifas globales, sembrar por defecto
    if (globalRates.length === 0) {
      const defaultRates = [
        { serviceType: 'Aéreo Express', basePrice: 25.0, pricePerKg: 8.5, insuranceRate: 0.02, estimatedDaysMin: 2, estimatedDaysMax: 4 },
        { serviceType: 'Aéreo Estándar', basePrice: 15.0, pricePerKg: 5.5, insuranceRate: 0.02, estimatedDaysMin: 5, estimatedDaysMax: 7 },
        { serviceType: 'Marítimo', basePrice: 10.0, pricePerKg: 3.0, insuranceRate: 0.02, estimatedDaysMin: 15, estimatedDaysMax: 25 },
      ];

      for (const r of defaultRates) {
        await prisma.rateConfig.create({ data: r });
      }

      const seeded = await prisma.rateConfig.findMany({ where: { active: true, countryId: null, cityId: null }, orderBy: { serviceType: 'asc' } });
      return { rates: seeded, isCustom: false };
    }

    return { rates: globalRates, isCustom: false };
  }

  async deleteCustomRates(query: { countryId?: string; cityId?: string }) {
    const where: any = {};
    if (query.cityId) where.cityId = query.cityId;
    else if (query.countryId) where.countryId = query.countryId;
    else return;

    return prisma.rateConfig.deleteMany({ where });
  }

  async upsertRate(data: {
    serviceType: string;
    countryId?: string | null;
    cityId?: string | null;
    basePrice: number;
    pricePerKg: number;
    pricePerCubicFeet?: number;
    insuranceRate?: number;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
  }) {
    const countryId = data.countryId || null;
    const cityId = data.cityId || null;

    const existing = await prisma.rateConfig.findFirst({
      where: {
        serviceType: data.serviceType,
        countryId,
        cityId,
      },
    });

    const payload = {
      serviceType: data.serviceType,
      countryId,
      cityId,
      basePrice: Number(data.basePrice),
      pricePerKg: Number(data.pricePerKg),
      pricePerCubicFeet: data.pricePerCubicFeet !== undefined ? Number(data.pricePerCubicFeet) : 0.0,
      insuranceRate: data.insuranceRate !== undefined ? Number(data.insuranceRate) : 0.02,
      estimatedDaysMin: data.estimatedDaysMin !== undefined ? Number(data.estimatedDaysMin) : 3,
      estimatedDaysMax: data.estimatedDaysMax !== undefined ? Number(data.estimatedDaysMax) : 5,
      active: true,
    };

    if (existing) {
      return prisma.rateConfig.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      return prisma.rateConfig.create({
        data: payload,
      });
    }
  }
}
