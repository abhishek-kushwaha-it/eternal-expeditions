const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');

const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const { deleteFiles, resolveChildPath } = require('../utils/fileUtils');
const { filterObject } = require('../utils/objectUtils');

// Get all tours for public listing
exports.getAllTours = factory.getAll(Tour);

// Get all tours for admin management
exports.getAllToursAdmin = catchAsync(async (req, res, next) => {
  // Build query with APIFeatures
  const features = new APIFeatures(Tour.find(), req.query)
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
exports.createTour = catchAsync(async (req, res) => {
  const tourData = filterObject(
    req.body,
    'name',
    'duration',
    'maxGroupSize',
    'difficulty',
    'price',
    'priceDiscount',
    'summary',
    'description',
    'imageCover',
    'images',
    'startDates',
    'startLocation',
    'locations',
    'guides'
  );
  const tour = await Tour.create(tourData);

  res.status(201).json({
    status: 'success',
    data: { data: tour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No document found with that ID', 404));
  }

  const updateData = filterObject(
    req.body,
    'name',
    'duration',
    'maxGroupSize',
    'difficulty',
    'price',
    'priceDiscount',
    'summary',
    'description',
    'imageCover',
    'images',
    'startDates',
    'startLocation',
    'locations',
    'guides'
  );

  if (updateData.name !== undefined) {
    updateData.slug = slugify(updateData.name, { lower: true });
  }

  const nextPrice = updateData.price ?? tour.price;
  const nextDiscount = updateData.priceDiscount ?? tour.priceDiscount;
  if (nextDiscount >= nextPrice) {
    return next(
      new AppError('Discount price should be below regular price', 400)
    );
  }

  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!updatedTour) {
    return next(new AppError('No document found with that ID', 404));
  }

  if (req.tourImagesToDelete?.length) {
    await deleteFiles(
      req.tourImagesToDelete.map((imageName) =>
        resolveChildPath(path.join(__dirname, '../public/img/tours'), imageName)
      )
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedTour,
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

  const imagesToDelete = [tour.imageCover, ...(tour.images || [])]
    .filter(Boolean)
    .map((imageName) =>
      resolveChildPath(path.join(__dirname, '../public/img/tours'), imageName)
    );

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

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  await deleteFiles(imagesToDelete);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
