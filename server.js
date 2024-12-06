const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Obsługa połączeń
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId) || new Set();

    // Limit pokoju do dwóch użytkowników
    if (room.size >= 2) {
      socket.emit('room-full');
      return;
    }

    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.join(roomId);

    // Powiadom innych użytkowników w pokoju
    socket.to(roomId).emit('user-joined', socket.id);

    // Obsługa wymiany sygnałów
    socket.on('signal', (data) => {
      io.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal,
      });
    });

    // Rozłączenie użytkownika
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`);
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

// Uruchom serwer
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
