import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra completa de datos de prueba...');

  // 1. Seed Users
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
      active: true,
    },
  });
  console.log(`👤 Super Admin creado: ${superAdmin.email}`);

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
      active: true,
    },
  });
  console.log(`👤 Admin creado: ${admin.email}`);

  const client1 = await prisma.user.upsert({
    where: { email: 'sarai.herrera@beebox.com' },
    update: { password: clientPasswordHash, role: 'client' },
    create: {
      name: 'Sarai Herrera',
      email: 'sarai.herrera@beebox.com',
      password: clientPasswordHash,
      phone: '+52 55 9876 5432',
      role: 'client',
      suiteCode: 'CAS-77382-MIAMI',
      active: true,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'juan.perez@beebox.com' },
    update: { password: clientPasswordHash, role: 'client' },
    create: {
      name: 'Juan Pérez',
      email: 'juan.perez@beebox.com',
      password: clientPasswordHash,
      phone: '+52 55 1122 3344',
      role: 'client',
      suiteCode: 'CAS-88293-MIAMI',
      active: true,
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'laura.gomez@beebox.com' },
    update: { password: clientPasswordHash, role: 'client' },
    create: {
      name: 'Laura Gómez',
      email: 'laura.gomez@beebox.com',
      password: clientPasswordHash,
      phone: '+52 55 5566 7788',
      role: 'client',
      suiteCode: 'CAS-42346-MIAMI',
      active: true,
    },
  });

  const client4 = await prisma.user.upsert({
    where: { email: 'maria.gonzalez@beebox.com' },
    update: { password: clientPasswordHash, role: 'client' },
    create: {
      name: 'Maria Gonzalez',
      email: 'maria.gonzalez@beebox.com',
      password: clientPasswordHash,
      phone: '+58 412 134 5071',
      role: 'client',
      suiteCode: 'CAS-62608-MIAMI',
      active: true,
    },
  });
  console.log(`👤 Clientes sembrados: Sarai, Juan, Laura, Maria`);

  // 2. Seed Shipments
  const shipmentsData = [
    {
      trackingCode: 'BBX-89421',
      userId: client1.id,
      senderName: 'Shein US Logistics',
      senderCity: 'Los Angeles, CA',
      recipientName: 'Sarai Herrera',
      recipientCity: 'Caracas, Venezuela',
      recipientAddress: 'Av. Francisco de Miranda, Edif. Centro, Apt 4B',
      serviceType: 'Aéreo Exprés Internacional',
      weightKg: 3.5,
      dimensions: '30 x 20 x 15 cm',
      estimatedDelivery: '3-5 días hábiles',
      currentStatus: 'En tránsito',
    },
    {
      trackingCode: 'BBX-89422',
      userId: client4.id,
      senderName: 'Walmart Fulfillment',
      senderCity: 'Miami, FL',
      recipientName: 'Maria Gonzalez',
      recipientCity: 'Bogotá, Colombia',
      recipientAddress: 'Calle 100 # 15-20, Of. 301',
      serviceType: 'Marítimo Consolidado',
      weightKg: 12.0,
      dimensions: '50 x 40 x 30 cm',
      estimatedDelivery: '10-14 días hábiles',
      currentStatus: 'En el origen',
    },
    {
      trackingCode: 'BBX-89423',
      userId: client2.id,
      senderName: 'eBay Merchant Store',
      senderCity: 'Chicago, IL',
      recipientName: 'Juan Pérez',
      recipientCity: 'Maracaibo, Venezuela',
      recipientAddress: 'Sector Bella Vista, Calle 72, Res. El Sol',
      serviceType: 'Aéreo Exprés Internacional',
      weightKg: 1.8,
      dimensions: '20 x 15 x 10 cm',
      estimatedDelivery: '4 días hábiles',
      currentStatus: 'En aduana',
    },
    {
      trackingCode: 'BBX-89424',
      userId: client3.id,
      senderName: 'Apple Store Direct',
      senderCity: 'Cupertino, CA',
      recipientName: 'Laura Gómez',
      recipientCity: 'Valencia, Venezuela',
      recipientAddress: 'Urbanización El Trigal, Calle Los Pinos #12',
      serviceType: 'Aéreo Exprés Internacional',
      weightKg: 0.9,
      dimensions: '18 x 12 x 5 cm',
      estimatedDelivery: '2 días hábiles',
      currentStatus: 'Entregado',
    },
  ];

  for (const s of shipmentsData) {
    const sh = await prisma.shipment.upsert({
      where: { trackingCode: s.trackingCode },
      update: { currentStatus: s.currentStatus },
      create: s,
    });

    const eventCount = await prisma.trackingEvent.count({ where: { shipmentId: sh.trackingCode } });
    if (eventCount === 0) {
      await prisma.trackingEvent.create({
        data: {
          shipmentId: sh.trackingCode,
          location: 'Almacén Central - Broken Arrow, OK',
          status: 'En el origen',
          title: 'Envío Ingresado al Sistema',
          description: `Paquete registrado e ingresado al hub central para procesamiento a ${sh.recipientCity}.`,
        },
      });
      if (s.currentStatus !== 'En el origen') {
        await prisma.trackingEvent.create({
          data: {
            shipmentId: sh.trackingCode,
            location: 'Aeropuerto Internacional de Miami (MIA)',
            status: s.currentStatus,
            title: `Estado Actualizado: ${s.currentStatus}`,
            description: `El envío ${sh.trackingCode} ha alcanzado la etapa: ${s.currentStatus}.`,
          },
        });
      }
    }
  }
  console.log(`📦 4 Envíos sembrados con sus eventos de rastreo.`);

  // 3. Seed Prealertas
  const prealertasData = [
    {
      userId: client1.id,
      store: 'Amazon US',
      trackingNumber: '1Z9999999999999991',
      description: 'Auriculares Inalámbricos Sony WH-1000XM5',
      amountPaid: 348.00,
      destination: 'Caracas, Venezuela',
      status: 'Prealertado',
    },
    {
      userId: client2.id,
      store: 'eBay Store',
      trackingNumber: '1Z9999999999999992',
      description: 'Colección de Calcomanías Retro y Llaveros',
      amountPaid: 45.00,
      destination: 'Maracaibo, Venezuela',
      status: 'Recibido en Almacén',
    },
    {
      userId: client1.id,
      store: 'Shein Official',
      trackingNumber: '1Z9999999999999993',
      description: 'Lote de Ropa Deportiva y Accesorios',
      amountPaid: 89.90,
      destination: 'Caracas, Venezuela',
      status: 'Confirmado',
      warehouseGuide: 'BBX-89421',
      shipmentId: 'BBX-89421',
    },
    {
      userId: client3.id,
      store: 'Apple Store Online',
      trackingNumber: '1Z9999999999999994',
      description: 'MacBook Air M3 15 pulgadas',
      amountPaid: 1299.00,
      destination: 'Valencia, Venezuela',
      status: 'Prealertado',
    },
    {
      userId: client4.id,
      store: 'Walmart Online',
      trackingNumber: '1Z9999999999999995',
      description: 'Juego de Utensilios de Cocina de Acero Inoxidable',
      amountPaid: 115.50,
      destination: 'Bogotá, Colombia',
      status: 'Confirmado',
      warehouseGuide: 'BBX-89422',
      shipmentId: 'BBX-89422',
    },
  ];

  for (const p of prealertasData) {
    const existing = await prisma.prealerta.findFirst({
      where: { trackingNumber: p.trackingNumber },
    });
    if (!existing) {
      await prisma.prealerta.create({ data: p });
    }
  }
  console.log(`🚨 5 Prealertas sembradas.`);

  // 4. Seed Fleet Vehicles
  const vehicles = [
    {
      name: 'Mercedes Benz Sprinter 516',
      category: 'VANS_EXPRESS',
      capacity: '1,500 kg',
      volume: '14 m³',
      features: JSON.stringify(['GPS en Tiempo Real', 'Control de Temperatura', 'Seguro de Carga']),
    },
    {
      name: 'Volvo FE 280',
      category: 'CAMIONES_MEDIANOS',
      capacity: '8,000 kg',
      volume: '45 m³',
      features: JSON.stringify(['Rampa Hidráulica', 'GPS Telemetría', 'Monitoreo 24/7']),
    },
    {
      name: 'Scania R500 V8',
      category: 'TRAILERS_GRAN_CARGA',
      capacity: '28,000 kg',
      volume: '90 m³',
      features: JSON.stringify(['Suspensión Neumática', 'Doble Conductor', 'Carga Consolidada']),
    },
    {
      name: 'Ford Transit Custom Cargo',
      category: 'VANS_EXPRESS',
      capacity: '1,200 kg',
      volume: '10 m³',
      features: JSON.stringify(['GPS Urbano', 'Cierre Centralizado', 'Puerta Lateral Asistida']),
    },
  ];

  for (const v of vehicles) {
    const existing = await prisma.fleetVehicle.findFirst({
      where: { name: v.name },
    });
    if (!existing) {
      await prisma.fleetVehicle.create({ data: v });
    }
  }
  console.log(`🚛 Flota de vehículos sembrada.`);

  // 5. Seed Destinations & Routes
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
  console.log(`🌍 Destinos y Rutas Activas sembrados.`);

  // 6. Seed RateConfigs (Tarifas)
  const rates = [
    {
      serviceType: 'Aéreo Exprés Internacional',
      basePrice: 15.00,
      pricePerKg: 8.50,
      pricePerCubicFeet: 0.0,
      insuranceRate: 0.02,
      estimatedDaysMin: 3,
      estimatedDaysMax: 5,
      active: true,
    },
    {
      serviceType: 'Marítimo Consolidado',
      basePrice: 25.00,
      pricePerKg: 0.0,
      pricePerCubicFeet: 12.00,
      insuranceRate: 0.02,
      estimatedDaysMin: 12,
      estimatedDaysMax: 18,
      active: true,
    },
    {
      serviceType: 'Terrestre Nacional',
      basePrice: 10.00,
      pricePerKg: 4.50,
      pricePerCubicFeet: 0.0,
      insuranceRate: 0.015,
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      active: true,
    },
  ];

  for (const r of rates) {
    const existing = await prisma.rateConfig.findFirst({
      where: { serviceType: r.serviceType },
    });
    if (!existing) {
      await prisma.rateConfig.create({ data: r });
    }
  }
  console.log(`💰 Tarifas y configuración de calculadora sembradas.`);

  // 7. Seed Pickups
  const pickupsData = [
    {
      pickupCode: 'PIC-1001',
      userId: client1.id,
      senderName: 'Sarai Herrera',
      senderPhone: '+52 55 9876 5432',
      senderAddress: '7890 NW 25th St, Doral, FL 33122',
      senderCity: 'Miami, FL',
      boxCount: 2,
      totalWeightKg: 8.5,
      containElectronics: true,
      recipientName: 'Sarai Herrera',
      recipientPhone: '+58 412 111 2233',
      recipientAddress: 'Av. Francisco de Miranda, Caracas',
      recipientCity: 'Caracas, Venezuela',
      pickupDate: '2026-09-01',
      timeSlot: '09:00 - 12:00',
      status: 'PENDIENTE',
    },
    {
      pickupCode: 'PIC-1002',
      userId: client2.id,
      senderName: 'Juan Pérez',
      senderPhone: '+52 55 1122 3344',
      senderAddress: '4500 Post Oak Blvd, Suite 100',
      senderCity: 'Houston, TX',
      boxCount: 5,
      totalWeightKg: 35.0,
      containElectronics: false,
      recipientName: 'Juan Pérez',
      recipientPhone: '+58 412 444 5566',
      recipientAddress: 'Sector Bella Vista, Maracaibo',
      recipientCity: 'Maracaibo, Venezuela',
      pickupDate: '2026-09-02',
      timeSlot: '14:00 - 17:00',
      status: 'ASIGNADO',
    },
  ];

  for (const pic of pickupsData) {
    const existing = await prisma.pickup.findUnique({
      where: { pickupCode: pic.pickupCode },
    });
    if (!existing) {
      await prisma.pickup.create({ data: pic });
    }
  }
  console.log(`🚚 Recolecciones a domicilio (Pickups) sembradas.`);

  // 8. Seed Branch Pickups (Retiros en Sucursal)
  const branchPickups = [
    {
      pinCode: '884192',
      userId: client1.id,
      shipmentId: 'BBX-89421',
      branchName: 'Sucursal Caracas - Altamira',
      scheduledDate: '2026-09-03',
      scheduledTime: '10:30 AM',
      status: 'PROGRAMADO',
    },
    {
      pinCode: '773120',
      userId: client4.id,
      shipmentId: 'BBX-89422',
      branchName: 'Sucursal Bogotá - Calle 100',
      scheduledDate: '2026-09-05',
      scheduledTime: '02:00 PM',
      status: 'LISTO_PARA_RETIRO',
    },
  ];

  for (const bp of branchPickups) {
    const existing = await prisma.branchPickup.findUnique({
      where: { pinCode: bp.pinCode },
    });
    if (!existing) {
      await prisma.branchPickup.create({ data: bp });
    }
  }
  console.log(`🏦 Retiros en sucursal sembrados.`);

  // 9. Seed CMS Content
  const cmsItems = [
    {
      type: 'HERO_BANNER',
      title: 'Envíos Rápidos y Seguros a Latinoamérica',
      description: 'Tu casillero internacional en Miami y Oklahoma con tarifa preferencial y rastreo GPS 24/7.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      active: true,
    },
    {
      type: 'PROMO',
      title: '15% OFF en tu primer envío Aéreo Exprés',
      description: 'Aprovecha nuestra tarifa especial de temporada usando el código BEEBOX15.',
      imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
      active: true,
    },
  ];

  for (const item of cmsItems) {
    const existing = await prisma.cMSContent.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.cMSContent.create({ data: item });
    }
  }
  console.log(`📰 Contenidos CMS sembrados.`);

  console.log('✅ ¡Siembra de datos completa finalizada con éxito en todas las tablas!');
}

main()
  .catch((e) => {
    console.error('❌ Error en la siembra de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
