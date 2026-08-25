# 📦 BeeBox Backend API - Empresa de Transporte

API RESTful backend para **BeeBox Empresa de Transporte SpA**. Desarrollada con **Node.js**, **Express**, **TypeScript**, **Prisma ORM** y base de datos **SQLite**.

---

## 🛠️ Tecnologías Principales

- **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) + SQLite (`prisma/dev.db`)
- **Ejecución en Dev**: `tsx` (TypeScript Execute & Watch)
- **Autenticación & Seguridad**: `jsonwebtoken` (JWT), `bcryptjs`, `cors`
- **Logging**: `morgan`

---

## 📋 Pre-requisitos

- **Node.js**: `v18.0.0` o superior (Recomendado v20+ / v22+)
- **npm**: `v9.0.0` o superior

---

## ⚡ Guía de Inicialización Rápida

### 1. Ubícate en el directorio del backend

```bash
cd BeeBox-Backend
```

### 2. Configura las variables de entorno

Crea o verifica el archivo `.env` en la raíz del backend:

```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="beebox_super_secret_jwt_key"
```

### 3. Instala las dependencias

```bash
npm install
```

### 4. Genera el cliente de Prisma y aplica el esquema a la base de datos

```bash
# Generar los tipos de Prisma Client
npx prisma generate

# Sincronizar el esquema con la base de datos SQLite (dev.db)
npx prisma db push
```

### 5. Puebla la base de datos con datos de prueba (Seeding)

```bash
npm run db:seed
```

**Credenciales por defecto:**
- 👤 **Admin**: `admin@beebox.com` / `admin123`
- 👤 **Cliente**: `juan.perez@beebox.com` / `cliente123`
- 📦 **Código de Rastreo Demo**: `BBX-89421`

### 6. Inicia el servidor en modo desarrollo

```bash
npm run dev
```

El servidor estará corriendo en **`http://localhost:4000`**.

---

## 🚀 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga en vivo (`tsx watch src/server.ts`). |
| `npx tsc --noEmit` | Valida los tipos de TypeScript sin compilar. |
| `npm run build` | Compila el proyecto TypeScript a JavaScript en `dist/`. |
| `npm start` | Ejecuta la versión compilada en producción (`node dist/server.js`). |
| `npx prisma generate` | Genera las interfaces y tipos del cliente de Prisma. |
| `npx prisma db push` | Sincroniza la estructura del modelo Prisma en `dev.db`. |
| `npm run db:seed` | Puebla la base de datos con usuarios y envíos iniciales. |

---

## 📡 Endpoints Destacados de la API (`http://localhost:4000/api`)

- **Autenticación**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Gestión de Clientes**: `GET /api/users`, `PATCH /api/users/:id/status` *(Activar/Inhabilitar con motivo interno)*
- **Sistema de Notificaciones**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- **Prealertas Miami**: `GET /api/prealertas`, `POST /api/prealertas`, `POST /api/prealertas/:id/link`
- **Seguimiento de Envíos**: `GET /api/shipments`, `GET /api/shipments/:trackingCode`, `POST /api/shipments` *(Estados: "En el origen", "En camino", "Llegó a su destino")*
- **Cotizador & Flota**: `POST /api/quotes/calculate`, `GET /api/fleet`
