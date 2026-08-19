# Especificación de Diseño: BeeBox-Backend (Express + Prisma + PostgreSQL + Auth JWT)

**Fecha:** 2026-08-19  
**Estado:** Aprobado por el usuario  
**Propósito:** Proporcionar la infraestructura, servicios API REST y Autenticación con roles (Admin y Cliente) para la aplicación de transportes BeeBox, integrándose con el frontend `Beebox-Empresa-De-Transporte`.

---

## 1. Arquitectura General

El backend se estructura como una aplicación Node.js con TypeScript, Express.js y Prisma ORM conectado a PostgreSQL.

### Estructura de Directorios

```
BeeBox-Backend/
├── prisma/
│   ├── schema.prisma        # Definición de modelos de datos e índices (User, Shipment, TrackingEvent, FleetVehicle)
│   └── seed.ts              # Script de siembra de usuarios iniciales (Admin y Cliente), envíos y flota
├── src/
│   ├── config/
│   │   └── db.ts            # Instancia singleton de PrismaClient
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── shipment.controller.ts
│   │   ├── fleet.controller.ts
│   │   └── quote.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── shipment.service.ts
│   │   ├── fleet.service.ts
│   │   └── quote.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── shipment.routes.ts
│   │   ├── fleet.routes.ts
│   │   ├── quote.routes.ts
│   │   └── index.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts # Verificación JWT y control de roles (Admin / Cliente)
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts               # Configuración de Express (CORS, JSON parsers, rutas)
│   └── server.ts            # Punto de entrada HTTP (escucha de puerto)
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## 2. Modelo de Datos (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CLIENT @map("client")
  ADMIN  @map("admin")
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

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  phone     String?
  suiteCode String?
  role      Role     @default(CLIENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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

---

## 3. Endpoints API REST

### Autenticación (`/api/auth`)
- `POST /api/auth/register`: Registro de nuevos clientes.
- `POST /api/auth/login`: Autenticación con email/password. Retorna JWT Token y perfil de usuario (`role: "client" | "admin"`).
- `GET /api/auth/me`: Retorna los datos del usuario autenticado (con Bearer token).

### Envíos y Seguimiento (`/api/shipments`)
- `GET /api/shipments/:trackingCode`: Obtiene el estado y el historial de eventos de un envío por su código de seguimiento.
- `GET /api/shipments`: Lista todos los envíos.
- `POST /api/shipments`: Crea un nuevo envío (Requiere rol Admin o Cliente).
- `POST /api/shipments/:trackingCode/events`: Agrega un nuevo evento al historial de seguimiento de un envío.

### Flota de Vehículos (`/api/fleet`)
- `GET /api/fleet`: Obtiene el catálogo de vehículos de la flota.
- `POST /api/fleet`: Agrega un nuevo vehículo a la flota.

### Cotizaciones (`/api/quotes`)
- `POST /api/quotes/calculate`: Calcula la tarifa estimada en CLP y tiempo de entrega.

---

## 4. Integración Frontend (`Beebox-Empresa-De-Transporte`)
- Actualización de `AuthContext.tsx` para consumir `/api/auth/login`, `/api/auth/register` y `/api/auth/me`.
- Almacenamiento persistente del JWT token en `localStorage` y configuración del header `Authorization`.

---

## 5. Estrategia de Verificación y Pruebas
1. Compilación TypeScript sin errores (`npm run build`).
2. Generación del cliente de Prisma (`npx prisma generate`).
3. Pruebas de login y registro contra los endpoints REST con contraseñas encriptadas por `bcryptjs`.
