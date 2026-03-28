import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGuides, useUpdateTourMutation, useCreateTourMutation } from '../hooks/useQueries';
import { Button, LoadingState, FormGroup, Image } from '../core-components';
import {
  validateTourData,
  parseStartDates,
  formatStartDates,
  DIFFICULTY_CONFIG,
} from '../utils/tourValidation';
import { BACKEND_URL } from '../utils/api';
import { useToasts } from '../store/hooks';
import './TourFormPage.css';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ValidationAlert({ errors }) {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div className="form__validation-alert">
      <strong>⚠️ Please fix the following errors:</strong>
      <ul className="form__error-list">
        {Object.entries(errors).map(([field, error]) => error && <li key={field}>{error}</li>)}
      </ul>
    </div>
  );
}

function DifficultySelector({
  value,
  onChange,
  error,
  touched,
  required = false,
  label = 'Difficulty Level',
}) {
  return (
    <div className="form-group">
      <label className="form-group__label">
        {label}
        {required && <span className="form-group__required">*</span>}
      </label>
      <div className="difficulty-selector">
        {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
          <label key={key} className="difficulty-option">
            <input
              type="radio"
              id={`difficulty-${key}`}
              name="difficulty"
              value={key}
              checked={value === key}
              onChange={onChange}
              className="difficulty-option__input"
            />
            <span className="difficulty-option__label" style={{ borderColor: config.color }}>
              {config.label}
            </span>
          </label>
        ))}
      </div>
      {touched && error && <span className="form-group__error">{error}</span>}
    </div>
  );
}

function BasicInfoSection({ formData, touched, errors, onBasicChange, onBlur }) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">📋 Basic Information</h3>
        <p className="form-section__description">Enter core tour details</p>
      </div>

      <div className="form-grid form-grid--3col">
        <FormGroup
          name="name"
          label="Tour Name"
          type="text"
          value={formData.name}
          onChange={onBasicChange}
          onBlur={onBlur}
          required
          error={touched.name && errors.name ? errors.name : ''}
          placeholder="e.g., The Forest Hiker"
        />

        <FormGroup
          name="duration"
          label="Duration (days)"
          type="number"
          value={formData.duration}
          onChange={onBasicChange}
          onBlur={onBlur}
          required
          error={touched.duration && errors.duration ? errors.duration : ''}
          placeholder="e.g., 5"
          min="1"
        />

        <FormGroup
          name="maxGroupSize"
          label="Max Group Size"
          type="number"
          value={formData.maxGroupSize}
          onChange={onBasicChange}
          onBlur={onBlur}
          required
          error={touched.maxGroupSize && errors.maxGroupSize ? errors.maxGroupSize : ''}
          placeholder="e.g., 25"
          min="1"
        />
      </div>

      <DifficultySelector
        value={formData.difficulty}
        onChange={onBasicChange}
        touched={touched.difficulty}
        error={errors.difficulty}
        required
      />
    </section>
  );
}

