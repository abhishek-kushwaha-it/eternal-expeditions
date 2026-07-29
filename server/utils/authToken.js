const jwt = require('jsonwebtoken');
const config = require('./config');

const signToken = (id) =>
  jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwtCookieExpiresIn * 24 * 60 * 60 * 1000
    ),
    httpOnly: config.cookieHttpOnly,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const sendBackgroundEmail = (emailPromise, description = 'email') => {
  emailPromise.catch((err) => {
    console.error(`Failed to send ${description}:`, err);
  });
};

module.exports = { signToken, createSendToken, sendBackgroundEmail };
