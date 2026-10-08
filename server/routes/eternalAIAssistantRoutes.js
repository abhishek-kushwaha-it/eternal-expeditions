const express = require('express');
const authController = require('../controllers/authController');
const eternalAIAssistantController = require('../controllers/eternalAIAssistantController');

const router = express.Router();

const optionalProtect = (req, res, next) => {
  const hasBearerToken =
    req.headers.authorization?.startsWith('Bearer ') || false;
  const hasCookieToken = Boolean(req.cookies?.jwt);

  if (!hasBearerToken && !hasCookieToken) return next();
  return authController.protect(req, res, next);
};

router.use(optionalProtect);
router.post('/chat', eternalAIAssistantController.chatWithEternalAIAssistant);

module.exports = router;
