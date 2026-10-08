const stripe = require('stripe');
const config = require('../utils/config');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { emitBookingStatusChange } = require('../utils/socket');
const { mapStripePaymentStatus } = require('../utils/bookingUtils');

const stripeClient = stripe(config.stripeSecretKey);

const updateBookingAndNotify = async (filter, update) => {
  const booking = await Booking.findOneAndUpdate(filter, update, {
    new: true,
  }).populate('user');

  if (booking?.user) {
    emitBookingStatusChange(booking.user._id.toString(), booking);
  }

  return booking;
};

const handleCheckoutCompleted = async (session) => {
  if (
    !session.client_reference_id ||
    (!session.metadata?.user_id && !session.customer_email)
  ) {
    console.error('[Webhook] Missing required session data');
    return;
  }

  const tour = await Tour.findById(session.client_reference_id);
  if (!tour) {
    console.error('[Webhook] Tour not found:', session.client_reference_id);
    return;
  }

  const user = session.metadata?.user_id
    ? await User.findById(session.metadata.user_id)
    : await User.findOne({ email: session.customer_email });
  if (!user) {
    console.error('[Webhook] User not found:', session.customer_email);
    return;
  }

  const existingBooking = await Booking.findOne({ sessionId: session.id });

  if (existingBooking) return { message: 'Booking already exists' };

  let booking;
  try {
    booking = await Booking.create({
      tour: session.client_reference_id,
      user: user._id,
      price: session.amount_total / 100,
      sessionId: session.id,
      paymentStatus: mapStripePaymentStatus(session.payment_status),
      paymentMethod: session.payment_method_types?.[0] || 'card',
    });
  } catch (error) {
    if (error.code === 11000) {
      return { message: 'Booking already exists' };
    }
    throw error;
  }

  emitBookingStatusChange(user._id.toString(), booking);
};

const handleChargeSucceeded = (charge) => {
  if (!charge.metadata?.booking_id) return;

  return updateBookingAndNotify(
    { _id: charge.metadata.booking_id },
    { chargeId: charge.id, paymentStatus: 'succeeded' }
  );
};

const handleChargeFailed = (charge) => {
  console.error('[Webhook] Charge failed:', charge.failure_message);
  if (!charge.metadata?.booking_id) return;

  return updateBookingAndNotify(
    { _id: charge.metadata.booking_id },
    {
      paymentStatus: 'failed',
      failureReason: charge.failure_message,
    }
  );
};

const handleAsyncPaymentFailed = (session) => {
  console.error('[Webhook] Async payment failed');
  return updateBookingAndNotify(
    { sessionId: session.id },
    {
      paymentStatus: 'failed',
      failureReason: 'Async payment processing failed',
    }
  );
};

const handleAsyncPaymentSucceeded = (session) =>
  updateBookingAndNotify(
    { sessionId: session.id },
    { paymentStatus: 'succeeded' }
  );

const eventHandlers = {
  'checkout.session.completed': handleCheckoutCompleted,
  'charge.succeeded': handleChargeSucceeded,
  'charge.failed': handleChargeFailed,
  'checkout.session.async_payment_failed': handleAsyncPaymentFailed,
  'checkout.session.async_payment_succeeded': handleAsyncPaymentSucceeded,
};

exports.verifyStripeWebhook = (req, res, next) => {
  if (!config.stripeWebhookSecret) {
    console.error('[Webhook] Stripe webhook secret not configured');
    return res.status(400).json({ message: 'Webhook secret not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    console.warn('[Webhook] Missing Stripe signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));
    req.stripeEvent = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripeWebhookSecret
    );
    return next();
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

exports.handleStripeWebhook = catchAsync(async (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    return res
      .status(200)
      .json({ status: 'success', message: 'Webhook ignored in development' });
  }

  const { stripeEvent } = req;
  const handler = eventHandlers[stripeEvent.type];
  if (!handler) {
    return res.status(200).json({
      status: 'success',
      message: 'Event type not processed',
      event: stripeEvent.type,
    });
  }

  try {
    const result = await handler(stripeEvent.data.object);
    if (result?.message) {
      return res.status(200).json({ status: 'success', ...result });
    }
  } catch (error) {
    console.error(
      `[Webhook] Error processing ${stripeEvent.type}:`,
      error.message
    );
    throw error;
  }

  return res.status(200).json({
    status: 'success',
    message: 'Webhook received and processed',
    event: stripeEvent.type,
  });
});
