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
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  // Payment Fields
  sessionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  chargeId: {
    type: String,
    sparse: true,
  },
  paymentIntentId: {
    type: String,
    sparse: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
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

// Index for unique session ID
bookingSchema.index({ sessionId: 1 });
bookingSchema.index({ paymentStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
