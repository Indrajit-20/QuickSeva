const { Server } = require("socket.io");
const logger = require("./logger");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Echo origin back to satisfy credentials: true requirement
        callback(null, true);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
    pingTimeout: 30000,
    pingInterval: 10000,
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 Socket client connected: ${socket.id}`);

    // Join user-specific room
    socket.on("join_user", (userId) => {
      if (userId) {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        logger.info(`👤 Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Join order-specific room
    socket.on("join_order", (orderId) => {
      if (orderId) {
        const roomName = `order_${orderId}`;
        socket.join(roomName);
        logger.info(`📦 Socket ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`🔌 Socket client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  const roomName = `user_${userId}`;
  io.to(roomName).emit(event, payload);
  logger.info(`📢 Emitted '${event}' to room '${roomName}'`);
}

function emitToOrder(orderId, event, payload) {
  if (!io || !orderId) return;
  const roomName = `order_${orderId}`;
  io.to(roomName).emit(event, payload);
  logger.info(`📢 Emitted '${event}' to room '${roomName}'`);
}

function broadcastEvent(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToOrder,
  broadcastEvent,
};
