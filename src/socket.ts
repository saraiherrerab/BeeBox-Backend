import { Server } from 'socket.io';
import http from 'http';

let io: Server | null = null;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });

  return io;
}

export function emitSocketEvent(eventName: string, data?: any) {
  if (io) {
    io.emit(eventName, data || {});
  }
}

export function getIO(): Server | null {
  return io;
}
