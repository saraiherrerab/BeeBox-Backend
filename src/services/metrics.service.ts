import prisma from '../config/db.js';

export class MetricsService {
  async getAdminMetrics() {
    const totalClients = await prisma.user.count({
      where: {
        role: 'client',
      },
    });

    const pendingPrealertas = await prisma.prealerta.count({
      where: {
        status: 'Prealertado',
      },
    });

    const pendingPickups = await prisma.pickup.count({
      where: {
        status: 'PENDIENTE',
      },
    });

    const activeShipments = await prisma.shipment.count({
      where: {
        currentStatus: {
          notIn: ['entregado', 'ENTREGADO'],
        },
      },
    });

    const prealertasTotal = await prisma.prealerta.aggregate({
      _sum: {
        amountPaid: true,
      },
    });

    const totalRevenue = prealertasTotal._sum.amountPaid || 0;

    return {
      totalClients,
      pendingPrealertas,
      pendingPickups,
      activeShipments,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    };
  }
}
