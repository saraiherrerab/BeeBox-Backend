import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*', // Permitir conexión desde el frontend Beebox-Empresa-De-Transporte
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json());
app.use(morgan('dev'));

// Configuración de rutas principales de la API
app.use('/api', apiRouter);

// Manejo de 404 para rutas no existentes
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Ruta no encontrada' });
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

export default app;
