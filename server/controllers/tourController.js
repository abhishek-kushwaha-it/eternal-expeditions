const multer = require('multer');
const sharp = require('sharp');
const util = require('util');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const unlinkAsync = util.promisify(fs.unlink);
const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files || (!req.files.imageCover && !req.files.images)) {
    return next();
  }

  // Get old tour if updating (PATCH request), to delete old images
  let oldTour = null;
  if (req.params.id) {
    oldTour = await Tour.findById(req.params.id);
  }

  // Get tour name from req.body, ensure it exists and is a string
  const tourName =
    req.body.name && typeof req.body.name === 'string'
      ? req.body.name.trim()
      : 'tour';

  const tourUniqueName = tourName.replace(/\s+/g, '-').toLowerCase();

  // 1) Cover image
  if (req.files.imageCover) {
    // Delete old cover image if updating
    if (oldTour && oldTour.imageCover) {
      try {
        const oldCoverPath = path.join(
          __dirname,
          '../public/img/tours',
          oldTour.imageCover
        );
        await unlinkAsync(oldCoverPath);
      } catch (err) {
        // Continue even if deletion fails (file might not exist)
      }
    }

    req.body.imageCover = `tour-${tourUniqueName}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // 2) Images
  if (req.files.images || req.body.imagesToKeep) {
    // Case 1: New images uploaded - delete old, add new
    if (req.files.images) {
      // Delete old additional images if updating
      if (oldTour && oldTour.images && Array.isArray(oldTour.images)) {
        await Promise.all(
          oldTour.images.map(async (imageName) => {
            try {
              const oldImagePath = path.join(
                __dirname,
                '../public/img/tours',
                imageName
              );
              await unlinkAsync(oldImagePath);
            } catch (err) {
              // Continue even if deletion fails
            }
          })
        );
      }

      req.body.images = [];

      await Promise.all(
        req.files.images.map(async (file, i) => {
          const filename = `tour-${tourUniqueName}-${Date.now()}-${i + 1}.jpeg`;

          await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);

          req.body.images.push(filename);
        })
      );
    }
    // Case 2: No new images but imagesToKeep provided - user removed images
    // Delete only the images not in the keep list
    else if (
      req.body.imagesToKeep &&
      typeof req.body.imagesToKeep === 'string'
    ) {
      try {
        const imagesToKeep = JSON.parse(req.body.imagesToKeep);
        if (
          Array.isArray(imagesToKeep) &&
          oldTour &&
          oldTour.images &&
          Array.isArray(oldTour.images)
        ) {
          // Find images to delete
          const imagesToDelete = oldTour.images.filter(
            (img) => !imagesToKeep.includes(img)
          );

          // Delete removed images from filesystem
          await Promise.all(
            imagesToDelete.map(async (imageName) => {
              try {
                const oldImagePath = path.join(
                  __dirname,
                  '../public/img/tours',
                  imageName
                );
                await unlinkAsync(oldImagePath);
              } catch (err) {
                // Continue even if deletion fails
              }
            })
          );

          // Update images array to keep only the specified ones
          req.body.images = imagesToKeep;
        }
      } catch (err) {
        // If parsing fails, don't modify images
      }
    }
  }

  next();
});

// Middleware to sanitize FormData string fields to proper MongoDB types
exports.dataSanitization = catchAsync(async (req, res, next) => {
  // String fields - trim
  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }
  if (req.body.summary) {
    req.body.summary = req.body.summary.trim();
  }
  if (req.body.description) {
    req.body.description = req.body.description.trim();
  }

  // Numeric fields - convert to numbers
  if (req.body.duration) {
    req.body.duration = parseInt(req.body.duration, 10);
  }
  if (req.body.maxGroupSize) {
    req.body.maxGroupSize = parseInt(req.body.maxGroupSize, 10);
  }
  if (req.body.price) {
    req.body.price = parseFloat(req.body.price);
  }
  if (req.body.priceDiscount) {
    req.body.priceDiscount = parseFloat(req.body.priceDiscount);
  }
  if (req.body.ratingsAverage) {
    req.body.ratingsAverage = parseFloat(req.body.ratingsAverage);
  }
  if (req.body.ratingsQuantity) {
    req.body.ratingsQuantity = parseInt(req.body.ratingsQuantity, 10);
  }

  // Boolean field - convert string to boolean (handle both string and falsy values)
  if (
    req.body.secretTour !== undefined &&
    req.body.secretTour !== null &&
    typeof req.body.secretTour === 'string'
  ) {
    req.body.secretTour = req.body.secretTour === 'true';
  } else if (
    req.body.secretTour !== undefined &&
    req.body.secretTour !== null &&
    typeof req.body.secretTour === 'boolean'
  ) {
    // Already a boolean, leave as is
    req.body.secretTour = Boolean(req.body.secretTour);
  }

  // Parse startLocation from JSON string to object
  if (req.body.startLocation && typeof req.body.startLocation === 'string') {
    try {
      req.body.startLocation = JSON.parse(req.body.startLocation);
    } catch (e) {
      // startLocation parsing failed, continue with original value
    }
  }

  // Convert startLocation coordinates to numbers (longitude, latitude)
  if (req.body.startLocation && req.body.startLocation.coordinates) {
    req.body.startLocation.coordinates = req.body.startLocation.coordinates.map(
      (coord) => {
        // Skip empty coordinates
        if (coord === '' || coord === null || coord === undefined) {
          return 0;
        }
        const num = parseFloat(coord);
        return Number.isNaN(num) ? 0 : num;
      }
    );

    // If coordinates are [0, 0], remove startLocation to prevent validation issues
    if (
      req.body.startLocation.coordinates[0] === 0 &&
      req.body.startLocation.coordinates[1] === 0
    ) {
      delete req.body.startLocation;
    }
  }

  // Parse locations from JSON string to array
  if (req.body.locations && typeof req.body.locations === 'string') {
    try {
      req.body.locations = JSON.parse(req.body.locations);
    } catch (e) {
      // locations parsing failed, continue with original value
    }
  }

  // Convert locations array coordinates to numbers
  if (Array.isArray(req.body.locations)) {
    req.body.locations = req.body.locations.map((location) => {
      if (location.coordinates) {
        location.coordinates = location.coordinates.map((coord) => {
          const num = parseFloat(coord);
          return Number.isNaN(num) ? 0 : num;
        });
      }
      if (location.day) {
        location.day = parseInt(location.day, 10);
      }
      if (location.address) {
        location.address = location.address.trim();
      }
      if (location.description) {
        location.description = location.description.trim();
      }
      return location;
    });
  }

  // Convert startDates to Date objects array
  if (req.body.startDates) {
    try {
      // Parse if it's a JSON string
      if (typeof req.body.startDates === 'string') {
        // Try to parse as JSON array first
        try {
          const parsed = JSON.parse(req.body.startDates);
          if (Array.isArray(parsed)) {
            req.body.startDates = parsed
              .filter((d) => d && d.trim()) // Filter out empty strings
              .map((date) => new Date(date));
          } else {
            // Single date string
            req.body.startDates = [new Date(req.body.startDates)];
          }
        } catch (jsonErr) {
          // Not JSON, treat as single date string
          req.body.startDates = [new Date(req.body.startDates)];
        }
      } else if (Array.isArray(req.body.startDates)) {
        // Already an array - filter out empty values and convert to dates
        req.body.startDates = req.body.startDates
          .filter((d) => d && (typeof d === 'string' ? d.trim() : d)) // Filter out empty strings/nulls
          .map((date) => new Date(date));
      }
    } catch (err) {
      // If date parsing fails, set to empty array
      req.body.startDates = [];
    }
  }

  // Parse and validate guides array
  if (req.body.guides) {
    try {
      // If guides is a JSON string, parse it to array
      if (typeof req.body.guides === 'string') {
        req.body.guides = JSON.parse(req.body.guides);
      }

      // Ensure guides is an array
      if (!Array.isArray(req.body.guides)) {
        req.body.guides = [];
      }

      // Validate each guide ID is a valid MongoDB ObjectId string
      req.body.guides = req.body.guides.filter((guideId) => {
        if (!guideId) return false;
        // Check if it's a valid MongoDB ObjectId format
        return mongoose.Types.ObjectId.isValid(guideId);
      });
    } catch (err) {
      // If parsing fails, set guides to empty array
      req.body.guides = [];
    }
  }

  // Remove temporary fields that shouldn't be stored in database
  delete req.body.imagesToKeep;
  delete req.body.existingImages;

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  // req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// Get all tours for public listing (excludes secret tours)
exports.getAllTours = factory.getAll(Tour);

// Get all tours for admin management (includes secret tours)
exports.getAllToursAdmin = catchAsync(async (req, res, next) => {
  // Build query with APIFeatures
  const features = new APIFeatures(
    Tour.find().setOptions({ includeSecretTours: true }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// Protected getTour for authenticated admins/guides - includes secret tours
exports.getProtectedTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id)
    .setOptions({ includeSecretTours: true })
    .populate({ path: 'reviews' });

  if (!tour) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: tour,
    },
  });
});
exports.createTour = factory.createOne(Tour);

// Custom updateTour with priceDiscount validation
exports.updateTour = catchAsync(async (req, res, next) => {
  // Get the current tour directly from collection to bypass middleware filter
  const tourDoc = await Tour.collection.findOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  });

  if (!tourDoc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Convert to Tour instance for validation
  const tour = new Tour(tourDoc);

  // If priceDiscount is being updated, validate it against price
  if (req.body.priceDiscount !== undefined) {
    const price = req.body.price || tour.price; // Use new price if provided, otherwise current price
    const discount = req.body.priceDiscount;

    if (discount >= price) {
      return next(
        new AppError('Discount price should be below regular price', 400)
      );
    }
  }

  // Proceed with update using collection to bypass middleware
  await Tour.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    { $set: req.body }
  );

  // Fetch the updated document directly from collection to ensure we get all fields including secretTour
  const updatedDoc = await Tour.collection.findOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedDoc,
    },
  });
});

// Custom deleteTour handler with cascade delete for reviews and image cleanup
exports.deleteTour = catchAsync(async (req, res, next) => {
  // 1) Get the tour directly from collection to bypass middleware filter
  const tourDoc = await Tour.collection.findOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  });

  if (!tourDoc) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Convert to Tour instance for property access
  const tour = new Tour(tourDoc);

  // Start a transaction for atomic cascade deletes
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2) Delete all reviews associated with this tour
    await Review.deleteMany({ tour: req.params.id }, { session });

    // 2a) Delete all bookings associated with this tour
    await Booking.deleteMany({ tour: req.params.id }, { session });

    // 3) Delete the tour document directly from collection (bypasses middleware)
    const deleteResult = await Tour.collection.deleteOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { session }
    );

    if (deleteResult.deletedCount === 0) {
      throw new AppError('Failed to delete tour document', 500);
    }

    // 4) Delete tour images from filesystem
    const imagesToDelete = [];

    // Add cover image
    if (tour.imageCover) {
      imagesToDelete.push(tour.imageCover);
    }

    // Add all other images
    if (tour.images && Array.isArray(tour.images)) {
      imagesToDelete.push(...tour.images);
    }

    // Delete each image file from the filesystem
    await Promise.all(
      imagesToDelete.map(async (imageName) => {
        try {
          const imagePath = path.join(
            __dirname,
            '../public/img/tours',
            imageName
          );
          await unlinkAsync(imagePath);
          // console.log(`✅ Deleted image: ${imageName}`); // Helpful for development
        } catch (err) {
          // Log but continue - files may not exist, but transaction data is safe
          // console.log(
          //   `⚠️ Image deletion failed: ${imageName} - ${err.message}`
          // ); // Helpful for development
        }
      })
    );

    // Commit transaction
    await session.commitTransaction();
    // console.log(`✅ Tour ${req.params.id} deleted with all associated data`); // Helpful for development

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    // Rollback transaction on any error
    await session.abortTransaction();
    // console.error(`❌ Tour deletion failed: ${err.message}`); // Helpful for development
    throw err;
  } finally {
    session.endSession();
  }
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // {
    //   $match: { ratingsAverage: { $gte: 4.5 } }
    // },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2026

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Validate and convert parameters
  const dist = parseFloat(distance);
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (Number.isNaN(dist) || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return next(
      new AppError(
        'Please provide valid distance, latitude and longitude in the format: /distance/center/lat,lng/unit',
        400
      )
    );
  }

  if (latitude < -90 || latitude > 90) {
    return next(new AppError('Latitude must be between -90 and 90', 400));
  }

  if (longitude < -180 || longitude > 180) {
    return next(new AppError('Longitude must be between -180 and 180', 400));
  }

  if (dist <= 0) {
    return next(new AppError('Distance must be greater than 0', 400));
  }

  const radius = unit === 'mi' ? dist / 3963.2 : dist / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // Validate lat/lng with proper conversion
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng (e.g., 40.7128,-74.0060).',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        distance: 1,
        price: 1,
        difficulty: 1,
        duration: 1,
        maxGroupSize: 1,
        ratingsAverage: 1,
        ratingsQuantity: 1,
        imageCover: 1,
        startDates: 1,
        locations: 1,
        summary: 1,
        startLocation: 1,
        priceDiscount: 1,
        id: 1,
      },
    },
    {
      $sort: { distance: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
