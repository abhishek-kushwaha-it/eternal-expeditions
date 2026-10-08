const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.dataSanitization = catchAsync(async (req, res, next) => {
  ['name', 'summary', 'description'].forEach((field) => {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] !== 'string') {
        throw new AppError(`${field} must be a string.`, 400);
      }
      req.body[field] = req.body[field].trim();
    }
  });

  const integerFields = ['duration', 'maxGroupSize', 'ratingsQuantity'];
  const decimalFields = ['price', 'priceDiscount', 'ratingsAverage'];

  [...integerFields, ...decimalFields].forEach((field) => {
    if (req.body[field] === undefined) return;

    const value = req.body[field];
    let number = Number.NaN;
    if (typeof value === 'number') {
      number = value;
    } else if (typeof value === 'string' && value.trim()) {
      number = Number(value);
    }

    if (
      !Number.isFinite(number) ||
      (integerFields.includes(field) && !Number.isInteger(number))
    ) {
      throw new AppError(`${field} must be a valid number.`, 400);
    }

    req.body[field] = number;
  });

  if (req.body.startLocation && typeof req.body.startLocation === 'string') {
    try {
      req.body.startLocation = JSON.parse(req.body.startLocation);
    } catch {
      return next(new AppError('Start location must be valid JSON.', 400));
    }
  }

  if (req.method === 'POST' && !req.body.startLocation) {
    return next(new AppError('A complete start location is required.', 400));
  }

  if (req.body.startLocation) {
    if (
      typeof req.body.startLocation !== 'object' ||
      Array.isArray(req.body.startLocation)
    ) {
      throw new AppError('Start location must be an object.', 400);
    }

    const { coordinates } = req.body.startLocation;
    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      coordinates.some(
        (coordinate) =>
          coordinate === null ||
          coordinate === undefined ||
          (typeof coordinate === 'string' && !coordinate.trim())
      )
    ) {
      return next(
        new AppError(
          'Start location coordinates must be [longitude, latitude].',
          400
        )
      );
    }

    const [longitude, latitude] = coordinates.map(Number);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return next(
        new AppError('Start location coordinates must be valid numbers.', 400)
      );
    }
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return next(
        new AppError('Start location coordinates are out of range.', 400)
      );
    }

    const { address, description } = req.body.startLocation;
    if (
      typeof address !== 'string' ||
      typeof description !== 'string' ||
      !address.trim() ||
      !description.trim()
    ) {
      return next(
        new AppError(
          'Start location address and description are required.',
          400
        )
      );
    }

    req.body.startLocation.coordinates = [longitude, latitude];
    req.body.startLocation.address = address.trim();
    req.body.startLocation.description = description.trim();
  }

  if (req.body.locations && typeof req.body.locations === 'string') {
    try {
      req.body.locations = JSON.parse(req.body.locations);
    } catch {
      throw new AppError('Locations must be valid JSON.', 400);
    }
  }

  if (req.body.locations !== undefined && !Array.isArray(req.body.locations)) {
    throw new AppError('Locations must be an array.', 400);
  }

  if (Array.isArray(req.body.locations)) {
    req.body.locations = req.body.locations.map((location) => {
      if (
        !location ||
        typeof location !== 'object' ||
        Array.isArray(location)
      ) {
        throw new AppError('Each location must be an object.', 400);
      }

      if (
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        throw new AppError(
          'Each location must have [longitude, latitude] coordinates.',
          400
        );
      }

      const coordinates = location.coordinates.map((coordinate) => {
        if (typeof coordinate === 'number') return coordinate;
        if (typeof coordinate === 'string' && coordinate.trim()) {
          return Number(coordinate);
        }
        return Number.NaN;
      });
      const [longitude, latitude] = coordinates;
      if (
        coordinates.some((coordinate) => !Number.isFinite(coordinate)) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        throw new AppError(
          'Location coordinates are invalid or out of range.',
          400
        );
      }

      if (
        typeof location.address !== 'string' ||
        typeof location.description !== 'string' ||
        !location.address.trim() ||
        !location.description.trim()
      ) {
        throw new AppError(
          'Each location must have an address and description.',
          400
        );
      }

      if (location.day !== undefined) {
        const day = Number(location.day);
        if (!Number.isInteger(day) || day < 1) {
          throw new AppError(
            'Location day must be a positive whole number.',
            400
          );
        }
        location.day = day;
      }

      location.coordinates = coordinates;
      location.address = location.address.trim();
      location.description = location.description.trim();
      return location;
    });
  }

  if (req.body.startDates) {
    let dates = req.body.startDates;
    if (typeof dates === 'string') {
      try {
        const parsedDates = JSON.parse(dates);
        dates = Array.isArray(parsedDates) ? parsedDates : [dates];
      } catch {
        dates = [dates];
      }
    }

    if (!Array.isArray(dates)) {
      throw new AppError('Start dates must be an array.', 400);
    }

    req.body.startDates = dates
      .filter((date) => date && (typeof date !== 'string' || date.trim()))
      .map((date) => new Date(date));
    if (req.body.startDates.some((date) => Number.isNaN(date.getTime()))) {
      throw new AppError('All start dates must be valid dates.', 400);
    }
  }

  if (req.body.guides) {
    let { guides } = req.body;
    if (typeof guides === 'string') {
      try {
        guides = JSON.parse(guides);
      } catch {
        guides = [guides];
      }
    }

    if (!Array.isArray(guides)) guides = [guides];
    if (guides.some((guideId) => !mongoose.Types.ObjectId.isValid(guideId))) {
      throw new AppError('Guide IDs must be valid.', 400);
    }
    req.body.guides = guides;
  }

  delete req.body.imagesToKeep;
  delete req.body.existingImages;

  next();
});
