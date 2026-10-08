const path = require('path');
const slugify = require('slugify');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const config = require('../utils/config');
const { createImageUploader } = require('../utils/uploadUtils');
const { resizeAndSaveJpeg } = require('../utils/imageUtils');

const tourImageDirectory = path.join(__dirname, '../public/img/tours');

const upload = createImageUploader({
  allowedTypes: config.allowedImageTypes.split(','),
  maxFileSize: config.maxFileSize,
});

const resolveImagesToKeep = (value, existingImages) => {
  let requestedImages = existingImages;

  if (value !== undefined) {
    try {
      requestedImages = typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      throw new AppError('imagesToKeep must be valid JSON.', 400);
    }

    if (!Array.isArray(requestedImages)) {
      throw new AppError('imagesToKeep must be an array.', 400);
    }
  }

  const kept = existingImages.filter((imageName) =>
    requestedImages.includes(imageName)
  );

  return {
    kept,
    removed: existingImages.filter((imageName) => !kept.includes(imageName)),
  };
};

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  const uploadedFiles = req.files || {};
  const hasUploadedImages = uploadedFiles.imageCover || uploadedFiles.images;
  const hasImageKeepList = req.body.imagesToKeep !== undefined;
  if (req.body.imageCover !== undefined && !uploadedFiles.imageCover) {
    throw new AppError(
      'Upload a cover image file instead of a file name.',
      400
    );
  }
  if (
    req.body.images !== undefined &&
    !uploadedFiles.images &&
    !hasImageKeepList
  ) {
    throw new AppError('Upload image files instead of image file names.', 400);
  }

  if (!hasUploadedImages && !hasImageKeepList) {
    return next();
  }

  const oldTour = req.params.id ? await Tour.findById(req.params.id) : null;
  const tourName =
    typeof req.body.name === 'string' && req.body.name.trim()
      ? req.body.name.trim()
      : 'tour';
  const tourUniqueName =
    slugify(tourName, { lower: true, strict: true }) || 'tour';
  req.tourImagesToDelete = [];

  if (uploadedFiles.imageCover) {
    if (oldTour?.imageCover) {
      req.tourImagesToDelete.push(oldTour.imageCover);
    }

    req.body.imageCover = `tour-${tourUniqueName}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-cover.jpeg`;
    await resizeAndSaveJpeg(
      uploadedFiles.imageCover[0].buffer,
      path.join(tourImageDirectory, req.body.imageCover),
      2000,
      1333
    );
  }

  if (uploadedFiles.images || hasImageKeepList) {
    const existingImages = Array.isArray(oldTour?.images) ? oldTour.images : [];
    const { kept, removed } = resolveImagesToKeep(
      req.body.imagesToKeep,
      existingImages
    );

    req.tourImagesToDelete.push(...removed);
    req.body.images = [...kept];

    if (uploadedFiles.images) {
      await Promise.all(
        uploadedFiles.images.map(async (file, index) => {
          const filename = `tour-${tourUniqueName}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}-${index + 1}.jpeg`;
          await resizeAndSaveJpeg(
            file.buffer,
            path.join(tourImageDirectory, filename),
            2000,
            1333
          );
          req.body.images.push(filename);
        })
      );
    }
  }

  req.tourImagesToDelete = [...new Set(req.tourImagesToDelete)];
  next();
});
