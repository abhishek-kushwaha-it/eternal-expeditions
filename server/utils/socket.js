const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const User = require('../models/userModel');

let io;

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

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const jwtCookie = cookieHeader
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('jwt='));

      if (!jwtCookie) return next(new Error('Unauthorized'));

      const token = decodeURIComponent(jwtCookie.slice(4));
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);

      if (!user || user.changedPasswordAfter(decoded.iat)) {
        return next(new Error('Unauthorized'));
      }

      socket.data.userId = user._id.toString();
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user-${socket.data.userId}`);

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
