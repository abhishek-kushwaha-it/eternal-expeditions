const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Get current user's reviews - must come BEFORE /:id route
router.get('/my-reviews', reviewController.getMyReviews);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    reviewController.setTourUserIds,
    reviewController.validateBooking,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    reviewController.validateReviewOwnership,
    reviewController.updateReview
  )
  .delete(
    reviewController.validateReviewOwnership,
    reviewController.deleteReview
  );

module.exports = router;
