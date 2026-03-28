import { memo, useState } from 'react';
import { Card, Image, Button } from '../core-components';
import { IMAGE_URL } from '../utils/api';
import './ReviewCard.css';

function ReviewCard({ review, isOwnReview, canManage, onEdit, onDelete, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editReview, setEditReview] = useState(review.review);

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`review-card__star review-card__star--${
          star <= (isEditing ? editRating : review.rating) ? 'active' : 'inactive'
        }`}
      >
        <use xlinkHref="/img/icons.svg#icon-star"></use>
      </svg>
    ));
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const handleSave = () => {
    onEdit(
      {
        reviewId: review._id,
        rating: editRating,
        review: editReview,
        tourId: review.tour._id,
      },
      () => setIsEditing(false)
    );
  };

  const handleCancel = () => {
    setEditRating(review.rating);
    setEditReview(review.review);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="review-card review-card--editing">
        <div className="review-card__edit-header">
          <h3 className="review-card__edit-title">Edit Review</h3>
          <p className="review-card__edit-subtitle">User: {review.user?.name}</p>
        </div>

        <div className="review-card__edit-content">
          <div className="review-card__edit-form-group">
            <label className="review-card__edit-label">Rating</label>
            <div className="review-card__edit-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-card__edit-star-btn review-card__edit-star-btn--${
                    star <= editRating ? 'active' : 'inactive'
                  }`}
                  onClick={() => setEditRating(star)}
                  title={`Rate ${star} stars`}
                >
                  ⭐
                </button>
              ))}
              <span className="review-card__edit-rating-text">{editRating}/5</span>
            </div>
          </div>

          <div className="review-card__edit-form-group">
            <label className="review-card__edit-label">Review Text</label>
            <textarea
              value={editReview}
              onChange={(e) => setEditReview(e.target.value)}
              className="review-card__edit-textarea"
              placeholder="Write your review..."
              rows="4"
            />
          </div>
        </div>

        <div className="review-card__edit-footer">
          <Button onClick={handleSave} variant="success" disabled={isLoading} loading={isLoading}>
            💾 Save
          </Button>
          <Button onClick={handleCancel} variant="secondary" disabled={isLoading}>
            ✕ Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="review-card">
      <div className="review-card__header">
        <div className="review-card__author-info">
          <Image
            src={`${IMAGE_URL}/users/${review.user.photo}`}
            alt={review.user.name}
            className="review-card__avatar"
          />
          <div className="review-card__author-meta">
            <div className="review-card__author">
              {review.user.name}
              {isOwnReview && (
                <span className="review-card__badge review-card__badge--own"> (Your Review)</span>
              )}
              {canManage && !isOwnReview && (
                <span className="review-card__badge review-card__badge--moderator">
                  {' '}
                  (Moderator)
                </span>
              )}
            </div>
            <div className="review-card__meta-row">
              <span className="review-card__meta-label">Tour:</span>
              <span className="review-card__meta-value">{review.tour?.name || 'Unknown tour'}</span>
            </div>
            {review.tour?.difficulty && (
              <div className="review-card__meta-row">
                <span className="review-card__meta-label">Difficulty:</span>
                <span className="review-card__meta-value">{review.tour.difficulty}</span>
              </div>
            )}
            <time className="review-card__date">{formatDate(review.createdAt)}</time>
          </div>
        </div>
        <div className="review-card__rating">
          <div className="review-card__stars">{renderStars()}</div>
          <div className="review-card__rating-value">{review.rating}/5</div>
        </div>
      </div>
      <div className="review-card__divider"></div>
      <p className="review-card__text">{review.review}</p>
      {canManage && (
        <div className="review-card__actions">
          <Button
            className="review-card__action-btn review-card__action-btn--edit"
            onClick={() => setIsEditing(true)}
            variant="secondary"
            size="sm"
            title={isOwnReview ? 'Edit your review' : 'Edit this review as moderator'}
          >
            ✏️ Edit
          </Button>
          <Button
            className="review-card__action-btn review-card__action-btn--delete"
            onClick={() => onDelete(review._id)}
            variant="danger"
            size="sm"
            disabled={isLoading}
            title={isOwnReview ? 'Delete your review' : 'Delete this review as moderator'}
          >
            🗑️ Delete
          </Button>
        </div>
      )}
    </Card>
  );
}

export default memo(ReviewCard);
