# Auth Implementation Plan (BeeBox-Backend & Beebox-Empresa-De-Transporte Integration)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar autenticación basada en JWT con roles (Admin y Cliente) en `BeeBox-Backend` y conectar con la capa de estado `AuthContext.tsx` del frontend `Beebox-Empresa-De-Transporte`.

**Architecture:** Prisma User Model + bcryptjs password hashing + JWT Token verification middleware + Auth Controllers/Services + AuthContext Frontend Integration.

**Tech Stack:** Node.js, Express, TypeScript, Prisma ORM, bcryptjs, jsonwebtoken, React (Next.js context).

**Spec:** `docs/superpowers/specs/2026-08-19-beebox-backend-design.md`

## Global Constraints

- JWT secret configurado en `.env` (con fallback `"beebox_super_secret_jwt_key"`).
- Tipos de rol en backend: `CLIENT` ("client") y `ADMIN` ("admin").
- Password hashing utilizando `bcryptjs`.
- Frontend integrado en `Beebox-Empresa-De-Transporte/src/context/AuthContext.tsx`.

---

### Task 1: Add Dependencies & Update Prisma Schema with User Model

**Files:**
- Modify: `BeeBox-Backend/package.json`
- Modify: `BeeBox-Backend/prisma/schema.prisma`
- Modify: `BeeBox-Backend/prisma/seed.ts`

- [ ] **Step 1: Install bcryptjs, jsonwebtoken and their types**

In `BeeBox-Backend/`:
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

- [ ] **Step 2: Add User model and Role enum to `prisma/schema.prisma`**

```prisma
enum Role {
  CLIENT @map("client")
  ADMIN  @map("admin")
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
```

- [ ] **Step 3: Update `prisma/seed.ts` with initial Admin & Client users**

---

### Task 2: Implement Auth Service, Controller, Middleware & Routes in Backend

**Files:**
- Create: `BeeBox-Backend/src/services/auth.service.ts`
- Create: `BeeBox-Backend/src/controllers/auth.controller.ts`
- Create: `BeeBox-Backend/src/middlewares/auth.middleware.ts`
- Create: `BeeBox-Backend/src/routes/auth.routes.ts`
- Modify: `BeeBox-Backend/src/routes/index.ts`

- [ ] **Step 1: Implement `auth.service.ts`** (register, login, getUserProfile)
- [ ] **Step 2: Implement `auth.controller.ts`** (register, login, getMe)
- [ ] **Step 3: Implement `auth.middleware.ts`** (authenticateToken, requireRole)
- [ ] **Step 4: Implement `auth.routes.ts` & register in `routes/index.ts`**

---

### Task 3: Connect Frontend AuthContext to Backend API

**Files:**
- Modify: `Beebox-Empresa-De-Transporte/src/context/AuthContext.tsx`

- [ ] **Step 1: Update `AuthContext.tsx` login, register, and initial session loading (`/api/auth/me`) via fetch to `http://localhost:4000/api/auth`**
- [ ] **Step 2: Store/retrieve JWT token in `localStorage` (`beebox_token`)**

---

### Task 4: Build & End-to-End Verification

- [ ] **Step 1: Run `npx prisma generate` & `npm run build` in `BeeBox-Backend`**
- [ ] **Step 2: Verify TypeScript compilation passes with zero errors**
