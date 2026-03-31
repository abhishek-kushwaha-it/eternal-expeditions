const socketIO = require('socket.io');

let io;
const userSockets = new Map(); // Map userId -> socketId

exports.initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] User connected: ${socket.id}`);

    // Register user when they connect
    socket.on('registerUser', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user-${userId}`); // Join room specific to user
      console.log(
        `[WebSocket] User ${userId} registered with socket ${socket.id}`
      );
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`[WebSocket] User ${socket.userId} disconnected`);
      }
    });

    socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  return io;
};

// Emit booking status change to specific user
exports.emitBookingStatusChange = (userId, bookingData) => {
  if (!io) {
    console.warn('[WebSocket] Socket.io not initialized');
    return;
  }

  io.to(`user-${userId}`).emit('bookingStatusChanged', {
    bookingId: bookingData._id,
    sessionId: bookingData.stripeSessionId,
    paymentStatus: bookingData.paymentStatus,
    paymentMethod: bookingData.paymentMethod,
    failureReason: bookingData.failureReason,
    timestamp: new Date().toISOString(),
  });

  console.log(
    `[WebSocket] Emitted status change to user ${userId}: ${bookingData.paymentStatus}`
  );
};

exports.getIO = () => io;
exports.getUserSockets = () => userSockets;
