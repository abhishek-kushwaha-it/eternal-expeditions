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
    console.error('[Webhook] Stripe webhook secret not configured');
    return res.status(400).json({ message: 'Webhook secret not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.warn('[Webhook] Missing Stripe signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;
  try {
    let rawBody = req.body;

    if (Buffer.isBuffer(rawBody)) {
      rawBody = rawBody.toString('utf8');
    } else if (typeof rawBody === 'object') {
      console.error(
        '[Webhook] ERROR: Body is already parsed object. express.raw() middleware may not have run!'
      );
      rawBody = JSON.stringify(rawBody);
    }

    event = stripeClient.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripeWebhookSecret
    );
    console.log('[Webhook] ✓ Signature verified for event type:', event.type);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  req.stripeEvent = event;
  next();
};

// WEBHOOK HANDLER - PRODUCTION ONLY
exports.handleStripeWebhook = catchAsync(async (req, res) => {
  // Webhooks only for development are skipped - in development, booking is created when checkout session is created
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.log('[Webhook] Ignoring webhook in development mode');
    return res
      .status(200)
      .json({ status: 'success', message: 'Webhook ignored in development' });
  }

  const event = req.stripeEvent;

  // Handle checkout completion - create booking
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      if (!session.client_reference_id || !session.customer_email) {
        console.error('[Webhook] ✗ Missing required session data');
        return res.status(200).json({ status: 'success' });
      }

      const tour = await Tour.findById(session.client_reference_id);
      if (!tour) {
        console.error('[Webhook] Tour not found:', session.client_reference_id);
        return res.status(200).json({ status: 'success' });
      }

      const user = await User.findOne({ email: session.customer_email });
      if (!user) {
        console.error('[Webhook] User not found:', session.customer_email);
        return res.status(200).json({ status: 'success' });
      }

      // Check for duplicates (idempotent)
      const existing = await Booking.findOne({
        tour: session.client_reference_id,
        user: user._id,
        sessionId: session.id,
      });

      if (existing) {
        return res
          .status(200)
          .json({ status: 'success', message: 'Booking already exists' });
      }

      // Map Stripe payment_status to our enum
      // Stripe can send: 'paid', 'unpaid', 'no_payment_required'
      // We store: 'pending', 'succeeded', 'failed', 'cancelled'
      const mapPaymentStatus = (stripeStatus) => {
        const statusMap = {
          paid: 'succeeded',
          unpaid: 'pending',
          no_payment_required: 'succeeded',
        };
        return statusMap[stripeStatus] || 'pending';
      };

      const booking = await Booking.create({
        tour: session.client_reference_id,
        user: user._id,
        price: session.amount_total / 100,
        sessionId: session.id,
        paymentStatus: mapPaymentStatus(session.payment_status),
        paymentMethod:
          (session.payment_method_types && session.payment_method_types[0]) ||
          'card',
      });
      console.log('[Webhook] ✓ Booking created:', booking._id);

      // Emit real-time update to user
      emitBookingStatusChange(user._id.toString(), booking);
    } catch (error) {
      console.error(
        '[Webhook] Error processing checkout session:',
        error.message
      );
      console.error('[Webhook] Stack:', error.stack);
    }
  }

  // Handle charge succeeded
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object;
    try {
      if (charge.metadata && charge.metadata.booking_id) {
        const booking = await Booking.findByIdAndUpdate(
          charge.metadata.booking_id,
          {
            chargeId: charge.id,
            paymentStatus: 'succeeded',
          },
          { new: true }
        ).populate('user');

        if (booking && booking.user) {
          emitBookingStatusChange(booking.user._id.toString(), booking);
        }
      }
    } catch (error) {
      console.error(
        '[Webhook] Error handling charge succeeded:',
        error.message
      );
    }
  }

  // Handle charge failed
  if (event.type === 'charge.failed') {
    const charge = event.data.object;
    console.error('[Webhook] ✗ Charge failed:', charge.failure_message);
    try {
      if (charge.metadata && charge.metadata.booking_id) {
        const booking = await Booking.findByIdAndUpdate(
          charge.metadata.booking_id,
          {
            paymentStatus: 'failed',
            failureReason: charge.failure_message,
          },
          { new: true }
        ).populate('user');

        if (booking && booking.user) {
          emitBookingStatusChange(booking.user._id.toString(), booking);
        }
      }
    } catch (error) {
      console.error('[Webhook] Error handling charge failed:', error.message);
    }
  }

  // Handle async payment failed (for sessions that fail after async processing)
  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    console.error('[Webhook] ✗ Async payment failed');

    try {
      const booking = await Booking.findOneAndUpdate(
        { sessionId: session.id },
        {
          paymentStatus: 'failed',
          failureReason: 'Async payment processing failed',
        },
        { new: true }
      ).populate('user');

      if (booking && booking.user) {
        emitBookingStatusChange(booking.user._id.toString(), booking);
      }
    } catch (error) {
      console.error(
        '[Webhook] Error handling async payment failed:',
        error.message
      );
    }
  }

  // Handle async payment succeeded (for sessions that complete after async processing)
  if (event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;

    try {
      const booking = await Booking.findOneAndUpdate(
        { sessionId: session.id },
        {
          paymentStatus: 'succeeded',
        },
        { new: true }
      ).populate('user');

      if (booking && booking.user) {
        emitBookingStatusChange(booking.user._id.toString(), booking);
      }
    } catch (error) {
      console.error(
        '[Webhook] Error handling async payment succeeded:',
        error.message
      );
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
  if (process.env.NODE_ENV === 'development') {
    try {
      const existingBooking = await Booking.findOne({
        sessionId: session.id,
      });

      if (!existingBooking) {
        await Booking.create({
          tour: req.params.tourId,
          user: req.user._id,
          price: tour.price,
          sessionId: session.id,
          chargeId: `dev_charge_${session.id.substring(0, 16)}`,
          paymentIntentId: `dev_pi_${session.id.substring(0, 16)}`,
          paymentStatus: 'succeeded',
          paymentMethod: 'card',
        });
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

  // Generate IDs for manual bookings
  const manualBookingId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const bookingData = {
    tour,
    user,
    price,
    paymentMethod: paymentMethod || 'other',
    sessionId: manualBookingId, // Track as manual booking
    paymentStatus: paymentStatus || 'pending', // Allow manual status setting
    chargeId: `manual_charge_${manualBookingId.substring(0, 16)}`,
    paymentIntentId: `manual_pi_${manualBookingId.substring(0, 16)}`,
  };

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
  const updateData = req.body;

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
