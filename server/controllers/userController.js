const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const config = require('../utils/config');
const factory = require('./handlerFactory');
const { filterObject } = require('../utils/objectUtils');
const { safeUnlink, resolveChildPath } = require('../utils/fileUtils');
const { createImageUploader } = require('../utils/uploadUtils');
const { resizeAndSaveJpeg } = require('../utils/imageUtils');

const upload = createImageUploader({
  allowedTypes: config.allowedImageTypes.split(','),
  maxFileSize: config.maxFileSize,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Get old user if updating, to delete old photo
  const oldUser = await User.findById(req.user.id);
  req.oldUserPhoto = oldUser?.photo;

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await resizeAndSaveJpeg(
    req.file.buffer,
    resolveChildPath(
      path.join(__dirname, '../public/img/users'),
      req.file.filename
    ),
    500,
    500
  );

  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObject(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  if (
    req.oldUserPhoto &&
    req.oldUserPhoto !== 'default.jpg' &&
    req.oldUserPhoto !== updatedUser.photo
  ) {
    await safeUnlink(
      resolveChildPath(
        path.join(__dirname, '../public/img/users'),
        req.oldUserPhoto
      )
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 1) If user is a guide, remove them from the guides array in all tours
  if (user.role === 'guide') {
    await Tour.updateMany({ guides: userId }, { $pull: { guides: userId } });
  }

  // 2) Mark user as inactive (soft delete)
  await User.findByIdAndUpdate(userId, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

exports.getGuides = catchAsync(async (req, res) => {
  const guides = await User.find({ role: 'guide' }).select('_id name role');

  res.status(200).json({
    status: 'success',
    results: guides.length,
    data: { data: guides },
  });
});

exports.getAssignableGuides = catchAsync(async (req, res) => {
  const guides = await User.find({ role: { $in: ['guide', 'admin'] } }).select(
    '_id name role'
  );

  res.status(200).json({
    status: 'success',
    results: guides.length,
    data: { data: guides },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'User passwords must be changed through the password flow.',
        400
      )
    );
  }

  const filteredBody = filterObject(
    req.body,
    'name',
    'email',
    'role',
    'active'
  );
  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError('No supported user fields were provided.', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedUser) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { data: updatedUser },
  });
});

// Custom deleteUser handler with cascade delete for reviews, bookings, and guide removal
exports.deleteUser = catchAsync(async (req, res, next) => {
  // 1) Get the user to check their role
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No document found with that ID', 404));
  }

  // Start a transaction for atomic cascade deletes
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2) Delete all reviews created by this user
    const reviews = await Review.find({ user: req.params.id })
      .select('tour')
      .session(session);
    const affectedTourIds = [
      ...new Set(reviews.map((review) => review.tour.toString())),
    ];
    await Review.deleteMany({ user: req.params.id }, { session });
    await Promise.all(
      affectedTourIds.map((tourId) =>
        Review.calcAverageRatings(tourId, session)
      )
    );

    // 3) Delete all bookings created by this user
    await Booking.deleteMany({ user: req.params.id }, { session });

    // 4) If user is a guide, remove them from the guides array in all tours
    if (user.role === 'guide') {
      await Tour.updateMany(
        { guides: req.params.id },
        { $pull: { guides: req.params.id } },
        { session }
      );
    }

    // 5) Delete the user document
    await User.findByIdAndDelete(req.params.id, { session });

    // Commit transaction
    await session.commitTransaction();
  } catch (err) {
    // Rollback transaction on any error
    await session.abortTransaction();
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ User deletion failed: ${err.message}`);
    }
    throw err;
  } finally {
    session.endSession();
  }

  if (user.photo && user.photo !== 'default.jpg') {
    await safeUnlink(
      resolveChildPath(path.join(__dirname, '../public/img/users'), user.photo)
    );
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
