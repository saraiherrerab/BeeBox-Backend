import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de datos de prueba (Usuarios, Envíos y Flota)...');

  // Seed Users con contraseñas seguras (letra, número, especial, >= 8 chars)
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin2026!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPass2026!', 10);
  const clientPasswordHash = await bcrypt.hash('ClientPass2026!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@beebox.com' },
    update: { password: superAdminPasswordHash, role: 'super_admin' },
    create: {
      name: 'Super Admin Principal',
      email: 'superadmin@beebox.com',
      password: superAdminPasswordHash,
      phone: '+56 9 8765 4321',
      role: 'super_admin',
      suiteCode: 'CAS-SUPER-HQ',
    },
  });
  console.log(`👤 Usuario Super Admin creado: ${superAdmin.email}`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@beebox.com' },
    update: { password: adminPasswordHash, role: 'admin' },
    create: {
      name: 'Administrador Operativo',
      email: 'admin@beebox.com',
      password: adminPasswordHash,
      phone: '+56 9 1234 5678',
      role: 'admin',
      suiteCode: 'CAS-ADMIN-HUB',
    },
  });
  console.log(`👤 Usuario Admin creado: ${admin.email}`);

  const client = await prisma.user.upsert({
    where: { email: 'sarai.herrera@beebox.com' },
    update: { password: clientPasswordHash, role: 'client' },
    create: {
      name: 'Sarai Herrera',
      email: 'sarai.herrera@beebox.com',
      password: clientPasswordHash,
      phone: '+52 55 9876 5432',
      role: 'client',
      suiteCode: 'CAS-77382-MIAMI',
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

  // Seed Destinations (Countries & Cities)
  const countries = [
    {
      name: 'Venezuela',
      code: 'VE',
      flagEmoji: '🇻🇪',
      cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto'],
    },
    {
      name: 'Colombia',
      code: 'CO',
      flagEmoji: '🇨🇴',
      cities: ['Bogotá', 'Medellín', 'Cali'],
    },
  ];

  for (const c of countries) {
    const country = await prisma.destinationCountry.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        code: c.code,
        flagEmoji: c.flagEmoji,
      },
    });

    for (const cityName of c.cities) {
      let city = await prisma.destinationCity.findFirst({
        where: { countryId: country.id, name: cityName },
      });

      if (!city) {
        city = await prisma.destinationCity.create({
          data: {
            countryId: country.id,
            name: cityName,
          },
        });
      }

      const destCityStr = `${cityName}, ${country.name}`;
      const existingRoute = await prisma.route.findFirst({
        where: { destCity: destCityStr },
      });

      if (!existingRoute) {
        await prisma.route.create({
          data: {
            name: `Ruta ${cityName}, ${country.code}`,
            originCity: 'Broken Arrow, OK',
            destCity: destCityStr,
            countryId: country.id,
            cityId: city.id,
            status: 'ACTIVA',
          },
        });
      }
    }
  }
  console.log('🌍 Países y Ciudades de destino sembrados.');

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
