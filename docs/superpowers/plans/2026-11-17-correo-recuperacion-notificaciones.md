# Correo: recuperación de contraseña y notificaciones — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar por correo, con la identidad de BeeBox, cada notificación de la app y los enlaces de recuperación de contraseña.

**Architecture:** Un `mail.service` (nodemailer, SMTP desde `.env`) con plantillas HTML en `src/emails/`. `NotificationService.createNotification` dispara el correo en segundo plano. Recuperación con tabla `PasswordResetToken` (hash SHA-256 del token) y dos endpoints públicos en `/api/auth`. El frontend agrega el enlace en `/login` y dos páginas.

**Tech Stack:** Express 4, Prisma 6 + PostgreSQL 18, nodemailer, vitest + supertest; Next.js 15 + Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-17-correo-recuperacion-notificaciones-design.md`

## Global Constraints

- Variables: `SMTP_HOST`, `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `APP_URL` (`http://37.60.233.60` en producción). Sin `SMTP_HOST` no se envía: se registra en consola.
- `sendMail` nunca lanza; los errores se registran con `console.error`.
- Colores: amarillo `#F5C242`, fondo de cabecera `#0F172A` (slate-950). Logo: `${APP_URL}/beebox-logo.jpg`.
- Todo texto variable en HTML pasa por `escapeHtml`.
- Token: 32 bytes aleatorios en hex; se guarda solo `sha256(token)`; vence en 1 hora; máximo 3 tokens creados por usuario por hora.
- Mensaje genérico de forgot-password (exacto): `Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.`
- Error de reset (exacto): `El enlace no es válido o ya venció.`
- Enlace de reset: `${APP_URL}/restablecer-contrasena?token=<token>`. Enlace de notificación: `${APP_URL}/dashboard/notificaciones`.
- Cambio de schema solo aditivo; en producción `npx prisma db push` **sin** `--accept-data-loss`.
- Commits sin atribución a IA.

## Review Focus

- Correo con mayúsculas o espacios (`  Ana@Mail.com `) en forgot-password → debe encontrar la cuenta. El registro guarda el correo tal cual, así que buscar con `trim()` y `prisma.user.findFirst({ where: { email: { equals, mode: 'insensitive' } } })`. Test en Task 3.
- `APP_URL` con barra final (`http://x/`) → enlaces sin `//`. Test en Task 1.
- Usuario sin correo válido o envío que falla → `createNotification` igual devuelve la notificación. Test en Task 2.
- Token usado dos veces (doble clic en el enlace) → la segunda vez 400. Test en Task 3.
- Body vacío o `token`/`password` faltantes en reset → 400, no 500. Test en Task 3.

---

### Task 1: Servicio de correo y plantillas

**Files:**
- Create: `src/services/mail.service.ts`, `src/emails/layout.ts`, `src/emails/templates.ts`
- Modify: `package.json` (dependencias `nodemailer`, `@types/nodemailer` en dev), `.env.example` (variables nuevas, valores vacíos)
- Test: `tests/emails.test.ts`

**Interfaces:**
- Produces:
  - `sendMail(msg: { to: string; subject: string; html: string; text: string }): Promise<void>` (export de `mail.service.ts`; no lanza nunca)
  - `appUrl(path: string): string` en `layout.ts` — une `APP_URL` (sin barra final, default `http://localhost:3000`) con `path`
  - `escapeHtml(s: string): string` en `layout.ts`
  - `renderLayout(opts: { title: string; bodyHtml: string; button?: { label: string; url: string } }): string`
  - En `templates.ts`, cada una devuelve `{ subject: string; html: string; text: string }`:
    - `passwordResetEmail(name: string, resetUrl: string)` — asunto `Restablece tu contraseña de BeeBox`
    - `passwordChangedEmail(name: string)` — asunto `Tu contraseña de BeeBox fue cambiada`
    - `notificationEmail(name: string, title: string, message: string)` — asunto `BeeBox: ${title}`

