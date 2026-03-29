const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },
  price: {
    type: Number,
    require: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: false,
  },
  // Stripe Payment Fields
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  stripeChargeId: {
    type: String,
    sparse: true,
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true,
  },
  stripePaymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet', 'other'],
    default: 'card',
  },
  failureReason: {
    type: String,
    default: null,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate('tour');
  next();
});

// Index for unique Stripe session ID
bookingSchema.index({ stripeSessionId: 1 });
bookingSchema.index({ stripePaymentStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
