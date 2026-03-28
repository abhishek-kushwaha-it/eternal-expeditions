import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  Button,
  Card,
  ConfirmDialog,
  useConfirmDialog,
  FormGroup,
} from '../core-components';
import { ReviewCard } from './index';
import {
  useAllReviews,
  useMyReviews,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
  useCreateReviewMutation,
} from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import { IMAGE_URL } from '../utils/api';
import './BookingCard.css';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const DetailItem = ({ label, value, isPrimary = false }) => (
  <div className="booking-detail">
    <span className="booking-detail__label">{label}:</span>
    <span className={`booking-detail__value ${isPrimary ? 'booking-detail__value--primary' : ''}`}>
      {value}
    </span>
  </div>
);

export default function BookingCard({
  booking,
  onReviewChanged,
  showReviews = true,
  showAdminControls = false,
  onEditBooking,
  onDeleteBooking,
  isDeleting = false,
}) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewText, setReviewText] = useState('');

  const confirm = useConfirmDialog();

  const { refetch: refetchReviews } = useAllReviews();
  const { data: myReviews = [], refetch: refetchMyReviews } = useMyReviews();
  const deleteReviewMutation = useDeleteReviewMutation();
  const updateReviewMutation = useUpdateReviewMutation();
  const createReviewMutation = useCreateReviewMutation();
  const { addToast } = useToasts();

  const tourReviews = useMemo(
    () =>
      myReviews.filter((review) => review.tour?._id?.toString() === booking.tour?._id?.toString()),
    [myReviews, booking.tour._id]
  );

  const hasExistingReview = useMemo(
    () =>
      myReviews.some((review) => review.tour?._id?.toString() === booking.tour?._id?.toString()),
    [myReviews, booking.tour._id]
  );

  const handleUpdateReview = useCallback(
    async (updateData, onSuccess) => {
      try {
        await updateReviewMutation.mutateAsync({
          reviewId: updateData.reviewId,
          rating: updateData.rating,
          review: updateData.review,
          tourId: booking.tour._id,
        });
        addToast('Review updated!', 'success');
        refetchMyReviews();
        refetchReviews();
        if (onSuccess) onSuccess();
      } catch {
        addToast('Failed to update review', 'error');
      }
    },
    [booking.tour._id, updateReviewMutation, addToast, refetchMyReviews, refetchReviews]
  );

  const handleDeleteReview = useCallback(
    async (reviewId) => {
      const result = await confirm.open({
        title: '⚠️ Delete Review',
        message: 'Are you sure you want to delete this review? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      });
      if (result) {
        confirm.setLoading(true);
        try {
          await deleteReviewMutation.mutateAsync({
            reviewId,
            tourId: booking.tour._id,
          });
          addToast('Review deleted!', 'success');
          refetchMyReviews();
          refetchReviews();
        } catch {
          addToast('Failed to delete review', 'error');
        } finally {
          confirm.setLoading(false);
        }
      }
    },
    [confirm, booking.tour._id, deleteReviewMutation, addToast, refetchMyReviews, refetchReviews]
  );

  const handleCreateReview = useCallback(
    async (rating, reviewText) => {
      try {
        await createReviewMutation.mutateAsync({
          tour: booking.tour._id,
          rating: parseInt(rating),
          review: reviewText.trim(),
        });
        addToast('Review submitted!', 'success');
        refetchMyReviews();
        refetchReviews();
        if (onReviewChanged) onReviewChanged();
        setShowReviewForm(false);
        setReviewRating('5');
        setReviewText('');
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to save review';
        addToast(message, 'error');
      }
    },
    [
      booking.tour._id,
      createReviewMutation,
      addToast,
      refetchMyReviews,
      refetchReviews,
      onReviewChanged,
    ]
  );

  const cardHeader = booking.tour?.imageCover && (
    <div className="booking-card__cover">
      <Image src={`${IMAGE_URL}/tours/${booking.tour.imageCover}`} alt={booking.tour.name} />
    </div>
  );

  const cardFooter = (
    <Link to={`/bookings/${booking._id}`} className="booking-footer__link">
      <Button variant="primary" size="sm">
        View Details
      </Button>
    </Link>
  );

  return (
    <Card header={cardHeader} footer={cardFooter} className="booking-card">
      <div className="booking-card__header">
        <h3 className="booking-card__title">{booking.tour?.name}</h3>
        <span
          className={`booking-status-badge booking-status-badge--${booking.paid ? 'confirmed' : 'pending'}`}
        >
          {booking.paid ? 'Paid' : 'Pending'}
        </span>
      </div>

      <div className="booking-details">
        <DetailItem label="Start Date" value={formatDate(booking.tour?.startDates?.[0])} />
        <DetailItem label="Duration" value={`${booking.tour?.duration} days`} />
        <DetailItem label="Price" value={`$${booking.price}`} isPrimary />
        <DetailItem label="Booking Date" value={formatDate(booking.createdAt)} />
      </div>

      {showReviews && booking.paid === true && (
        <div className="booking-reviews">
          {tourReviews.length > 0 && (
            <div className="booking-reviews__list">
              <h4 className="booking-reviews__title">Your Reviews ({tourReviews.length})</h4>
              <div className="booking-reviews__items">
                {tourReviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    isOwnReview={true}
                    canManage={true}
                    onEdit={handleUpdateReview}
                    onDelete={handleDeleteReview}
                    isLoading={updateReviewMutation.isPending || deleteReviewMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {!hasExistingReview && (
            <div className="review-trigger">
              {!showReviewForm ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReviewForm(true)}
                  fullWidth
                >
                  ⭐ Rate & Review
                </Button>
              ) : (
                <div className="review-form-wrapper">
                  <div className="review-form__header">
                    <h4>Write Your Review</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReviewForm(false)}
                      aria-label="Close review form"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="review-form__content">
                    <FormGroup
                      name="rating"
                      label="Rating (1-5 stars)"
                      type="select"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      options={[
                        { value: '1', label: '1 - Poor' },
                        { value: '2', label: '2 - Fair' },
                        { value: '3', label: '3 - Good' },
                        { value: '4', label: '4 - Very Good' },
                        { value: '5', label: '5 - Excellent' },
                      ]}
                    />
                    <FormGroup
                      name="review"
                      label="Your Review"
                      type="textarea"
                      placeholder="Share your experience with this tour..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      helperText={`${reviewText.length} characters`}
                      required
                    />
                  </div>
                  <div className="review-form__actions">
                    <Button variant="secondary" size="sm" onClick={() => setShowReviewForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (reviewText.trim()) {
                          handleCreateReview(reviewRating, reviewText);
                        } else {
                          addToast('Please write a review', 'error');
                        }
                      }}
                      disabled={createReviewMutation.isPending || !reviewText.trim()}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showAdminControls && (
        <div className="booking-card-admin-controls">
          <div className="admin-control-user">
            <label className="admin-control-label">Booked by:</label>
            <span>{booking.user?.name || 'Unknown'}</span>
          </div>

          <div className="admin-actions">
            <Button
              onClick={() => onEditBooking && onEditBooking(booking)}
              variant="primary"
              size="sm"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDeleteBooking && onDeleteBooking(booking._id)}
              variant="danger"
              size="sm"
              disabled={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.dialog.isOpen}
        title={confirm.dialog.title}
        message={confirm.dialog.message}
        confirmText={confirm.dialog.confirmText}
        cancelText={confirm.dialog.cancelText}
        isDangerous={confirm.dialog.isDangerous}
        isLoading={confirm.dialog.isLoading}
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </Card>
  );
}
