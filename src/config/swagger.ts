import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BeeBox Logistics REST API',
      version: '1.0.0',
      description: 'Documentación oficial interactiva de las APIs del sistema BeeBox Empresa de Transporte.',
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Servidor Local de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
