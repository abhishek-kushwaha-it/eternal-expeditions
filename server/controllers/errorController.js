const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  let message = `This email is already registered.`;

  // Try to extract from keyValue (MongoDB 4.4+)
  if (err.keyValue && err.keyValue.email) {
    message = `An account with this email already exists. Please log in or use a different email.`;
  }
  // Try to extract from errmsg (older MongoDB versions)
  else if (err.errmsg && err.errmsg.includes('email')) {
    message = `An account with this email already exists. Please log in or use a different email.`;
  }

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const handleMongoNetworkError = (err) => {
  const message = `Network error connecting to database: ${err.message}. Please try again later.`;
  return new AppError(message, 503);
};

const handleMongoSecurityError = () => {
  const message = `Security error: Authentication failed. Please check your database credentials.`;
  return new AppError(message, 401);
};

const handleMongoServerError = (err) => {
  const message = `Database server error: ${err.message}. Please try again later.`;
  return new AppError(message, 503);
};

const sendErrorDev = (err, req, res) => {
  // Return full error details in development
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', err);
  }
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error('ERROR 💥', err);
  }

  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  // Handle specific MongoDB/Mongoose errors - apply in both dev and production
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoNetworkTimeoutError'
  )
    error = handleMongoNetworkError(error);
  if (
    error.name === 'MongoSecurityError' ||
    error.message.includes('authentication')
  )
    error = handleMongoSecurityError(error);
  if (error.name === 'MongoServerError' || (error.code && error.code >= 40000))
    error = handleMongoServerError(error);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, req, res);
  }
};
