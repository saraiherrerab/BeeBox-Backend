# BeeBox-Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar e implementar la estructura del servidor backend `BeeBox-Backend` con Node.js, Express, TypeScript y Prisma ORM para comunicarse con el frontend de transportes.

**Architecture:** Aplicación RESTful en Node.js con arquitectura por capas (Routes -> Controllers -> Services -> Prisma Client -> DB).

**Tech Stack:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (con fallback SQLite para pruebas si DB no disponible), dotenv, cors, morgan.

**Spec:** `docs/superpowers/specs/2026-08-19-beebox-backend-design.md`

## Global Constraints

- Backend ubicado en `BeeBox-Backend/`.
- TypeScript versión ^5.0.0.
- Servidor Express en puerto 4000 por defecto.
- Modelos Prisma compatibles con los tipos de la interfaz frontend `Beebox-Empresa-De-Transporte`.

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.env`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json with scripts and dependencies**

```json
{
  "name": "beebox-backend",
  "version": "1.0.0",
  "description": "Backend para BeeBox Empresa de Transporte",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.3.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.13.4",
    "prisma": "^6.3.1",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .env, .env.example, and .gitignore**

`.env.example`:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beebox_db?schema=public"
```

`.gitignore`:
```
node_modules/
dist/
.env
*.log
```

---

### Task 2: Prisma Schema & Seed Script

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create prisma/schema.prisma**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TrackingStatusStep {
  recoleccion
  centro_distribucion
  en_transito
  en_reparto
  entregado
  incidencia
}

enum ServiceType {
  EXPRESS      @map("Express")
  CARGA_PESADA @map("Carga Pesada")
  CONSOLIDADO  @map("Consolidado")
  ULTIMA_MILLA @map("Última Milla")
}

enum VehicleCategory {
  VANS_EXPRESS         @map("Vans Express")
  CAMIONES_MEDIANOS    @map("Camiones Medianos")
  TRAILERS_GRAN_CARGA  @map("Trailers de Gran Carga")
  REFRIGERADOS         @map("Refrigerados")
}

model Shipment {
  trackingCode      String             @id
  senderName        String
  senderCity        String
  recipientName     String
  recipientCity     String
  recipientAddress  String
  serviceType       ServiceType
  weightKg          Float
  dimensions        String
  estimatedDelivery String
  currentStatus     TrackingStatusStep @default(recoleccion)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  events TrackingEvent[]
}

model TrackingEvent {
  id          String             @id @default(uuid())
  shipmentId  String
  shipment    Shipment           @relation(fields: [shipmentId], references: [trackingCode], onDelete: Cascade)
  timestamp   DateTime           @default(now())
  location    String
  status      TrackingStatusStep
  title       String
  description String
}

model FleetVehicle {
  id        String          @id @default(uuid())
  name      String
  category  VehicleCategory
  capacity  String
  volume    String
  features  String[]
  imageUrl  String?
  active    Boolean         @default(true)
}
```

- [ ] **Step 2: Create prisma/seed.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Seed sample shipment
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

  // Seed sample fleet vehicles
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
    await prisma.fleetVehicle.create({ data: v });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### Task 3: Base Express Application Setup

**Files:**
- Create: `src/config/db.ts`
- Create: `src/middlewares/errorHandler.ts`
- Create: `src/app.ts`
- Create: `src/server.ts`

- [ ] **Step 1: Create src/config/db.ts**
- [ ] **Step 2: Create src/middlewares/errorHandler.ts**
- [ ] **Step 3: Create src/app.ts & src/server.ts**

---

### Task 4: Controllers, Services & Routes

**Files:**
- Create: `src/services/shipment.service.ts`
- Create: `src/controllers/shipment.controller.ts`
- Create: `src/routes/shipment.routes.ts`
- Create: `src/services/fleet.service.ts`
- Create: `src/controllers/fleet.controller.ts`
- Create: `src/routes/fleet.routes.ts`
- Create: `src/services/quote.service.ts`
- Create: `src/controllers/quote.controller.ts`
- Create: `src/routes/quote.routes.ts`
- Create: `src/routes/index.ts`

---

### Task 5: Build & Verification

- [ ] **Step 1: Install npm packages in BeeBox-Backend**
- [ ] **Step 2: Generate Prisma Client & Run Typescript compilation**
- [ ] **Step 3: Verify server starts and responds on `/api/health`**
