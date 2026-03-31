const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// NOTE: Stripe webhook route is defined in app.js BEFORE JSON parser
// to ensure raw body is preserved for signature verification.
// DO NOT add webhook route here as it would run after JSON middleware!

// All routes below require authentication
router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
router.get('/my-bookings', bookingController.getMyBookings);

// Routes for specific booking - accessible to user (own booking) or admin/guide
router
  .route('/:id')
  .get(bookingController.checkBookingAccess, bookingController.getBooking)
  .patch(
    authController.restrictTo('admin', 'guide'),
    bookingController.updateBooking
  )
  .delete(
    authController.restrictTo('admin', 'guide'),
    bookingController.deleteBooking
  );

// Admin/Guide only routes
router.use(authController.restrictTo('admin', 'guide'));
router
  .route('/')
  .post(bookingController.createBooking)
  .get(bookingController.getAllBookings);

module.exports = router;