function PricingSection({ formData, touched, errors, calculatedDiscount, onBasicChange, onBlur }) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">💰 Pricing</h3>
        <p className="form-section__description">Set tour pricing and discounts</p>
      </div>

      <div className="form-grid form-grid--3col">
        <FormGroup
          name="price"
          label="Price per person ($)"
          type="number"
          value={formData.price}
          onChange={onBasicChange}
          onBlur={onBlur}
          required
          error={touched.price && errors.price ? errors.price : ''}
          placeholder="e.g., 2997"
          step="0.01"
          min="0"
        />

        <FormGroup
          name="discountType"
          label="Discount Type"
          type="select"
          value={formData.discountType}
          onChange={onBasicChange}
          onBlur={onBlur}
          options={[
            { value: 'amount', label: 'Fixed Amount ($)' },
            { value: 'percentage', label: 'Percentage (%)' },
          ]}
        />

        <FormGroup
          name="priceDiscount"
          label={`Discount (${formData.discountType === 'percentage' ? '%' : '$'})`}
          type="number"
          value={formData.priceDiscount}
          onChange={onBasicChange}
          onBlur={onBlur}
          error={touched.priceDiscount && errors.priceDiscount ? errors.priceDiscount : ''}
          placeholder={formData.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 300'}
          step="0.01"
          min="0"
        />
      </div>

      <div className="pricing-display">
        <div className="pricing-display__item">
          <span className="pricing-display__label">Original Price:</span>
          <span className="pricing-display__value">
            ${parseFloat(formData.price || 0).toFixed(2)}
          </span>
        </div>
        <div className="pricing-display__item">
          <span className="pricing-display__label">Discounted Price:</span>
          <span className="pricing-display__value">${calculatedDiscount.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}

function DescriptionSection({ formData, touched, errors, onBasicChange, onBlur }) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">📝 Description</h3>
        <p className="form-section__description">Provide tour details and highlights</p>
      </div>

      <FormGroup
        name="summary"
        label="Summary (max 200 chars)"
        type="text"
        value={formData.summary}
        onChange={onBasicChange}
        onBlur={onBlur}
        required
        error={touched.summary && errors.summary ? errors.summary : ''}
        maxLength="200"
        placeholder="Brief overview of the tour"
      />

      <FormGroup
        name="description"
        label="Full Description"
        type="textarea"
        value={formData.description}
        onChange={onBasicChange}
        onBlur={onBlur}
        required
        error={touched.description && errors.description ? errors.description : ''}
        placeholder="Detailed description of the tour experience"
        rows="6"
      />
    </section>
  );
}

