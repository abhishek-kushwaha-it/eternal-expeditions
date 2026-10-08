import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Image, Button, Card } from '../core-components';
import { IMAGE_URL } from '../utils/api';
import styles from './TourCard.module.css';

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
  const startDate = tour.startDates?.[0]
    ? new Date(tour.startDates[0]).toLocaleString('en-us', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Dates to be announced';

  const cardHeader = (
    <div className={styles['tour-card__image-wrapper']}>
      <Image
        src={`${IMAGE_URL}/tours/${tour.imageCover}`}
        alt={tour.name}
        className={styles['tour-card__image']}
      />
    </div>
  );

  const cardFooter = (
    <>
      <div className={styles['tour-card__pricing']}>
        {tour.priceDiscount ? (
          <div className={styles['price-section']}>
            <div className={styles['original-price']}>${tour.price}</div>
            <div className={styles['discounted-price']}>
              ${getDiscountedPrice(tour.price, tour.priceDiscount).toFixed(2)}
            </div>
            <div className={styles['discount-badge']}>
              -{getDiscountPercentage(tour.price, tour.priceDiscount)}%
            </div>
          </div>
        ) : (
          <div className={styles['price-section']}>
            <div className={styles['discounted-price']}>${tour.price}</div>
          </div>
        )}
        <div className={styles['per-person']}>per person</div>
      </div>

      <Link to={`/tour/${tour.id}`} className={styles['tour-card__link']}>
        <Button variant="primary" size="sm">
          View Details
        </Button>
      </Link>
    </>
  );

  return (
    <Card header={cardHeader} footer={cardFooter} className={styles['tour-card']}>
      <div className={styles['tour-card__header-section']}>
        <h3 className={styles['tour-card__title']}>{tour.name}</h3>
        <div className={styles['tour-card__header-right']}>
          <div className={styles['tour-card__difficulty']}>{tour.difficulty}</div>
          <div className={styles['tour-card__rating-header']}>
            <span className={styles['rating-value']}>{tour.ratingsAverage}</span>
            <span className={styles['rating-count']}>({tour.ratingsQuantity})</span>
          </div>
        </div>
      </div>

      <p className={styles['tour-card__summary']}>{tour.summary}</p>

      {/* Key Details Grid */}
      <div className={styles['tour-card__details-grid']}>
        <div className={styles['detail-item']}>
          <div className={styles['detail-icon']}>📅</div>
          <div className={styles['detail-label']}>Start</div>
          <div className={styles['detail-value']}>{startDate}</div>
        </div>

        <div className={styles['detail-item']}>
          <div className={styles['detail-icon']}>🛑</div>
          <div className={styles['detail-label']}>Stops</div>
          <div className={styles['detail-value']}>{tour.locations.length}</div>
        </div>

        <div className={styles['detail-item']}>
          <div className={styles['detail-icon']}>📍</div>
          <div className={styles['detail-label']}>Duration</div>
          <div className={styles['detail-value']}>{tour.duration} days</div>
        </div>

        <div className={styles['detail-item']}>
          <div className={styles['detail-icon']}>👥</div>
          <div className={styles['detail-label']}>Group</div>
          <div className={styles['detail-value']}>{tour.maxGroupSize}</div>
        </div>
      </div>

      {/* Location */}
      <div className={styles['tour-card__location']}>
        <span className={styles['location-icon']}>📌</span>
        <span className={styles['location-text']}>
          {tour.startLocation?.description || 'Location to be announced'}
        </span>
      </div>

      {distance !== undefined && distance !== null && (
        <div className={styles['tour-card__distance']}>
          <span className={styles['distance-icon']}>📍</span>
          <span className={styles['distance-text']}>
            {distance.toFixed(2)} {unit === 'mi' ? 'mi' : 'km'} from you
          </span>
        </div>
      )}
    </Card>
  );
}

export default memo(TourCard);
