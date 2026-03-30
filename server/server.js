const mongoose = require('mongoose');
const config = require('./utils/config');
const { initializeSocket } = require('./utils/socket');

process.on('uncaughtException', (err) => {
  // Always log critical errors even in production
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

const app = require('./app');

// Get database configuration
const dbUrl = config.database;
const dbPassword = config.databasePassword;

const DB = dbUrl.replace('<PASSWORD>', dbPassword);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
  })
  .then(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('DB connection successful!');
    }
  })
  .catch((err) => {
    // Always log DB connection errors
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });

const { port } = config;
const server = app.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`App running on port ${port}...`);
  }
});

// Initialize Socket.io
initializeSocket(server);

process.on('unhandledRejection', (err) => {
  // Always log critical errors even in production
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown for Azure App Services
// Azure sends SIGTERM when recycling or scaling down
const gracefulShutdown = async () => {
  console.log('Graceful shutdown initiated...');

  // Close HTTP server
  server.close(async () => {
    // Close database connection
    try {
      await mongoose.disconnect();
      if (process.env.NODE_ENV === 'development') {
        console.log('Database disconnected');
      }
    } catch (err) {
      console.error('Error disconnecting database:', err.message);
    }

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
