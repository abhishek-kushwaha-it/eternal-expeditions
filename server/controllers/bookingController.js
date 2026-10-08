const stripe = require('stripe');
const config = require('../utils/config');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const { createManualBookingData } = require('../utils/bookingUtils');
const { filterObject } = require('../utils/objectUtils');

const stripeClient = stripe(config.stripeSecretKey);

// BOOKING CONTROLLERS
exports.checkBookingAccess = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'guide' &&
    booking.user?._id?.toString() !== req.user.id
  ) {
    return next(
      new AppError('You do not have permission to access this booking', 403)
    );
  }

  next();
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }

  const unitAmount = Math.round((tour.price - (tour.priceDiscount || 0)) * 100);
  const frontendUrl =
    config.frontendUrl || `${req.protocol}://${req.get('host')}`;

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    metadata: {
      tour_id: tour._id.toString(),
      user_email: req.user.email,
      user_id: req.user._id.toString(),
    },
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    success_url: `${frontendUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/tour/${tour.id}`,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`${config.frontendUrl}/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  // DEVELOPMENT MODE: Create booking immediately (for testing without webhooks)
  if (process.env.NODE_ENV === 'development') {
    try {
      const existingBooking = await Booking.findOne({
        sessionId: session.id,
      });

      if (!existingBooking) {
        await Booking.create(
          createManualBookingData({
            tour: req.params.tourId,
            user: req.user._id,
            price: unitAmount / 100,
            paymentMethod: 'card',
            paymentStatus: 'succeeded',
            sessionId: session.id,
          })
        );
      }
    } catch (error) {
      console.error('[DEV MODE] Error creating booking:', error.message);
    }
  }

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate('tour')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

exports.createBooking = catchAsync(async (req, res, next) => {
  // Manual booking creation with proper field handling
  const { tour, user, price, paymentMethod, paymentStatus } = req.body;

  // Validate required fields
  if (!tour || !user || !price) {
    return next(new AppError('Tour, User, and Price are required fields', 400));
  }

  const [existingTour, existingUser] = await Promise.all([
    Tour.findById(tour),
    User.findById(user),
  ]);
  if (!existingTour) return next(new AppError('Tour not found', 404));
  if (!existingUser) return next(new AppError('User not found', 404));

  const bookingData = createManualBookingData({
    tour,
    user,
    price,
    paymentMethod,
    paymentStatus,
  });

  const booking = await Booking.create(bookingData);

  res.status(201).json({
    status: 'success',
    data: {
      data: booking,
    },
  });
});

exports.getBooking = factory.getOne(Booking, 'tour');
exports.getAllBookings = factory.getAll(Booking);

// Custom update for payment status consistency
exports.updateBooking = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = filterObject(
    req.body,
    'price',
    'paymentStatus',
    'paymentMethod',
    'failureReason'
  );
  if (Object.keys(updateData).length === 0) {
    return next(
      new AppError('No supported booking fields were provided.', 400)
    );
  }

  const booking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: booking,
    },
  });
});

exports.deleteBooking = factory.deleteOne(Booking);
