import app from './app.js';
import http from 'http';
import { initSocket } from './socket.js';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Servidor BeeBox-Backend iniciado en http://localhost:${PORT}`);
  console.log(`📡 Endpoints API disponibles en http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket servidor activo en ws://localhost:${PORT}`);
});
