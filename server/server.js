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

const port = config.port || 3000;
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
