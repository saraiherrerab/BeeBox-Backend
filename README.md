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

### 1. Clona o ubícate en el directorio del proyecto

```bash
cd BeeBox-Backend
```

### 2. Configura las variables de entorno

Crea o verifica el archivo `.env` en la raíz del backend:

```env
PORT=4000
DATABASE_URL="file:./dev.db"
```

> **Nota:** Existe un archivo `.env.example` como referencia.

### 3. Instala las dependencias

```bash
npm install
```

### 4. Genera el cliente de Prisma y ejecuta las migraciones

```bash
# Generar el cliente de Prisma en node_modules
npm run prisma:generate

# Aplicar las migraciones a la base de datos SQLite
npm run prisma:migrate
```

### 5. Puebla la base de datos con datos de prueba (Seeding)

Ejecuta el script de seed para crear los usuarios por defecto, envíos de demo y vehículos de la flota:

```bash
npm run db:seed
```

**Credenciales creadas por defecto:**
- 👤 **Admin**: `admin@beebox.com` / `admin123`
- 👤 **Cliente**: `juan.perez@beebox.com` / `cliente123`
- 📦 **Código de Rastreo Demo**: `BBX-89421`

### 6. Inicia el servidor en modo desarrollo

```bash
npm run dev
```

El servidor se iniciará en **`http://localhost:4000`** con recarga automática al guardar cambios.

---

## 🚀 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga en vivo (`tsx watch src/server.ts`). |
| `npm run build` | Compila el proyecto TypeScript a JavaScript en la carpeta `dist/`. |
| `npm start` | Ejecuta la versión compilada en producción (`node dist/server.js`). |
| `npm run prisma:generate` | Genera los tipos e interfaz del cliente de Prisma. |
| `npm run prisma:migrate` | Aplica las migraciones dev de Prisma en la BD. |
| `npm run db:seed` | Puebla la base de datos con datos iniciales de prueba. |

---

## 📡 Endpoints Principales de la API

La base URL de la API es **`http://localhost:4000/api`**:

- **Health Check**: `GET /api/health`
- **Autenticación**:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- **Envíos & Rastreo**:
  - `GET /api/shipments`
  - `GET /api/shipments/:trackingCode`
  - `POST /api/shipments`
- **Flota de Vehículos**:
  - `GET /api/fleet`
- **Cotizador**:
  - `POST /api/quotes/calculate`

---

## 🔗 Conexión con el Frontend

El frontend (`Beebox-Empresa-De-Transporte`) se conecta por defecto a este backend a través de `http://localhost:4000/api`. Asegúrate de tener este servidor corriendo antes de usar el frontend.