- [ ] **Step 1: Instalar** `npm i nodemailer && npm i -D @types/nodemailer`
- [ ] **Step 2: Escribir tests que fallan** en `tests/emails.test.ts`:
  - `escapeHtml('<b>"x"&</b>')` → `'&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;'`
  - con `process.env.APP_URL = 'http://x/'`: `appUrl('/login')` → `'http://x/login'`
  - `notificationEmail('Ana <script>', 'Hola', 'msg')`: `html` contiene `Ana &lt;script&gt;`, no contiene `<script>`; contiene `#F5C242`, `beebox-logo.jpg` y `/dashboard/notificaciones`; `text` contiene `msg`
  - `passwordResetEmail('Ana', 'http://x/restablecer-contrasena?token=abc')`: `html` y `text` contienen la URL; `html` contiene `1 hora`
  - `sendMail` sin `SMTP_HOST` resuelve sin lanzar
- [ ] **Step 3: Correr** `npx vitest run tests/emails.test.ts` → FAIL (módulos no existen)
- [ ] **Step 4: Implementar.** Layout con tablas y estilos en línea (ancho máx. 600px), cabecera `#0F172A` con logo, franja `#F5C242`, botón `#F5C242` con texto `#0F172A`, pie "BeeBox Empresa de Transporte · Este es un correo automático, no respondas a este mensaje." El transporte de nodemailer se crea perezosamente la primera vez (`secure: port === 465`).
- [ ] **Step 5: Correr** el test → PASS
- [ ] **Step 6: Commit** `feat(mail): servicio de correo y plantillas con identidad BeeBox`

### Task 2: Notificaciones también por correo

**Files:**
- Modify: `src/services/notification.service.ts` (`createNotification`)
- Test: `tests/notification-email.test.ts`

**Interfaces:**
- Consumes: `sendMail`, `notificationEmail` (Task 1)
- Produces: `createNotification` con la misma firma y retorno que hoy.

- [ ] **Step 1: Tests que fallan**, con `vi.mock('../src/services/mail.service.js', () => ({ sendMail: vi.fn() }))`:
  - `envía correo al crear una notificación`: usuario activo → `await vi.waitFor(() => expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email, subject: 'BeeBox: Prueba' })))`
  - `no envía a usuario inactivo`: `active: false`, tipo `info` → tras 200 ms `sendMail` no fue llamado
  - `sí avisa la inhabilitación`: `active: false`, tipo `account_status` → `sendMail` llamado
  - `si el envío falla la notificación se guarda`: `sendMail.mockRejectedValueOnce(new Error('smtp'))` → `createNotification` resuelve con `id` y existe en BD
- [ ] **Step 2: Correr** `npx vitest run tests/notification-email.test.ts` → FAIL
- [ ] **Step 3: Implementar**: tras crear, `void this.emailNotification(...)` (método privado que busca `name,email,active`, aplica la regla de inactivos y llama `sendMail` dentro de `try/catch` con `console.error`). No se hace `await`.
- [ ] **Step 4: Correr** el test y toda la suite `npx vitest run` → PASS
- [ ] **Step 5: Commit** `feat(notificaciones): enviar cada notificación también por correo`

### Task 3: Recuperación de contraseña (backend)

**Files:**
- Modify: `prisma/schema.prisma` (modelo `PasswordResetToken` exactamente como en el spec + relación en `User`)
- Create: `src/services/passwordReset.service.ts`
- Modify: `src/controllers/auth.controller.ts`, `src/routes/auth.routes.ts`
- Test: `tests/password-reset.test.ts`

**Interfaces:**
- Consumes: `sendMail`, `passwordResetEmail`, `passwordChangedEmail`, `appUrl` (Task 1); `validatePassword` de `auth.service.ts`
- Produces:
  - `requestPasswordReset(email: string): Promise<void>` — nunca revela si existe
  - `resetPassword(token: string, password: string): Promise<void>` — lanza `HttpError(400, 'El enlace no es válido o ya venció.')` o el error de `validatePassword` como `HttpError(400, msg)`
  - Rutas: `POST /api/auth/forgot-password` → 200 `{ message }`; `POST /api/auth/reset-password` → 200 `{ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }` o 400 `{ error: true, message }`

