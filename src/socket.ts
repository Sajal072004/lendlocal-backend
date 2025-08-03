// lendlocal-backend/src/socket.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    

    // --- ADD THIS ---
    // Have user join a room based on their own userId
    socket.on('joinUserRoom', (userId: string) => {
        socket.join(userId);
        console.log(`User ${socket.id} joined their personal room: ${userId}`);
    });
    // ---------------

    socket.on('joinConversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('disconnect', () => {
      
    });
  });

  return io;
};