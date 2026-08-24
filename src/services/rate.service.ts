import prisma from '../config/db.js';

export class RateService {
  async getRates() {
    const rates = await prisma.rateConfig.findMany({
      where: { active: true },
      orderBy: { serviceType: 'asc' },
    });

    // Si la tabla está vacía, sembrar tarifas por defecto
    if (rates.length === 0) {
      const defaultRates = [
        { serviceType: 'Aéreo Express', basePrice: 25.0, pricePerKg: 8.5, insuranceRate: 0.02 },
        { serviceType: 'Aéreo Estándar', basePrice: 15.0, pricePerKg: 5.5, insuranceRate: 0.02 },
        { serviceType: 'Marítimo', basePrice: 10.0, pricePerKg: 3.0, insuranceRate: 0.02 },
      ];

      for (const r of defaultRates) {
        await prisma.rateConfig.create({ data: r });
      }

      return prisma.rateConfig.findMany({ where: { active: true } });
    }

    return rates;
  }

  async upsertRate(data: { serviceType: string; basePrice: number; pricePerKg: number; insuranceRate?: number }) {
    const upserted = await prisma.rateConfig.upsert({
      where: { serviceType: data.serviceType },
      update: {
        basePrice: Number(data.basePrice),
        pricePerKg: Number(data.pricePerKg),
        insuranceRate: data.insuranceRate !== undefined ? Number(data.insuranceRate) : 0.02,
        active: true,
      },
      create: {
        serviceType: data.serviceType,
        basePrice: Number(data.basePrice),
        pricePerKg: Number(data.pricePerKg),
        insuranceRate: data.insuranceRate !== undefined ? Number(data.insuranceRate) : 0.02,
        active: true,
      },
    });

    return upserted;
  }
}
