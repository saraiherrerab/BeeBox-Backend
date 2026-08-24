import prisma from '../config/db.js';

export class RouteService {
  async getRoutes() {
    const routes = await prisma.route.findMany({
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            category: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return routes;
  }

  async createRoute(data: { name: string; originCity: string; destCity: string; vehicleId?: string }) {
    const route = await prisma.route.create({
      data: {
        name: data.name,
        originCity: data.originCity,
        destCity: data.destCity,
        vehicleId: data.vehicleId || null,
        status: 'ACTIVA',
      },
      include: {
        vehicle: true,
      },
    });

    return route;
  }

  async updateRoute(id: string, data: { name?: string; originCity?: string; destCity?: string; vehicleId?: string; status?: string }) {
    const updated = await prisma.route.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.originCity ? { originCity: data.originCity } : {}),
        ...(data.destCity ? { destCity: data.destCity } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId } : {}),
      },
      include: {
        vehicle: true,
      },
    });

    return updated;
  }
}
