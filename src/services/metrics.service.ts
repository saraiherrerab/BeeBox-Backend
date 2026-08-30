import prisma from '../config/db.js';

export class MetricsService {
  async getAdminMetrics() {
    const totalClients = await prisma.user.count({
      where: {
        role: {
          in: ['CLIENT', 'client'],
        },
      },
    });

    const pendingPrealertas = await prisma.prealerta.count({
      where: {
        status: {
          in: ['Prealertado', 'prealertado', 'PENDIENTE', 'pendiente'],
        },
      },
    });

    const pendingPickups = await prisma.pickup.count({
      where: {
        status: {
          in: ['PENDIENTE', 'pendiente', 'SOLICITADO', 'solicitado'],
        },
      },
    });

    const allShipments = await prisma.shipment.findMany({
      select: {
        currentStatus: true,
      },
    });

    const dbActiveShipments = allShipments.filter((s) => {
      const st = (s.currentStatus || '').toLowerCase();
      return !st.includes('destino') && !st.includes('entregado');
    }).length;

    const confirmedPrealertasWithoutShipment = await prisma.prealerta.count({
      where: {
        status: { in: ['Confirmado', 'confirmado', 'Vinculado', 'vinculado'] },
        shipmentId: null,
      },
    });

    const activeShipments = dbActiveShipments + confirmedPrealertasWithoutShipment;

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
