const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Validate that user has booked the tour before allowing review
exports.validateBooking = catchAsync(async (req, res, next) => {
  const tourId = req.body.tour || req.params.tourId;

  // Check if user has booked this tour
  const booking = await Booking.findOne({
    user: req.user.id,
    tour: tourId,
  });

  if (!booking) {
    return next(new AppError('You can only review tours you have booked', 403));
  }

  next();
});

// Validate authorization for review operations (edit/delete)
exports.validateReviewOwnership = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Allow if user is admin or review owner
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'guide' &&
    review.user._id.toString() !== req.user.id
  ) {
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }

  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);

// Get current user's reviews
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id }).populate('tour');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      data: reviews,
    },
  });
});

exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
