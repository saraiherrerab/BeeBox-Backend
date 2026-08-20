import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de datos de prueba (Usuarios, Envíos y Flota)...');

  // Seed Users con contraseñas seguras (letra, número, especial, >= 8 chars)
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const clientPasswordHash = await bcrypt.hash('Cliente123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@beebox.com' },
    update: {},
    create: {
      name: 'Admin Principal',
      email: 'admin@beebox.com',
      password: adminPasswordHash,
      phone: '+56 9 1234 5678',
      role: 'ADMIN',
      suiteCode: 'CAS-ADMIN-HUB',
    },
  });
  console.log(`👤 Usuario Admin creado: ${admin.email}`);

  const client = await prisma.user.upsert({
    where: { email: 'juan.perez@beebox.com' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'juan.perez@beebox.com',
      password: clientPasswordHash,
      phone: '+52 55 9876 5432',
      role: 'CLIENT',
      suiteCode: 'CAS-88293-MIAMI',
    },
  });
  console.log(`👤 Usuario Cliente creado: ${client.email}`);

  // Seed Shipment
  const shipment = await prisma.shipment.upsert({
    where: { trackingCode: 'BBX-89421' },
    update: {},
    create: {
      trackingCode: 'BBX-89421',
      senderName: 'Importadora Del Pacífico',
      senderCity: 'Valparaíso',
      recipientName: 'Distribuidora Central S.A.',
      recipientCity: 'Santiago',
      recipientAddress: 'Av. Providencia 1234, Of. 502',
      serviceType: 'EXPRESS',
      weightKg: 45.5,
      dimensions: '50 x 40 x 30 cm',
      estimatedDelivery: 'Hoy, 18:30 hrs',
      currentStatus: 'en_transito',
      events: {
        create: [
          {
            timestamp: new Date(Date.now() - 3600000 * 5),
            location: 'Centro Logístico Valparaíso',
            status: 'recoleccion',
            title: 'Paquete Recibido',
            description: 'Envío recepcionado e ingresado al sistema.',
          },
          {
            timestamp: new Date(Date.now() - 3600000 * 2),
            location: 'Ruta 68 - Km 45',
            status: 'en_transito',
            title: 'En Ruta Principal',
            description: 'Vehículo en tránsito hacia el hub de distribución Santiago.',
          },
        ],
      },
    },
  });
  console.log(`📦 Envío creado/encontrado: ${shipment.trackingCode}`);

  // Seed Fleet Vehicles
  const vehicles = [
    {
      name: 'Mercedes Benz Sprinter 516',
      category: 'VANS_EXPRESS' as const,
      capacity: '1,500 kg',
      volume: '14 m³',
      features: ['GPS en Tiempo Real', 'Control de Temperatura', 'Seguro de Carga'],
    },
    {
      name: 'Volvo FE 280',
      category: 'CAMIONES_MEDIANOS' as const,
      capacity: '8,000 kg',
      volume: '45 m³',
      features: ['Rampa Hidráulica', 'GPS Telemetría', 'Monitoreo 24/7'],
    },
    {
      name: 'Scania R500 V8',
      category: 'TRAILERS_GRAN_CARGA' as const,
      capacity: '28,000 kg',
      volume: '90 m³',
      features: ['Suspensión Neumática', 'Doble Conductor', 'Carga Consolidada'],
    },
  ];

  for (const v of vehicles) {
    const existing = await prisma.fleetVehicle.findFirst({
      where: { name: v.name },
    });

    if (!existing) {
      const created = await prisma.fleetVehicle.create({
        data: {
          ...v,
          features: JSON.stringify(v.features),
        },
      });
      console.log(`🚛 Vehículo creado: ${created.name}`);
    }
  }

  console.log('✅ Siembra completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
