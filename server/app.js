const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const cors = require('cors');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const bookingController = require('./controllers/bookingController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();
const config = require('./utils/config');

// Log environment at startup
console.log('========================================');
console.log('Application Starting...');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('Frontend URL:', config.frontendUrl);
console.log(
  'Running in:',
  process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : 'PRODUCTION'
);
console.log('========================================');

// Enable CORS for React frontend using environment-based configuration
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Trust proxy for Azure App Services
// Azure sends X-Forwarded-For header, so we need to trust the proxy
app.set('trust proxy', 1);

// Development logging with configurable log level
if (process.env.NODE_ENV === 'development') {
  if (config.enableRequestLogging) {
    const morganFormat = config.logLevel === 'debug' ? 'dev' : 'combined';
    app.use(morgan(morganFormat));
  }
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
  skip: (req) => req.path === '/api/v1/bookings/webhook/stripe',
  keyGenerator: (req) => {
    // Extract IP without port (Azure sends format: IP:PORT)
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return ip.split(':').pop(); // Get last part (handles IPv4 and IPv6)
  },
});
app.use('/api', limiter);

// Stripe webhook endpoint - must use raw body BEFORE json parser for signature verification
app.post(
  '/api/v1/bookings/webhook/stripe',
  express.raw({ type: 'application/json' }),
  bookingController.verifyStripeWebhook,
  bookingController.handleStripeWebhook
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(
  cookieParser(config.jwtSecret, {
    secure: config.cookieSecure,
    httpOnly: config.cookieHttpOnly,
    sameSite: config.cookieSameSite,
  })
);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES - API only (React handles views)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// For any other route, return 404 (React SPA will handle its own routing)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
