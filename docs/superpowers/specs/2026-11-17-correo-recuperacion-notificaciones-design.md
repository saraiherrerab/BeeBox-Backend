# Correo: recuperación de contraseña y notificaciones — Diseño

Fecha: 2026-11-17
Repos afectados: `BeeBox-Backend` (backend) y `Beebox-Empresa-De-Transporte` (frontend)

## Intención

Que el cliente no tenga que entrar a BeeBox a revisar: todo lo que hoy ve como
notificación dentro de la app le llega también al correo, y si olvida su contraseña
la recupera solo, desde el login, con un enlace que le llega por correo. Todos los
correos llevan el estilo visual de BeeBox.

## Objetivos

- Recuperar contraseña de punta a punta: "¿Olvidaste tu contraseña?" en el login,
  correo con enlace, página para definir la nueva contraseña.
- Cada notificación creada en la app se envía también por correo al usuario.
- Correos en HTML con la identidad de BeeBox: logo, amarillo `#F5C242`, botón de acción.
- El proveedor de correo se cambia solo con variables de entorno (Gmail hoy;
  Brevo/Resend cuando haya dominio).

## No-objetivos

- Preferencias para desactivar correos por tipo (todos los clientes los reciben).
- Verificación del correo al registrarse y correo de bienvenida.
- Notificaciones por WhatsApp/SMS.
- Cola de reintentos persistente. Si un envío falla, se registra en el log y ya.

## Anti-objetivos (fallaría aunque "funcione")

- Que una falla de Gmail rompa o haga lenta una operación (crear envío, cambiar estado, etc.).
- Que el formulario de recuperación revele si un correo está registrado.
- Que un enlace de recuperación sirva más de una vez o para siempre.
- Correos que se vean rotos en Gmail/Outlook móvil.

## Restricciones

- Remitente: `info.tecnoceans@gmail.com` por SMTP de Gmail con **contraseña de aplicación**
  (requiere verificación en 2 pasos en esa cuenta). Límite ~500 correos/día.
- Sin dominio todavía: los enlaces apuntan a `http://37.60.233.60`. La URL base sale de una
  variable de entorno para cambiarla sin tocar código.
- Base en producción con datos reales: el cambio de schema debe ser solo aditivo
  (tabla nueva) y se aplica sin `--accept-data-loss`.
- Stack existente: Express + Prisma + PostgreSQL 18; tests de integración con vitest +
  supertest contra la base local.

## Enfoques considerados

| Enfoque | A favor | En contra |
|---|---|---|
| **A. Gmail SMTP (elegido)** | Gratis, funciona hoy sin dominio, buena entregabilidad | Remitente `@gmail.com`, ~500/día |
| B. Brevo/Resend | Dominio propio, estadísticas, volumen | Necesita dominio verificado, que aún no hay |
| C. Servidor de correo propio en el VPS | — | Contabo bloquea el puerto 25; IP nueva cae en spam |

Elegido A por el usuario, implementado con SMTP genérico (nodemailer) para pasar a B
cambiando solo variables de entorno.

## Diseño

### Configuración (backend `.env`)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=info.tecnoceans@gmail.com
SMTP_PASS=<contraseña de aplicación de 16 caracteres>
MAIL_FROM="BeeBox <info.tecnoceans@gmail.com>"
APP_URL=http://37.60.233.60
```

Si `SMTP_HOST` no está definido (desarrollo, tests), el servicio de correo no envía y solo
registra en consola lo que habría mandado.

### Servicio de correo (`src/services/mail.service.ts`)

- Transporte nodemailer creado una vez a partir del `.env`.
- `sendMail({ to, subject, html, text })`: nunca lanza; captura y registra errores.
- Plantillas en `src/emails/`:
  - `layout.ts`: envoltorio HTML común — tablas con estilos en línea (compatibles con
    clientes de correo), cabecera con logo (`${APP_URL}/beebox-logo.jpg`) sobre fondo
    oscuro, franja amarilla `#F5C242`, cuerpo blanco, botón amarillo con texto oscuro,
    pie con "BeeBox Empresa de Transporte" y aviso de que es un correo automático.
  - `passwordReset.ts`: saludo con el nombre, botón "Restablecer contraseña", aviso de
    vencimiento (30 minutos) y "si no lo pediste, ignora este correo".
  - `passwordChanged.ts`: confirmación de que la contraseña cambió.
  - `notification.ts`: título y mensaje de la notificación, botón "Ver en BeeBox" que
    lleva a `/dashboard/notificaciones`.
