import prisma from '../config/db.js';

export class DestinationService {
  async getCountries() {
    return prisma.destinationCountry.findMany({
      where: { active: true },
      include: {
        cities: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCountry(data: { name: string; code?: string; flagEmoji?: string }) {
    return prisma.destinationCountry.create({
      data: {
        name: data.name,
        code: data.code || null,
        flagEmoji: data.flagEmoji || '🌐',
        active: true,
      },
    });
  }

  async createCity(data: { countryId: string; name: string }) {
    const city = await prisma.destinationCity.create({
      data: {
        countryId: data.countryId,
        name: data.name,
        active: true,
      },
      include: {
        country: true,
      },
    });

    // Crear la ruta correspondiente automáticamente para mantener compatibilidad
    if (city.country) {
      const routeName = `Ruta ${city.name}, ${city.country.code || 'INT'}`;
      const destCity = `${city.name}, ${city.country.name}`;
      
      const existingRoute = await prisma.route.findFirst({
        where: { destCity },
      });

      if (!existingRoute) {
        await prisma.route.create({
          data: {
            name: routeName,
            originCity: 'Broken Arrow, OK',
            destCity,
            countryId: city.countryId,
            cityId: city.id,
            status: 'ACTIVA',
          },
        });
      }
    }

    return city;
  }

  async updateCountry(id: string, data: { name?: string; code?: string; flagEmoji?: string; active?: boolean }) {
    return prisma.destinationCountry.update({
      where: { id },
      data,
    });
  }

  async updateCity(id: string, data: { name?: string; active?: boolean }) {
    const updated = await prisma.destinationCity.update({
      where: { id },
      data,
      include: { country: true },
    });

    if (data.name && updated.country) {
      const destCity = `${updated.name}, ${updated.country.name}`;
      await prisma.route.updateMany({
        where: { cityId: id },
        data: {
          name: `Ruta ${updated.name}, ${updated.country.code || 'INT'}`,
          destCity,
        },
      });
    }

    return updated;
  }

  async deleteCountry(id: string) {
    await prisma.route.deleteMany({ where: { countryId: id } });
    return prisma.destinationCountry.delete({
      where: { id },
    });
  }

  async deleteCity(id: string) {
    await prisma.route.deleteMany({ where: { cityId: id } });
    return prisma.destinationCity.delete({
      where: { id },
    });
  }
}
