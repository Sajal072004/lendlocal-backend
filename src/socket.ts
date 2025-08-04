// lendlocal-backend/src/socket.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

const activeChats: Record<string, string> = {};

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

    socket.on('startViewingChat', (conversationId: string) => {
      // Find which user this socket belongs to
      const userId = Object.keys(activeChats).find(key => activeChats[key] === socket.id);
      if (userId) {
          activeChats[userId] = conversationId;
      }
  });

  socket.on('stopViewingChat', () => {
      const userId = Object.keys(activeChats).find(key => activeChats[key] === socket.id);
      if (userId) {
          delete activeChats[userId];
      }
  });

    socket.on('disconnect', () => {
      
    });
  });

};

export { io, activeChats };