const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// Stripe webhook route (NO authentication, must be before bodyParser middleware in app.js)
// This route receives raw body for signature verification
router.post(
  '/webhook/stripe',
  bookingController.verifyStripeWebhook,
  bookingController.handleStripeWebhook
);

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
