const socketIO = require('socket.io');

let io;
const userSockets = new Map(); // Map userId -> socketId

exports.initializeSocket = (server) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log('[Socket] Initializing socket.io with CORS origin:', frontendUrl);

  io = socketIO(server, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // Register user when they connect
    socket.on('registerUser', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user-${userId}`); // Join room specific to user
      console.log(`[Socket] User ${userId} registered`);
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }
    });

    socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  });

  console.log('[Socket] Socket.io initialized successfully');
  return io;
};

// Emit booking status change to specific user
exports.emitBookingStatusChange = (userId, bookingData) => {
  if (!io) {
    console.warn(
      '[Socket] Socket.io not initialized when trying to emit booking status change'
    );
    return;
  }

  if (!userId) {
    console.warn('[Socket] No userId provided for booking status change emit');
    return;
  }

  const eventData = {
    bookingId: bookingData._id,
    sessionId: bookingData.sessionId,
    paymentStatus: bookingData.paymentStatus,
    paymentMethod: bookingData.paymentMethod,
    failureReason: bookingData.failureReason,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Socket] ✓ Emitting status update to user ${userId}`);

  io.to(`user-${userId}`).emit('bookingStatusChanged', eventData);
};

exports.getIO = () => io;
exports.getUserSockets = () => userSockets;
