import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor BeeBox-Backend iniciado en http://localhost:${PORT}`);
  console.log(`📡 Endpoints API disponibles en http://localhost:${PORT}/api`);
});
