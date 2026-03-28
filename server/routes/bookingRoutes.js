const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
router.get('/my-bookings', bookingController.getMyBookings);
router.post(
  '/create-booking-checkout',
  bookingController.createBookingCheckout
); // Temporary unsecure route for Stripe webhook testing

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
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

module.exports = router;
