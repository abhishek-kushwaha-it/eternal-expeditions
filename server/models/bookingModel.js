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
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate('tour');
  next();
});

// Post-find middleware to filter out bookings from inactive users (after population)
bookingSchema.post(/^find/, (docs, next) => {
  if (Array.isArray(docs)) {
    // Filter out bookings from inactive users
    docs = docs.filter((doc) => !doc.user || doc.user.active !== false);
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
