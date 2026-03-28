import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Image, Button, Card } from '../core-components';
import { IMAGE_URL } from '../utils/api';
import './TourCard.css';

// Helper function to calculate discounted price
const getDiscountedPrice = (price, discount) => {
  if (!discount) return null;
  return price - discount;
};

// Helper function to calculate discount percentage
const getDiscountPercentage = (price, discount) => {
  if (!price || !discount) return 0;
  return ((discount / price) * 100).toFixed(2);
};

function TourCard({ tour, distance, unit = 'mi' }) {
  const startDate = new Date(tour.startDates[0]).toLocaleString('en-us', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const cardHeader = (
    <div className="tour-card__image-wrapper">
      <Image
        src={`${IMAGE_URL}/tours/${tour.imageCover}`}
        alt={tour.name}
        className="tour-card__image"
      />
    </div>
  );

  const cardFooter = (
    <>
      <div className="tour-card__pricing">
        {tour.priceDiscount ? (
          <div className="price-section">
            <div className="original-price">${tour.price}</div>
            <div className="discounted-price">
              ${getDiscountedPrice(tour.price, tour.priceDiscount).toFixed(2)}
            </div>
            <div className="discount-badge">
              -{getDiscountPercentage(tour.price, tour.priceDiscount)}%
            </div>
          </div>
        ) : (
          <div className="price-section">
            <div className="discounted-price">${tour.price}</div>
          </div>
        )}
        <div className="per-person">per person</div>
      </div>

      <Link to={`/tour/${tour.id}`} className="tour-card__link">
        <Button variant="primary" size="sm">
          View Details
        </Button>
      </Link>
    </>
  );

  return (
    <Card header={cardHeader} footer={cardFooter} className="tour-card">
      <div className="tour-card__header-section">
        <h3 className="tour-card__title">{tour.name}</h3>
        <div className="tour-card__header-right">
          <div className="tour-card__difficulty">{tour.difficulty}</div>
          <div className="tour-card__rating-header">
            <span className="rating-value">{tour.ratingsAverage}</span>
            <span className="rating-count">({tour.ratingsQuantity})</span>
          </div>
        </div>
      </div>

      <p className="tour-card__summary">{tour.summary}</p>

      {/* Key Details Grid */}
      <div className="tour-card__details-grid">
        <div className="detail-item">
          <div className="detail-icon">📅</div>
          <div className="detail-label">Start</div>
          <div className="detail-value">{startDate}</div>
        </div>

        <div className="detail-item">
          <div className="detail-icon">🛑</div>
          <div className="detail-label">Stops</div>
          <div className="detail-value">{tour.locations.length}</div>
        </div>

        <div className="detail-item">
          <div className="detail-icon">📍</div>
          <div className="detail-label">Duration</div>
          <div className="detail-value">{tour.duration} days</div>
        </div>

        <div className="detail-item">
          <div className="detail-icon">👥</div>
          <div className="detail-label">Group</div>
          <div className="detail-value">{tour.maxGroupSize}</div>
        </div>
      </div>

      {/* Location */}
      <div className="tour-card__location">
        <span className="location-icon">📌</span>
        <span className="location-text">{tour.startLocation.description}</span>
      </div>

      {distance !== undefined && distance !== null && (
        <div className="tour-card__distance">
          <span className="distance-icon">📍</span>
          <span className="distance-text">
            {distance.toFixed(2)} {unit === 'mi' ? 'mi' : 'km'} from you
          </span>
        </div>
      )}
    </Card>
  );
}

export default memo(TourCard);
