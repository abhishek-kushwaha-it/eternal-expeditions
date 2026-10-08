const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const parseCoordinates = (latlng, invalidMessage) => {
  const coordinateValues = latlng.split(',');
  if (
    coordinateValues.length !== 2 ||
    coordinateValues.some((coordinate) => !coordinate.trim())
  ) {
    throw new AppError(invalidMessage, 400);
  }

  const [latitudeValue, longitudeValue] = coordinateValues;
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new AppError(invalidMessage, 400);
  }
  if (latitude < -90 || latitude > 90) {
    throw new AppError('Latitude must be between -90 and 90', 400);
  }
  if (longitude < -180 || longitude > 180) {
    throw new AppError('Longitude must be between -180 and 180', 400);
  }

  return { latitude, longitude };
};

const validateUnit = (unit) => {
  if (unit !== 'mi' && unit !== 'km') {
    throw new AppError('Unit must be either mi or km.', 400);
  }
};

exports.getTopCheapTours = catchAsync(async (req, res) => {
  const tours = await Tour.aggregate([
    {
      $addFields: {
        discountedPrice: {
          $subtract: ['$price', { $ifNull: ['$priceDiscount', 0] }],
        },
        id: { $toString: '$_id' },
      },
    },
    { $sort: { discountedPrice: 1, ratingsAverage: -1 } },
    { $limit: 5 },
    { $project: { discountedPrice: 0 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = Number(req.params.year);
  if (!Number.isInteger(year) || year < 1000 || year > 9998) {
    throw new AppError('Please provide a valid year.', 400);
  }

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } },
    { $limit: 12 },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

exports.getToursWithin = catchAsync(async (req, res) => {
  const { distance, latlng, unit } = req.params;
  const dist = Number(distance);
  if (Number.isNaN(dist)) {
    throw new AppError(
      'Please provide valid distance, latitude and longitude in the format: /distance/center/lat,lng/unit',
      400
    );
  }
  if (dist <= 0) {
    throw new AppError('Distance must be greater than 0', 400);
  }
  validateUnit(unit);

  const { latitude, longitude } = parseCoordinates(
    latlng,
    'Please provide valid distance, latitude and longitude in the format: /distance/center/lat,lng/unit'
  );
  const radius = unit === 'mi' ? dist / 3963.2 : dist / 6378.1;
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res) => {
  const { latlng, unit } = req.params;
  validateUnit(unit);
  const { latitude, longitude } = parseCoordinates(
    latlng,
    'Please provide latitude and longitude in the format lat,lng (e.g., 40.7128,-74.0060).'
  );
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        distance: 1,
        price: 1,
        difficulty: 1,
        duration: 1,
        maxGroupSize: 1,
        ratingsAverage: 1,
        ratingsQuantity: 1,
        imageCover: 1,
        startDates: 1,
        locations: 1,
        summary: 1,
        startLocation: 1,
        priceDiscount: 1,
        id: 1,
      },
    },
    { $sort: { distance: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: { data: distances },
  });
});
