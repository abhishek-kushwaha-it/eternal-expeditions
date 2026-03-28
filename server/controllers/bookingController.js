const stripe = require('stripe');
const config = require('../utils/config');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const stripeClient = stripe(config.stripeSecretKey);

// Stripe webhook signature verification
exports.verifyStripeWebhook = (req, res, next) => {
  if (!config.stripeWebhookSecret) {
    return res.status(400).json({ message: 'Webhook secret not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// Middleware to check if user can access a booking (own booking or is admin/guide)
exports.checkBookingAccess = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Allow access if user is admin/guide or booking owner
  // booking.user is populated as an object, so use ._id
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'guide' &&
    booking.user._id.toString() !== req.user.id
  ) {
    return next(
      new AppError('You do not have permission to access this booking', 403)
    );
  }

  next();
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }

  // Get frontend URL from environment
  const frontendUrl =
    config.frontendUrl || `${req.protocol}://${req.get('host')}`;

  // 2) Create checkout session
  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],

    success_url: `${frontendUrl}/my-tour-bookings/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${frontendUrl}/tour/${tour.id}`,

    customer_email: req.user.email,
    client_reference_id: req.params.tourId,

    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, // cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  // Get all bookings for the current user
  const bookings = await Booking.find({ user: req.user.id }).populate('tour');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying and also from others users-ids
  const { tour, user, price } = req.body;

  if (!tour || !user || !price) {
    return next(new AppError('Missing tour, user or price information', 400));
  }

  // Validate that tour exists
  const tourExists = await Tour.findById(tour);
  if (!tourExists) {
    return next(new AppError('Tour not found', 404));
  }

  const booking = await Booking.create({ tour, user, price, paid: true });
  res.status(201).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking, 'tour');
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
