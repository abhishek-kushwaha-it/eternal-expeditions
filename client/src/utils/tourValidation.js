// Validation error messages
const ERRORS = {
  name_required: 'A tour must have a name',
  name_min: 'A tour name must have more or equal then 10 characters',
  name_max: 'A tour name must have less or equal then 40 characters',
  summary_required: 'A tour must have a description',
  duration_required: 'A tour must have a duration',
  duration_invalid: 'Duration must be a whole number',
  maxGroupSize_required: 'A tour must have a group size',
  maxGroupSize_invalid: 'Group size must be a whole number',
  difficulty_required: 'A tour must have a difficulty',
  difficulty_invalid: 'Difficulty is either: easy, medium, difficult',
  price_required: 'A tour must have a price',
  price_invalid: 'Price must be a valid number',
  discount_invalid: 'Discount must be a valid number',
  discount_exceeded: 'Discount price should be below regular price',
  imageCover_required: 'A tour must have a cover image',
  startLocation_invalid: 'Start location coordinates must be [longitude, latitude]',
  startLocation_coords_invalid: 'Coordinates must be valid numbers',
  startDates_invalid: 'All start dates must be valid dates',
  locations_invalid: 'All locations must have valid coordinates and address',
  guides_invalid: 'All guide IDs must be valid',
};

const DIFFICULTIES = ['easy', 'medium', 'difficult'];

// Helper validators
const validateString = (value, minLen, maxLen) => {
  const trimmed = value?.trim() || '';
  if (!trimmed) return null;
  if (trimmed.length < minLen) return 'min';
  if (trimmed.length > maxLen) return 'max';
  return 'valid';
};

const validateNumber = (value, allowZero = false) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return 'invalid';
  if (!allowZero && num === 0) return 'zero';
  return 'valid';
};

export const validateTourData = (data, isNewTour = false) => {
  const errors = {};

  // String validations
  const nameStatus = validateString(data.name, 10, 40);
  if (nameStatus === null) errors.name = ERRORS.name_required;
  else if (nameStatus === 'min') errors.name = ERRORS.name_min;
  else if (nameStatus === 'max') errors.name = ERRORS.name_max;

  if (!data.summary?.trim()) errors.summary = ERRORS.summary_required;
  if (!data.description?.trim()) errors.description = 'A tour must have a detailed description';

  // Number validations
  if (!data.duration && data.duration !== 0) {
    errors.duration = ERRORS.duration_required;
  } else if (validateNumber(data.duration) === 'invalid') {
    errors.duration = ERRORS.duration_invalid;
  }

  if (!data.maxGroupSize && data.maxGroupSize !== 0) {
    errors.maxGroupSize = ERRORS.maxGroupSize_required;
  } else if (validateNumber(data.maxGroupSize) === 'invalid') {
    errors.maxGroupSize = ERRORS.maxGroupSize_invalid;
  }

  if (!data.difficulty) {
    errors.difficulty = ERRORS.difficulty_required;
  } else if (!DIFFICULTIES.includes(data.difficulty)) {
    errors.difficulty = ERRORS.difficulty_invalid;
  }

  if (validateNumber(data.price) === null) {
    errors.price = ERRORS.price_required;
  } else if (validateNumber(data.price) === 'invalid') {
    errors.price = ERRORS.price_invalid;
  }

  // Discount validation
  if (data.priceDiscount && data.priceDiscount !== '') {
    const discountNum = parseFloat(data.priceDiscount);
    const priceNum = parseFloat(data.price);

    if (isNaN(discountNum)) {
      errors.priceDiscount = ERRORS.discount_invalid;
    } else if (data.discountType === 'amount' && discountNum >= priceNum) {
      // For fixed amount, discount should be less than price
      errors.priceDiscount = ERRORS.discount_exceeded;
    } else if (data.discountType === 'percentage' && discountNum > 100) {
      // For percentage, discount should not exceed 100%
      errors.priceDiscount = 'Percentage discount cannot exceed 100%';
    }
  }

  if (isNewTour && !data.imageCover) {
    errors.imageCover = ERRORS.imageCover_required;
  }

  // Location validations
  if (data.startLocation?.coordinates) {
    const coords = data.startLocation.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) {
      errors.startLocation = ERRORS.startLocation_invalid;
    } else {
      // Check if at least one coordinate has a value
      const hasValues = coords.some((c) => c !== '' && c !== null && c !== undefined);
      if (hasValues) {
        // If one or both have values, verify they're both valid numbers
        if (isNaN(parseFloat(coords[0])) || isNaN(parseFloat(coords[1]))) {
          errors.startLocation = ERRORS.startLocation_coords_invalid;
        }
      }
    }
  }

  if (data.startDates?.length > 0 && data.startDates.some((d) => !isValidDate(d))) {
    errors.startDates = ERRORS.startDates_invalid;
  }

  if (data.locations?.length > 0) {
    const hasInvalid = data.locations.some((loc) => {
      if (!Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) return true;
      if (isNaN(parseFloat(loc.coordinates[0])) || isNaN(parseFloat(loc.coordinates[1])))
        return true;
      if (!loc.address?.trim()) return true;
      return false;
    });
    if (hasInvalid) errors.locations = ERRORS.locations_invalid;
  }

  if (data.guides?.some((id) => !id || typeof id !== 'string')) {
    errors.guides = ERRORS.guides_invalid;
  } else if (data.guides?.length > 0) {
    // Validate that each guide ID is a valid MongoDB ObjectId format (24 hex characters)
    const invalidGuides = data.guides.filter((id) => !/^[a-f\d]{24}$/i.test(id));
    if (invalidGuides.length > 0) {
      errors.guides = 'One or more guide IDs are invalid';
    }
  }

  return errors;
};

