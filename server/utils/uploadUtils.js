const multer = require('multer');
const AppError = require('./appError');

const memoryStorage = multer.memoryStorage();

const imageFileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        400
      ),
      false
    );
  }
};

const createImageUploader = ({ allowedTypes, maxFileSize }) =>
  multer({
    storage: memoryStorage,
    fileFilter: imageFileFilter(allowedTypes),
    limits: {
      fileSize: maxFileSize,
    },
  });

module.exports = { createImageUploader };
