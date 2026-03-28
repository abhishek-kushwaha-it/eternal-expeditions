// Configuration Module - Loads from .env.development or .env.production
// Based on NODE_ENV or defaults to development

require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
});

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'DATABASE',
  'DATABASE_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_COOKIE_EXPIRES_IN',
  'EMAIL_FROM',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'SENDGRID_USERNAME',
  'SENDGRID_PASSWORD',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'MAX_FILE_SIZE',
  'ALLOWED_IMAGE_TYPES',
  'LOG_LEVEL',
  'ENABLE_REQUEST_LOGGING',
  'COOKIE_SECURE',
  'COOKIE_HTTP_ONLY',
  'COOKIE_SAME_SITE',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    'Missing required environment variables:',
    missingEnvVars.join(', ')
  );
  process.exit(1);
}

const config = {
  // Server Config
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  frontendUrl: process.env.FRONTEND_URL,

  // Database Config
  database: process.env.DATABASE,
  databasePassword: process.env.DATABASE_PASSWORD,

  // JWT Config
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtCookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN,

  // Email Config
  emailFrom: process.env.EMAIL_FROM,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  sendgridUsername: process.env.SENDGRID_USERNAME,
  sendgridPassword: process.env.SENDGRID_PASSWORD,

  // Stripe Config
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // File Upload Config
  maxFileSize: process.env.MAX_FILE_SIZE,
  allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES,

  // Logging Config
  logLevel: process.env.LOG_LEVEL,
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',

  // Cookie Security Config
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieHttpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
  cookieSameSite: process.env.COOKIE_SAME_SITE,
};

module.exports = config;