- Cada correo lleva versión de texto plano además del HTML.
- Todo el contenido variable (nombres, mensajes) se escapa como HTML.

### Notificaciones por correo

`NotificationService.createNotification` guarda la notificación como hoy y luego dispara
el correo **sin esperar el resultado** (fire-and-forget): busca el usuario (nombre, correo,
activo) y envía la plantilla `notification`. Así cubre automáticamente los 7 puntos que ya
crean notificaciones (prealerta confirmada, envío creado/pickup/warehouse, cambios de estado,
datos editados por admin, cuenta inhabilitada) y cualquiera que se agregue después.

Excepción: si el usuario está inactivo no se envía correo, **salvo** la notificación de
tipo `account_status` (avisar que su cuenta fue inhabilitada).

### Recuperación de contraseña

Modelo nuevo:

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

(`User` gana la relación inversa `passwordResetTokens PasswordResetToken[]`.)

Endpoints públicos en `auth.routes.ts`:

- `POST /api/auth/forgot-password` `{ email }`
  - Responde **siempre** 200 con el mismo mensaje genérico ("Si el correo está registrado,
    recibirás un enlace…"), exista o no la cuenta.
  - Si el usuario existe y está activo: genera token aleatorio de 32 bytes (hex), guarda
    solo su SHA-256, vence en 30 minutos, y envía el correo con
    `${APP_URL}/restablecer-contrasena?token=<token>`.
  - Límite: si el usuario ya tiene 3 tokens creados en la última hora, no crea otro
    (responde igual, genérico).
- `POST /api/auth/reset-password` `{ token, password }`
  - Busca por hash; rechaza (400, "El enlace no es válido o ya venció.") si no existe,
    venció o ya fue usado, o si el usuario está inactivo.
  - Valida la contraseña con `validatePassword` existente.
  - En una transacción: actualiza la contraseña (bcrypt), marca el token como usado e
    invalida los demás tokens pendientes del usuario.
  - Envía el correo `passwordChanged`.

Las sesiones (JWT) abiertas no se invalidan: el sistema no tiene lista de revocación y
agregarla queda fuera de alcance.

### Frontend

- Login: enlace "¿Olvidaste tu contraseña?" bajo el campo de contraseña → `/recuperar-contrasena`.
- `/recuperar-contrasena`: campo de correo, botón enviar, y luego el mensaje genérico de
  confirmación. Mismo estilo visual que `/login`.
- `/restablecer-contrasena?token=…`: nueva contraseña + confirmación, con las mismas reglas
  que el registro mostradas al usuario; al éxito, mensaje y botón a `/login`. Si el token
  es inválido o venció, mensaje con enlace para pedir uno nuevo.

### Pruebas (backend, vitest + supertest)

- El servicio de correo se reemplaza por un doble en tests para capturar lo enviado.
- forgot-password: respuesta idéntica para correo existente e inexistente; crea token y
  envía correo solo si existe; respeta el límite de 3 por hora.
- reset-password: cambia la contraseña y permite login con la nueva; token usado, vencido
  o inválido → 400; contraseña débil → 400.
- createNotification: guarda y envía correo; usuario inactivo no recibe salvo `account_status`;
  una falla del envío no rompe la creación.
- Plantillas: el contenido variable sale escapado.

### Despliegue

1. En la cuenta de Google `info.tecnoceans@gmail.com`: activar verificación en 2 pasos y
   crear una contraseña de aplicación (la crea el dueño de la cuenta).
2. Agregar las variables SMTP/`APP_URL` al `.env` del VPS.
3. `git pull`, `npm ci`, `npx prisma db push` (sin `--accept-data-loss`; tabla nueva),
   `npm run build`, reiniciar backend y frontend con PM2.
4. Probar: pedir recuperación con un correo real y recibir una notificación.

## Decisiones tomadas por el implementador (revisables)

- Vencimiento del enlace: 30 minutos (OBS-09). Límite adicional: 10 intentos cada 15 min por IP. Límite: 3 solicitudes por hora por usuario.
- Fire-and-forget sin reintentos para las notificaciones.
- Usuarios inactivos solo reciben el correo de cuenta inhabilitada.
- Correo de confirmación tras cambiar contraseña (aviso de seguridad).
- Rutas en español: `/recuperar-contrasena` y `/restablecer-contrasena`.
- Enlace del correo de notificación siempre a `/dashboard/notificaciones` (admins incluidos).

## Lo que queda al implementador

- Textos exactos y diseño fino de las plantillas dentro de la identidad descrita.
- Estructura interna de archivos del frontend siguiendo el patrón de `/login`.
