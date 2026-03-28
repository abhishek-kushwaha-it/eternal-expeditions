import { useState, useCallback, useMemo } from 'react';
import {
  useAllReviews,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import {
  Button,
  LoadingState,
  ErrorState,
  ConfirmDialog,
  useConfirmDialog,
} from '../core-components';
import { ReviewCard, FilterPanel } from '../components';
import './ManageReviews.css';

export default function ManageReviews() {
  const { data: reviews = [], isLoading, error } = useAllReviews();
  const deleteReviewMutation = useDeleteReviewMutation();
  const updateReviewMutation = useUpdateReviewMutation();
  const { addToast } = useToasts();
  const {
    dialog: deleteDialog,
    open: openDeleteDialog,
    confirm: confirmDelete,
    cancel: cancelDelete,
  } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [searchTour, setSearchTour] = useState('');

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating-high', label: 'Rating: High to Low' },
    { value: 'rating-low', label: 'Rating: Low to High' },
  ];

  const ratingFilters = useMemo(
    () => [
      { value: 'all', label: 'All Ratings', count: reviews.length },
      {
        value: '5',
        label: '⭐⭐⭐⭐⭐',
        count: reviews.filter((r) => r.rating === 5).length,
      },
      {
        value: '4',
        label: '⭐⭐⭐⭐ & Up',
        count: reviews.filter((r) => r.rating >= 4).length,
      },
      {
        value: '3',
        label: '⭐⭐⭐ & Up',
        count: reviews.filter((r) => r.rating >= 3).length,
      },
      {
        value: '2',
        label: '⭐⭐ & Up',
        count: reviews.filter((r) => r.rating >= 2).length,
      },
      {
        value: '1',
        label: '⭐',
        count: reviews.filter((r) => r.rating === 1).length,
      },
    ],
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (filterRating !== 'all') {
          const minRating = parseInt(filterRating);
          if (r.rating < minRating) return false;
        }
        if (searchTour) {
          const searchLower = searchTour.toLowerCase();
          const matchesTourId = r.tour?.includes(searchLower);
          const matchesUserName = r.user?.name?.toLowerCase().includes(searchLower);
          const matchesUserId = r.user?._id?.includes(searchTour);
          if (!matchesTourId && !matchesUserName && !matchesUserId) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'rating-high':
            return b.rating - a.rating;
          case 'rating-low':
            return a.rating - b.rating;
          default:
            return 0;
        }
      });
  }, [reviews, sortBy, filterRating, searchTour]);

  const handleDeleteReview = useCallback(
    (reviewId) => {
      const review = reviews.find((r) => r._id === reviewId);
      openDeleteDialog({
        title: 'Delete Review?',
        message: 'Once deleted, the review cannot be recovered.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      }).then((confirmed) => {
        if (confirmed) {
          deleteReviewMutation.mutate(
            {
              reviewId: review._id,
              tourId: review.tour._id,
            },
            {
              onSuccess: () => {
                addToast('Review deleted successfully!', 'success');
              },
              onError: () => {
                addToast('Failed to delete review', 'error');
              },
            }
          );
        }
      });
    },
    [deleteReviewMutation, addToast, openDeleteDialog, reviews]
  );

  const handleUpdateReview = useCallback(
    (updateData, onSuccess) => {
      updateReviewMutation.mutate(updateData, {
        onSuccess: () => {
          addToast('Review updated successfully!', 'success');
          onSuccess?.();
        },
        onError: () => {
          addToast('Failed to update review', 'error');
        },
      });
    },
    [updateReviewMutation, addToast]
  );

  if (isLoading) {
    return <LoadingState message="Loading reviews..." minHeight="60vh" />;
  }

  if (error) {
    return (
      <main className="main">
        <ErrorState
          title="Failed to Load Reviews"
          message={error?.message || 'An error occurred while loading reviews.'}
          emoji="⚠️"
          showAction={false}
        />
      </main>
    );
  }

  return (
    <main className="main">
      <div className="page__container">
        <div className="manage-reviews__header">
          <h2 className="page__title">📝 Manage Reviews ({reviews.length})</h2>
        </div>

        <div className="manage-reviews__filters">
          <FilterPanel
            filters={ratingFilters}
            activeFilter={filterRating}
            onFilterChange={(rating) => setFilterRating(rating)}
            sorts={sortOptions}
            activeSort={sortBy}
            onSortChange={(sort) => setSortBy(sort)}
            searchTerm={searchTour}
            onSearchChange={(term) => setSearchTour(term)}
            searchPlaceholder="Search by User Name or Tour ID..."
            showSearch={true}
          />
        </div>

        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">No reviews match your filters</p>
          </div>
        ) : (
          <div className="reviews-list">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                isOwnReview={false}
                canManage={true}
                onEdit={handleUpdateReview}
                onDelete={handleDeleteReview}
                isLoading={updateReviewMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog {...deleteDialog} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </main>
  );
}