// Date utilities
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Prepare tour data for API submission (POST/PATCH)
 */
export const prepareTourData = (formData, originalData = null, existingCoverImage = null) => {
  const data = new FormData();
  const changedFields = getChangedFields(formData, originalData);

  // String fields
  ['name', 'summary', 'description', 'difficulty'].forEach((field) => {
    if (changedFields.includes(field) && formData[field]) {
      data.append(field, formData[field]);
    }
  });

  // Numeric fields
  ['duration', 'maxGroupSize', 'price'].forEach((field) => {
    if (changedFields.includes(field) && formData[field]) {
      data.append(field, formData[field]);
    }
  });

  // Discount with type conversion (percentage to absolute)
  if (changedFields.includes('priceDiscount')) {
    const absoluteDiscount = calculateAbsoluteDiscount(formData, originalData);
    data.append('priceDiscount', absoluteDiscount.toString());
  }

  // Boolean
  if (changedFields.includes('secretTour') && formData.secretTour !== undefined) {
    data.append('secretTour', String(formData.secretTour).toLowerCase() === 'true');
  }

  // Location and images
  appendLocationData(data, formData, changedFields);
  appendImageData(data, formData, changedFields, existingCoverImage);
  appendArrayFields(data, formData, changedFields, ['startDates', 'guides']);
  appendLocations(data, formData, changedFields);

  return data;
};

// Helper: Detect which fields changed
const getChangedFields = (formData, originalData) => {
  if (!originalData) return Object.keys(formData);

  return Object.keys(formData).filter((key) => {
    if (key === 'images') {
      // Check if there are actual NEW File objects (not just existing image strings)
      return formData.images?.some((img) => img instanceof File) || false;
    }
    if (key === 'imageCover') {
      if (formData.imageCover instanceof File) return true;
      if (formData.imageCover === null && originalData[key]) return true;
      return false;
    }
    return JSON.stringify(formData[key]) !== JSON.stringify(originalData[key]);
  });
};

// Helper: Convert discount (percentage or fixed) to absolute amount
const calculateAbsoluteDiscount = (formData, originalData = null) => {
  const discountValue = parseFloat(formData.priceDiscount || '0');
  if (isNaN(discountValue) || discountValue < 0) return 0;

  if (formData.discountType === 'percentage') {
    const price = parseFloat(formData.price || originalData.price || 0);
    return ((price * discountValue) / 100).toFixed(2);
  }
  return discountValue;
};

// Helper: Append location data
const appendLocationData = (data, formData, changedFields) => {
  if (!changedFields.includes('startLocation') || !formData.startLocation) return;

  const { type, coordinates, address } = formData.startLocation;
  const hasValidCoords =
    type === 'Point' &&
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    !isNaN(parseFloat(coordinates[0])) &&
    !isNaN(parseFloat(coordinates[1]));

  if (hasValidCoords && address?.trim()) {
    data.append('startLocation', JSON.stringify(formData.startLocation));
  }
};

// Helper: Append image data
const appendImageData = (data, formData, changedFields, existingCoverImage) => {
  // Handle cover image (only if changed)
  if (changedFields.includes('imageCover')) {
    if (formData.imageCover === null && existingCoverImage) {
      data.append('deleteCoverImage', 'true');
    } else if (formData.imageCover instanceof File) {
      data.append('imageCover', formData.imageCover);
    }
  }

  // Handle normal images (independent of cover image changes)
  if (changedFields.includes('images') && formData.images?.length > 0) {
    formData.images.forEach((img) => {
      if (img instanceof File) data.append('images', img);
    });
  }
};

// Helper: Append array fields (dates, guides)
const appendArrayFields = (data, formData, changedFields, fields) => {
  fields.forEach((field) => {
    if (changedFields.includes(field) && Array.isArray(formData[field])) {
      formData[field].forEach((item) => {
        if (item) data.append(field, item);
      });
    }
  });
};

// Helper: Append location array as JSON
const appendLocations = (data, formData, changedFields) => {
  if (!changedFields.includes('locations') || !Array.isArray(formData.locations)) return;
  if (formData.locations.length > 0) {
    data.append('locations', JSON.stringify(formData.locations));
  }
};

export const parseStartDates = (dateString) => {
  if (!dateString?.trim()) return [];
  return dateString
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d && isValidDate(d))
    .map((d) => new Date(d).toISOString().split('T')[0]);
};

export const formatStartDates = (dates) => {
  if (!Array.isArray(dates)) return '';
  return dates.map((d) => new Date(d).toISOString().split('T')[0]).join(', ');
};

// Configuration
export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    icon: '🟢',
  },
  medium: {
    label: 'Medium',
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    icon: '🟠',
  },
  difficult: {
    label: 'Difficult',
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    icon: '🔴',
  },
};
