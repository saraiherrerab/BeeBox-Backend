import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
// Detrás de Nginx: toma la IP real del cliente de X-Forwarded-For (lo usa el límite por IP).
app.set('trust proxy', 1);

app.use(cors({
  origin: '*', // Permitir conexión desde el frontend Beebox-Empresa-De-Transporte
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Documentación interactiva Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configuración de rutas principales de la API
app.use('/api', apiRouter);


// Manejo de 404 para rutas no existentes
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Ruta no encontrada' });
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

export default app;
