const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews

// Nested reviews route - use this after admin route
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/tour-stats')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'guide'),
    tourController.getTourStats
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.dataSanitization,
    tourController.createTour
  );

// Protected route to get a specific tour (for admins/guides to view secret tours when editing)
router
  .route('/protected/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'guide'),
    tourController.getProtectedTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.dataSanitization,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'guide'),
    tourController.deleteTour
  );

// Specific admin route BEFORE the /:tourId/reviews middleware
router
  .route('/admin/all-tours')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'guide'),
    tourController.getAllToursAdmin
  );

module.exports = router;