- [ ] **Step 1: Aplicar schema local** `npx prisma db push` (sin `--accept-data-loss`) y `npx prisma generate`
- [ ] **Step 2: Tests que fallan** (mismo mock de `sendMail`; capturar el token del `text` del correo con `/token=([a-f0-9]{64})/`):
  - forgot con correo inexistente y existente → ambos 200 y `body.message` idéntico al mensaje genérico; `sendMail` llamado solo para el existente
  - forgot con `'  ' + email.toUpperCase() + ' '` → envía correo
  - 4 solicitudes seguidas → solo 3 tokens en BD para ese usuario
  - en BD `tokenHash` ≠ token del correo y tiene 64 caracteres hex
  - reset con token válido y `'Nueva123!'` → 200; `POST /api/auth/login` con la nueva → 200; `sendMail` llamado con asunto `Tu contraseña de BeeBox fue cambiada`
  - reutilizar el mismo token → 400 con `El enlace no es válido o ya venció.`
  - token vencido (actualizar `expiresAt` al pasado) → 400
  - contraseña `'corta'` → 400 y la contraseña no cambia
  - body `{}` → 400
  - tras un reset, otros tokens pendientes del usuario quedan con `usedAt` no nulo
  - Para usuarios de prueba que deben iniciar sesión, crear la contraseña con `bcrypt.hash` (el helper actual guarda `'no-se-usa'`); usar el prefijo `test-libreta-` para que `cleanupTestUsers` los borre.
- [ ] **Step 3: Correr** `npx vitest run tests/password-reset.test.ts` → FAIL
- [ ] **Step 4: Implementar** servicio (crypto `randomBytes` + `createHash('sha256')`; usuario inactivo → no crea token; actualización de contraseña, marca del token y anulación de los demás en `prisma.$transaction`), controladores y rutas (sin `authenticateToken`).
- [ ] **Step 5: Correr** el test y toda la suite → PASS
- [ ] **Step 6: Commit** `feat(auth): recuperación de contraseña por correo`

### Task 4: Frontend

Repo: `Beebox-Empresa-De-Transporte`.

**Files:**
- Modify: `src/app/login/page.tsx` (enlace "¿Olvidaste tu contraseña?" bajo el campo de contraseña, `text-amber-700 font-bold text-xs`, a `/recuperar-contrasena`)
- Create: `src/app/recuperar-contrasena/page.tsx`, `src/app/restablecer-contrasena/page.tsx`

**Interfaces:**
- Consumes: `API_URL` de `src/config/api.ts`; endpoints de Task 3.

- [ ] **Step 1: `/recuperar-contrasena`**: mismo contenedor, logo y tarjeta que `/login`; campo correo; al enviar hace `fetch(`${API_URL}/auth/forgot-password`)` y muestra `body.message` en una caja verde; errores de red en caja roja; enlace "Volver a iniciar sesión".
- [ ] **Step 2: `/restablecer-contrasena`**: lee `token` con `useSearchParams` (envolver en `<Suspense>` para que compile en Next 15); sin token muestra el error con enlace a `/recuperar-contrasena`. Campos nueva contraseña + confirmación con botón ver/ocultar; muestra las 4 reglas (8+ caracteres, letra, número, carácter especial); valida que coincidan antes de enviar; en 200 muestra éxito con botón a `/login`; en 400 muestra `body.message` y enlace para pedir uno nuevo.
- [ ] **Step 3: Verificar** `npm run build` → compila sin errores y lista `/recuperar-contrasena` y `/restablecer-contrasena`.
- [ ] **Step 4: Verificar a mano** con backend local (`npm run dev` en ambos): pedir enlace, copiar la URL del log de consola del backend (modo sin SMTP), restablecer e iniciar sesión.
- [ ] **Step 5: Commit** `feat(auth): páginas de recuperar y restablecer contraseña`

### Task 5: Despliegue en el VPS

Requiere la contraseña de aplicación de `info.tecnoceans@gmail.com` (la entrega el usuario).

- [ ] **Step 1:** Push de ambos repos a `main` (con confirmación del usuario).
- [ ] **Step 2:** En `/var/www/backend/.env` agregar `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=info.tecnoceans@gmail.com`, `SMTP_PASS=…`, `MAIL_FROM="BeeBox <info.tecnoceans@gmail.com>"`, `APP_URL=http://37.60.233.60`.
- [ ] **Step 3:** Backup previo `pg_dump -Fc` en `/root/backups/`; luego en backend `git pull && npm ci && npx prisma db push && npm run build && pm2 restart beebox-backend`; en frontend `git pull && npm ci && npm run build && pm2 restart beebox-frontend`.
- [ ] **Step 4: Verificar:** `prisma migrate diff` contra el schema → vacío; pedir recuperación para un correo real → llega con el estilo de BeeBox y el enlace funciona; generar una notificación (p. ej. editar datos de un cliente de prueba como admin) → llega el correo; `pm2 logs beebox-backend` sin errores SMTP.
