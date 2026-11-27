const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });

  // JWT verified during the socket handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));
      socket.data.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.user.id}`); // one private room per user
  });
  return io;
}

module.exports = { initSocket, getIO: () => io };
