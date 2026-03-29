const stripe = require('stripe');
const config = require('../utils/config');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const { emitBookingStatusChange } = require('../utils/socket');

const stripeClient = stripe(config.stripeSecretKey);

// WEBHOOK MIDDLEWARE
exports.verifyStripeWebhook = (req, res, next) => {
  if (!config.stripeWebhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).json({ message: 'Webhook secret not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.warn('Missing Stripe signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;
  try {
    const rawBody = req.body;
    event = stripeClient.webhooks.constructEvent(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      sig,
      config.stripeWebhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// WEBHOOK HANDLER - PRODUCTION ONLY
exports.handleStripeWebhook = catchAsync(async (req, res) => {
  // Webhooks only for production
  if (config.nodeEnv !== 'production') {
    return res
      .status(200)
      .json({ status: 'success', message: 'Webhook ignored in development' });
  }

  const event = req.stripeEvent;

  console.log('Webhook event:', event.type);

  // Handle checkout completion - create booking
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      if (!session.client_reference_id || !session.customer_email) {
        console.error('Missing required session data');
        return res.status(200).json({ status: 'success' });
      }

      const tour = await Tour.findById(session.client_reference_id);
      if (!tour) {
        console.error(`Tour not found: ${session.client_reference_id}`);
        return res.status(200).json({ status: 'success' });
      }

      const user = await User.findOne({ email: session.customer_email });
      if (!user) {
        console.error(`User not found: ${session.customer_email}`);
        return res.status(200).json({ status: 'success' });
      }

      // Check for duplicates (idempotent)
      const existing = await Booking.findOne({
        tour: session.client_reference_id,
        user: user._id,
        stripeSessionId: session.id,
      });

      if (!existing) {
        const booking = await Booking.create({
          tour: session.client_reference_id,
          user: user._id,
          price: session.amount_total / 100,
          paid: true,
          stripeSessionId: session.id,
          stripePaymentStatus: session.payment_status,
          paymentMethod:
            (session.payment_method_types && session.payment_method_types[0]) ||
            'card',
        });
        console.log('Booking created successfully via webhook');

        // Emit real-time update to user
        emitBookingStatusChange(user._id.toString(), booking);
      }
    } catch (error) {
      console.error('Error processing checkout session:', error.message);
    }
  }

  // Handle charge succeeded
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object;
    try {
      console.log(`Charge succeeded: ${charge.id}`);
      if (charge.metadata && charge.metadata.booking_id) {
        const booking = await Booking.findByIdAndUpdate(
          charge.metadata.booking_id,
          {
            stripeChargeId: charge.id,
            stripePaymentStatus: 'succeeded',
          },
          { new: true }
        ).populate('user');

        // Emit real-time update to user
        if (booking && booking.user) {
          emitBookingStatusChange(booking.user._id.toString(), booking);
        }
      }
    } catch (error) {
      console.error('Error handling charge succeeded:', error.message);
    }
  }

  // Handle charge failed
  if (event.type === 'charge.failed') {
    const charge = event.data.object;
    try {
      console.error(`Charge failed: ${charge.id}`);
      if (charge.metadata && charge.metadata.booking_id) {
        const booking = await Booking.findByIdAndUpdate(
          charge.metadata.booking_id,
          {
            stripePaymentStatus: 'failed',
            failureReason: charge.failure_message,
          },
          { new: true }
        ).populate('user');

        // Emit real-time update to user
        if (booking && booking.user) {
          emitBookingStatusChange(booking.user._id.toString(), booking);
        }
      }
    } catch (error) {
      console.error('Error handling charge failed:', error.message);
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Webhook received and processed',
    event: event.type,
  });
});

// BOOKING CONTROLLERS
exports.checkBookingAccess = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

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
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }

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
          unit_amount: tour.price * 100,
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
  if (config.nodeEnv === 'development') {
    try {
      const existingBooking = await Booking.findOne({
        tour: req.params.tourId,
        user: req.user._id,
        stripeSessionId: session.id,
      });

      if (!existingBooking) {
        await Booking.create({
          tour: req.params.tourId,
          user: req.user._id,
          price: tour.price,
          paid: true,
          stripeSessionId: session.id,
          stripeChargeId: `dev_charge_${session.id.substring(0, 16)}`,
          stripePaymentIntentId: `dev_pi_${session.id.substring(0, 16)}`,
          stripePaymentStatus: 'succeeded',
          paymentMethod: 'card',
        });
        console.log('[DEV MODE] Booking created immediately (no webhook)');
      }
    } catch (error) {
      console.error('[DEV MODE] Error creating booking:', error.message);
      // Don't fail the request, still return session
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
  const { tour, user, price, paid, paymentMethod } = req.body;

  // Validate required fields
  if (!tour || !user || !price) {
    return next(new AppError('Tour, User, and Price are required fields', 400));
  }

  // Generate IDs for manual bookings
  const manualBookingId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const bookingData = {
    tour,
    user,
    price,
    paid: paid === true, // Only true if explicitly set
    paymentMethod: paymentMethod || 'other',
    stripeSessionId: manualBookingId, // Track as manual booking
  };

  // If paid=true, set payment status to succeeded and generate booking IDs
  if (bookingData.paid) {
    bookingData.stripePaymentStatus = 'succeeded';
    bookingData.stripeChargeId = `manual_charge_${manualBookingId.substring(0, 16)}`;
    bookingData.stripePaymentIntentId = `manual_pi_${manualBookingId.substring(0, 16)}`;
  } else {
    bookingData.stripePaymentStatus = 'pending';
  }

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

// Custom update to maintain paid/stripePaymentStatus consistency
exports.updateBooking = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // If paid field is being updated, sync stripePaymentStatus
  if (Object.prototype.hasOwnProperty.call(updateData, 'paid')) {
    if (updateData.paid === true) {
      updateData.stripePaymentStatus = 'succeeded';
    } else if (
      updateData.paid === false &&
      updateData.stripePaymentStatus === 'succeeded'
    ) {
      // If un-marking as paid, set to pending
      updateData.stripePaymentStatus = 'pending';
    }
  }

  // If stripePaymentStatus is being updated, sync paid field
  if (
    updateData.stripePaymentStatus === 'succeeded' &&
    !Object.prototype.hasOwnProperty.call(updateData, 'paid')
  ) {
    updateData.paid = true;
  } else if (
    updateData.stripePaymentStatus === 'pending' &&
    !Object.prototype.hasOwnProperty.call(updateData, 'paid')
  ) {
    updateData.paid = false;
  } else if (updateData.stripePaymentStatus === 'failed') {
    updateData.paid = false;
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
