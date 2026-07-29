const sharp = require('sharp');
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
const { safeUnlink } = require('../utils/fileUtils');
const { createImageUploader } = require('../utils/uploadUtils');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const upload = createImageUploader({
  allowedTypes: config.allowedImageTypes.split(','),
  maxFileSize: config.maxFileSize,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Get old user if updating, to delete old photo
  const oldUser = await User.findById(req.user.id);

  // Delete old profile photo if it exists
  if (oldUser && oldUser.photo && oldUser.photo !== 'default.jpg') {
    const oldPhotoPath = path.join(
      __dirname,
      '../public/img/users',
      oldUser.photo
    );
    await safeUnlink(oldPhotoPath);
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

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
    // console.log(`✅ Removed guide ${userId} from all tours`); // Helpful for development
  }

  // 2) Mark user as inactive (soft delete)
  await User.findByIdAndUpdate(userId, { active: false });
  // console.log(`✅ Marked user ${userId} as inactive`); // Helpful for development

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);

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
    await Review.deleteMany({ user: req.params.id }, { session });
    // console.log(`✅ Deleted all reviews by user ${req.params.id}`); // Helpful for development

    // 3) Delete all bookings created by this user
    await Booking.deleteMany({ user: req.params.id }, { session });
    // console.log(`✅ Deleted all bookings by user ${req.params.id}`); // Helpful for development

    // 4) If user is a guide, remove them from the guides array in all tours
    if (user.role === 'guide') {
      await Tour.updateMany(
        { guides: req.params.id },
        { $pull: { guides: req.params.id } },
        { session }
      );
      // console.log(`✅ Removed guide ${req.params.id} from all tours`); // Helpful for development
    }

    // 5) Delete the user document
    await User.findByIdAndDelete(req.params.id, { session });
    // console.log(`✅ Deleted user ${req.params.id}`); // Helpful for development

    // Commit transaction
    await session.commitTransaction();

    // 6) Delete user's profile photo from filesystem (after transaction is safely committed)
    if (user.photo && user.photo !== 'default.jpg') {
      const userPhotoPath = path.join(
        __dirname,
        '../public/img/users',
        user.photo
      );
      await safeUnlink(userPhotoPath);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
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
});