function ImagesSection({
  imagePreviews,
  additionalImages,
  touched,
  errors,
  onImageChange,
  onRemoveCover,
  onRemoveImage,
}) {
  // Count cover image (1) + additional images (up to 3) = max 4 total
  const MAX_IMAGES = 4;
  const coverCount = imagePreviews.cover ? 1 : 0;
  const totalImages = coverCount + additionalImages.length;
  const remainingSlots = Math.max(0, MAX_IMAGES - totalImages);
  const canAddMore = totalImages < MAX_IMAGES;

  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">🖼️ Images</h3>
        <p className="form-section__description">
          Upload cover and tour images (max 4 total images)
        </p>
      </div>

      <div className="images-grid">
        {/* Cover Image */}
        <div className="image-section">
          <label className="form-group__label form-group__label--required">Cover Image</label>
          <div className="image-upload">
            {imagePreviews.cover ? (
              <div className="image-preview image-preview--removable">
                <Image src={imagePreviews.cover} alt="Cover preview" />
                <Button
                  type="button"
                  className="image-preview__remove"
                  onClick={onRemoveCover}
                  variant="danger"
                  size="sm"
                  title="Remove cover image"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <div style={{ minHeight: '200px' }}></div>
            )}
            <input
              type="file"
              name="imageCover"
              onChange={onImageChange}
              accept="image/*"
              className="image-upload__input"
              id="imageCover"
            />
            <label htmlFor="imageCover" className="image-upload__label">
              {imagePreviews.cover ? '✓ Change Cover' : '📁 Upload Cover Image'}
            </label>
          </div>
          {touched.imageCover && errors.imageCover && (
            <span className="form-group__error">{errors.imageCover}</span>
          )}
        </div>

        {/* Additional Images */}
        <div className="image-section">
          <label className="form-group__label">Additional Images</label>
          {/* Only show hint when upload is possible */}
          {canAddMore && (
            <p className="form-group__hint">
              You can upload up to {remainingSlots} more image
              {remainingSlots !== 1 ? 's' : ''} ({additionalImages.length}/3 additional)
            </p>
          )}
          <div className="image-upload">
            {canAddMore ? (
              <>
                <input
                  type="file"
                  name="images"
                  onChange={onImageChange}
                  accept="image/*"
                  multiple
                  className="image-upload__input"
                  id="images"
                />
                <label htmlFor="images" className="image-upload__label">
                  {additionalImages.length > 0
                    ? `+ Add More Images (${additionalImages.length}/3 additional)`
                    : '📁 Upload Tour Images'}
                </label>
              </>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                ✓ Maximum {MAX_IMAGES} images reached (1 cover + {additionalImages.length}{' '}
                additional)
              </div>
            )}
          </div>

          {/* Show previews below upload button */}
          {additionalImages.length > 0 && (
            <div className="image-preview-grid">
              {additionalImages.map((image) => (
                <div key={image.id} className="image-preview image-preview--removable">
                  <Image src={image.preview} alt={`Tour image`} />
                  <Button
                    type="button"
                    className="image-preview__remove"
                    onClick={() => onRemoveImage(image.id)}
                    variant="danger"
                    size="sm"
                    title="Remove image"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StartLocationSection({ formData, onLocationChange, onCoordinateChange }) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">📍 Start Location</h3>
        <p className="form-section__description">Set the tour starting point</p>
      </div>

      <div className="form-grid form-grid--2col">
        <FormGroup
          name="startLocation-address"
          label="Address"
          type="text"
          value={formData.startLocation.address}
          onChange={(e) => onLocationChange('address', e.target.value)}
          placeholder="e.g., Denver, Colorado"
        />

        <FormGroup
          name="startLocation-description"
          label="Description"
          type="text"
          value={formData.startLocation.description}
          onChange={(e) => onLocationChange('description', e.target.value)}
          placeholder="e.g., Downtown Denver Meeting Point"
        />
      </div>

      <div className="form-grid form-grid--2col">
        <FormGroup
          name="startLocation-latitude"
          label="Latitude"
          type="number"
          value={formData.startLocation.coordinates[1]}
          onChange={(e) => onCoordinateChange(1, e.target.value)}
          placeholder="e.g., 39.7392"
          step="0.0001"
        />

        <FormGroup
          name="startLocation-longitude"
          label="Longitude"
          type="number"
          value={formData.startLocation.coordinates[0]}
          onChange={(e) => onCoordinateChange(0, e.target.value)}
          placeholder="e.g., -104.9903"
          step="0.0001"
        />
      </div>
    </section>
  );
}

function StartDatesSection({ startDatesInput, onStartDatesChange, formData }) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">📅 Start Dates</h3>
        <p className="form-section__description">Add tour available dates</p>
      </div>

      <div className="form-group">
        <label className="form-group__label">Enter dates separated by commas (YYYY-MM-DD)</label>
        <textarea
          value={startDatesInput}
          onChange={onStartDatesChange}
          className="form-group__textarea"
          placeholder="e.g., 2024-06-01, 2024-06-08, 2024-06-15"
          rows="3"
        />
        <p className="form-group__hint">Example: 2024-06-01, 2024-06-08, 2024-06-15</p>
      </div>

      {formData.startDates.length > 0 && (
        <div className="date-badges">
          {formData.startDates.map((date, idx) => (
            <span key={idx} className="date-badge">
              📅{' '}
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function GuidesSection({ guides, selectedGuides, onGuideToggle }) {
  if (!guides || guides.length === 0) {
    return null;
  }

  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">👨‍🏫 Assign Guides</h3>
        <p className="form-section__description">Select tour guides</p>
      </div>

      <div className="guides-selector">
        {guides.map((guide) => (
          <label key={guide._id} className="guide-option">
            <input
              type="checkbox"
              checked={selectedGuides.includes(guide._id)}
              onChange={() => onGuideToggle(guide._id)}
              className="guide-option__input"
            />
            <span className="guide-option__label">
              {guide.name}
              <span className="guide-option__role">{guide.role}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function OptionsSection({ formData, onBasicChange }) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">⚙️ Options</h3>
        <p className="form-section__description">Additional tour settings</p>
      </div>

      <label className="form-group__checkbox-label">
        <input
          type="checkbox"
          name="secretTour"
          checked={formData.secretTour}
          onChange={onBasicChange}
          className="form-group__checkbox"
        />
        <span className="checkbox-text">🔒 Secret Tour (hidden from public listings)</span>
      </label>
    </section>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const calculateDiscountedPrice = (price, discount, discountType) => {
  if (!price || !discount) return parseFloat(price) || 0;
  const priceNum = parseFloat(price);
  const discountNum = parseFloat(discount);
  if (isNaN(priceNum) || isNaN(discountNum)) return priceNum || 0;
  let result;
  if (discountType === 'percentage') {
    result = priceNum - (priceNum * discountNum) / 100;
  } else {
    result = priceNum - discountNum;
  }
  return Math.round(result * 100) / 100;
};

const INITIAL_STATE = {
  name: '',
  duration: '',
  maxGroupSize: '',
  difficulty: 'easy',
  price: '',
  priceDiscount: '',
  discountType: 'fixed', // Local UI only - for showing % vs $ label, never sent to backend
  summary: '',
  description: '',
  imageCover: null,
  images: [],
  startDates: [],
  startLocation: {
    type: 'Point',
    coordinates: ['', ''],
    address: '',
    description: '',
  },
  guides: [],
  secretTour: false,
};

export default function TourFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: guides = [] } = useGuides();
  const createTourMutation = useCreateTourMutation();
  const updateTourMutation = useUpdateTourMutation();
  const { addToast } = useToasts();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [imagePreviews, setImagePreviews] = useState({
    cover: null,
    images: [],
  });
  // Store all additional images with metadata: {id, filename, preview, isNew}
  const [additionalImages, setAdditionalImages] = useState([]);
  const [startDatesInput, setStartDatesInput] = useState('');
  const [tour, setTour] = useState(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);

  // Load tour data if editing
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadTourData = async () => {
      try {
        // Use protected endpoint to allow viewing secret tours for authenticated users
        const response = await fetch(`${BACKEND_URL}/api/v1/tours/protected/${id}`, {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();

        if (!isMounted) return; // Prevent state update if unmounted

        if (data.status === 'success') {
          const tourData = data.data.data;
          setTour(tourData);

          // Ensure all fields have values, with defaults if missing
          setFormData({
            name: tourData.name || '',
            duration: tourData.duration ?? '',
            maxGroupSize: tourData.maxGroupSize ?? '',
            difficulty: tourData.difficulty || 'easy',
            price: tourData.price ?? '',
            priceDiscount: tourData.priceDiscount ?? '',
            discountType: 'fixed', // Local UI only
            summary: tourData.summary || '',
            description: tourData.description || '',
            imageCover: null,
            images: [],
            startDates: tourData.startDates || [],
            startLocation: {
              type: 'Point',
              coordinates: tourData.startLocation?.coordinates || ['', ''],
              address: tourData.startLocation?.address || '',
              description: tourData.startLocation?.description || '',
            },
            guides: tourData.guides?.map((g) => g._id || g) || [],
            secretTour: tourData.secretTour || false,
          });
          setStartDatesInput(formatStartDates(tourData.startDates));
          if (tourData.imageCover) {
            setImagePreviews((prev) => ({
              ...prev,
              cover: `${BACKEND_URL}/img/tours/${tourData.imageCover}`,
            }));
          }
          if (tourData.images?.length > 0) {
            // Load existing images with metadata
            setAdditionalImages(
              tourData.images.map((img, idx) => ({
                id: `existing-${idx}`,
                filename: img,
                preview: `${BACKEND_URL}/img/tours/${img}`,
                isNew: false,
              }))
            );
          }
        }
      } catch {
        if (isMounted) {
          // console.error('Error loading tour:', error); // Helpful for development
          addToast('Failed to load tour data', 'error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTourData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [id, addToast]);

  const handleBasicChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleStartDatesChange = (e) => {
    const input = e.target.value;
    setStartDatesInput(input);
    try {
      const parsedDates = parseStartDates(input);
      setFormData((prev) => ({ ...prev, startDates: parsedDates }));
    } catch {
      setFormData((prev) => ({ ...prev, startDates: [] }));
    }
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      startLocation: { ...prev.startLocation, [field]: value },
    }));
  };

  const handleCoordinateChange = (coordinateIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      startLocation: {
        ...prev.startLocation,
        coordinates: prev.startLocation.coordinates.map((coord, idx) =>
          idx === coordinateIndex ? (value === '' ? '' : parseFloat(value)) : coord
        ),
      },
    }));
  };

  const handleImageChange = useCallback(
    (e) => {
      const { name, files } = e.target;
      if (!files || files.length === 0) return;

      const MAX_IMAGES = 4;

      if (name === 'imageCover') {
        // Handle cover image change
        const file = files[0];
        if (!file.type.startsWith('image/')) {
          addToast('Please select a valid image file', 'error');
          e.target.value = '';
          return;
        }

        setFormData((prev) => ({ ...prev, imageCover: file }));
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews((prev) => ({ ...prev, cover: event.target.result }));
        };
        reader.onerror = () => {
          addToast('Failed to read cover image file', 'error');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      } else if (name === 'images') {
        // Handle additional images
        const newFiles = Array.from(files);

        // Validate all files are images
        const invalidFiles = newFiles.filter((f) => !f.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
          addToast(`${invalidFiles.length} file(s) are not images and were skipped`, 'error');
        }

        const validFiles = newFiles.filter((f) => f.type.startsWith('image/'));
        if (validFiles.length === 0) {
          e.target.value = '';
          return;
        }

        // Count: cover + all additional images (existing + new) + incoming files
        const coverCount = formData.imageCover || imagePreviews.cover ? 1 : 0;
        const currentTotal = coverCount + additionalImages.length + validFiles.length;

        if (currentTotal > MAX_IMAGES) {
          const maxAllowed = MAX_IMAGES - coverCount - additionalImages.length;
          addToast(
            `You can only add ${maxAllowed} more image${maxAllowed !== 1 ? 's' : ''} (max ${MAX_IMAGES} total)`,
            'error'
          );
          e.target.value = '';
          return;
        }

        // Process each valid file
        let processedCount = 0;
        validFiles.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            // Use a stable ID based on filename and timestamp to avoid duplicates
            const uniqueId = `new-${Date.now()}-${index}`;

            setAdditionalImages((prev) => [
              ...prev,
              {
                id: uniqueId,
                filename: file.name,
                preview: event.target.result,
                isNew: true,
                file: file,
              },
            ]);

            processedCount++;

            // Only add to formData after all files are processed to avoid state inconsistency
            if (processedCount === validFiles.length) {
              setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...validFiles],
              }));
            }
          };
          reader.onerror = () => {
            addToast(`Failed to read file: ${file.name}`, 'error');
          };
          reader.readAsDataURL(file);
        });

        // Clear the input so the same file(s) can be selected again
        e.target.value = '';
      }
    },
    [formData.imageCover, imagePreviews.cover, additionalImages.length, addToast]
  );

  const removeCoverImage = () => {
    setFormData((prev) => ({ ...prev, imageCover: null }));
    setImagePreviews((prev) => ({ ...prev, cover: null }));
    addToast('Cover image removed', 'success');
  };

  const removeImage = (imageId) => {
    // Find the image to remove
    const imageToRemove = additionalImages.find((img) => img.id === imageId);

    if (!imageToRemove) {
      // console.warn(`Image with ID ${imageId} not found`); // Helpful for development
      return;
    }

    // Remove from additionalImages array
    setAdditionalImages((prev) => prev.filter((img) => img.id !== imageId));

    // If it's a new/local file, also remove from formData.images
    if (imageToRemove.isNew && imageToRemove.file) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((file) => file !== imageToRemove.file),
      }));
    }

    // Show feedback
    addToast(`Image "${imageToRemove.filename}" removed`, 'success');
  };

  const handleGuideToggle = (guideId) => {
    setFormData((prev) => ({
      ...prev,
      guides: prev.guides.includes(guideId)
        ? prev.guides.filter((g) => g !== guideId)
        : [...prev.guides, guideId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data - use 'id' to determine if it's a new tour (id doesn't exist in params)
    const newErrors = validateTourData(formData, !id);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Please fix all errors before submitting', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const formDataToSend = new FormData();

      if (id) {
        // PATCH REQUEST: Only send changed fields (editing existing tour)

        if (formData.name !== tour.name) {
          formDataToSend.append('name', formData.name || '');
        }
        if (formData.duration !== tour.duration) {
          if (formData.duration) formDataToSend.append('duration', parseInt(formData.duration));
        }
        if (formData.maxGroupSize !== tour.maxGroupSize) {
          if (formData.maxGroupSize)
            formDataToSend.append('maxGroupSize', parseInt(formData.maxGroupSize));
        }
        if (formData.difficulty !== tour.difficulty) {
          formDataToSend.append('difficulty', formData.difficulty || 'easy');
        }
        if (formData.price !== tour.price) {
          if (formData.price) formDataToSend.append('price', parseFloat(formData.price));
        }
        if (formData.priceDiscount !== tour.priceDiscount) {
          // Always send fixed amount to backend - calculate if percentage
          let finalDiscount = parseFloat(formData.priceDiscount) || 0;
          if (formData.discountType === 'percentage' && formData.price) {
            const price = parseFloat(formData.price) || parseFloat(tour.price);
            finalDiscount = (price * finalDiscount) / 100;
          }
          if (finalDiscount) formDataToSend.append('priceDiscount', finalDiscount);
        }
        if (formData.summary !== tour.summary) {
          formDataToSend.append('summary', formData.summary || '');
        }
        if (formData.description !== tour.description) {
          formDataToSend.append('description', formData.description || '');
        }
        if (formData.secretTour !== tour.secretTour) {
          formDataToSend.append('secretTour', formData.secretTour || false);
        }

        // Check if coordinates changed
        const originalCoords = tour.startLocation?.coordinates || [];
        const currentCoords = formData.startLocation?.coordinates || [];
        if (
          JSON.stringify(originalCoords) !== JSON.stringify(currentCoords) ||
          formData.startLocation.address !== tour.startLocation?.address ||
          formData.startLocation.description !== tour.startLocation?.description
        ) {
          formDataToSend.append('startLocation', JSON.stringify(formData.startLocation || {}));
        }

        // Check if start dates changed
        if (JSON.stringify(formData.startDates) !== JSON.stringify(tour.startDates)) {
          formDataToSend.append('startDates', JSON.stringify(formData.startDates || []));
        }

        // Check if guides changed
        if (
          JSON.stringify(formData.guides) !==
          JSON.stringify((tour.guides || []).map((g) => g._id || g))
        ) {
          formDataToSend.append('guides', JSON.stringify(formData.guides || []));
        }

        // Handle cover image change
        if (formData.imageCover && formData.imageCover instanceof File) {
          formDataToSend.append('imageCover', formData.imageCover);
        }

        // Handle additional images changes
        const newImageFiles = additionalImages.filter((img) => img.isNew && img.file);
        const existingImageNames = additionalImages
          .filter((img) => !img.isNew)
          .map((img) => img.filename);
        const originalImages = tour.images || [];

        // Detect if images were modified (added or removed)
        const imagesWereModified =
          newImageFiles.length > 0 || // New images added
          existingImageNames.length !== originalImages.length || // Images removed
          !existingImageNames.every((name) => originalImages.includes(name)); // Images reordered/changed

        if (imagesWereModified) {
          // Send new images
          newImageFiles.forEach((img) => {
            formDataToSend.append('images', img.file);
          });

          // Send list of images to keep (so backend can delete the rest)
          // This serves as a reference but backend still primarily relies on uploaded files
          if (existingImageNames.length > 0 || newImageFiles.length === 0) {
            // If keeping some existing images or removing all, send the list
            formDataToSend.append('imagesToKeep', JSON.stringify(existingImageNames));
          }
        }

        await updateTourMutation.mutateAsync({
          tourId: id,
          data: formDataToSend,
        });
        addToast('Tour updated successfully!', 'success');
      } else {
        // POST REQUEST: Send all required fields for new tour
        formDataToSend.append('name', formData.name || '');
        if (formData.duration) formDataToSend.append('duration', parseInt(formData.duration));
        if (formData.maxGroupSize)
          formDataToSend.append('maxGroupSize', parseInt(formData.maxGroupSize));
        formDataToSend.append('difficulty', formData.difficulty || 'easy');
        if (formData.price) formDataToSend.append('price', parseFloat(formData.price));

        // Convert percentage to fixed amount if needed
        if (formData.priceDiscount) {
          let finalDiscount = parseFloat(formData.priceDiscount);
          if (formData.discountType === 'percentage' && formData.price) {
            const price = parseFloat(formData.price);
            finalDiscount = (price * finalDiscount) / 100;
          }
          formDataToSend.append('priceDiscount', finalDiscount);
        }

        formDataToSend.append('summary', formData.summary || '');
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('secretTour', formData.secretTour || false);

        if (formData.imageCover && formData.imageCover instanceof File) {
          formDataToSend.append('imageCover', formData.imageCover);
        }

        const newImageFiles = additionalImages.filter((img) => img.isNew && img.file);
        newImageFiles.forEach((img) => {
          formDataToSend.append('images', img.file);
        });

        formDataToSend.append('startDates', JSON.stringify(formData.startDates || []));
        formDataToSend.append('startLocation', JSON.stringify(formData.startLocation || {}));
        formDataToSend.append('guides', JSON.stringify(formData.guides || []));

        await createTourMutation.mutateAsync(formDataToSend);
        addToast('Tour created successfully!', 'success');
      }
      navigate('/manage/tours');
    } catch {
      // console.error('Submission error:', error); // Helpful for development
      addToast('Failed to save tour', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isNewTour = !id;

  if (isLoading) {
    return <LoadingState message="Loading tour form..." minHeight="100vh" />;
  }

  return (
    <main className="main tour-form-page">
      {/* PAGE HEADER */}
      <section className="form-page-header">
        <div className="form-page-header__content">
          <h1 className="form-page-header__title">
            {isNewTour ? '✚ Create New Tour' : '✎ Edit Tour'}
          </h1>
          <p className="form-page-header__description">
            {isNewTour ? 'Add a new tour to your collection' : 'Update tour information'}
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/manage/tours')}
            className="form-page-header__back"
          >
            ← Back to Tours
          </Button>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="form-page-content">
        <div className="form-page-container">
          {/* VALIDATION ALERT */}
          <ValidationAlert errors={errors} />

          {/* FORM */}
          <form className="tour-form" onSubmit={handleSubmit}>
            {/* Basic Info */}
            <BasicInfoSection
              formData={formData}
              touched={touched}
              errors={errors}
              onBasicChange={handleBasicChange}
              onBlur={handleBlur}
            />

            {/* Pricing */}
            <PricingSection
              formData={formData}
              touched={touched}
              errors={errors}
              calculatedDiscount={calculateDiscountedPrice(
                formData.price,
                formData.priceDiscount,
                formData.discountType
              )}
              onBasicChange={handleBasicChange}
              onBlur={handleBlur}
            />

            {/* Description */}
            <DescriptionSection
              formData={formData}
              touched={touched}
              errors={errors}
              onBasicChange={handleBasicChange}
              onBlur={handleBlur}
            />

            {/* Images */}
            <ImagesSection
              imagePreviews={imagePreviews}
              additionalImages={additionalImages}
              formData={formData}
              touched={touched}
              errors={errors}
              onImageChange={handleImageChange}
              onRemoveCover={removeCoverImage}
              onRemoveImage={removeImage}
            />

            {/* Start Location */}
            <StartLocationSection
              formData={formData}
              onLocationChange={handleLocationChange}
              onCoordinateChange={handleCoordinateChange}
            />

            {/* Start Dates */}
            <StartDatesSection
              startDatesInput={startDatesInput}
              onStartDatesChange={handleStartDatesChange}
              formData={formData}
            />

            {/* Guides */}
            <GuidesSection
              guides={guides}
              selectedGuides={formData.guides}
              onGuideToggle={handleGuideToggle}
            />

            {/* Options */}
            <OptionsSection formData={formData} onBasicChange={handleBasicChange} />

            {/* FORM ACTIONS */}
            <div className="form-actions">
              <Button type="submit" variant="primary" size="lg" disabled={isSaving}>
                {isNewTour ? '✚ Create Tour' : '💾 Update Tour'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/manage/tours')}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
