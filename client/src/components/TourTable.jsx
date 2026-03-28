import { useState, useCallback } from 'react';
import {
  Button,
  Image,
  ErrorState,
  Card,
  ConfirmDialog,
  useConfirmDialog,
} from '../core-components';
import { IMAGE_URL } from '../utils/api';
import './TourTable.css';

// Difficulty Badge Helper
const DifficultyBadge = ({ difficulty }) => {
  const getVariant = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'difficult':
        return 'danger';
      default:
        return 'default';
    }
  };

  const variant = getVariant(difficulty);
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <span className="status-badge__icon"></span>
      <span className="status-badge__text">{difficulty}</span>
    </span>
  );
};

// Image Column Component
const ImageColumn = ({ tour }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError || !tour.imageCover) {
    return (
      <td className="table__cell table__cell--image">
        <div className="tour-thumbnail tour-thumbnail--placeholder">🖼️</div>
      </td>
    );
  }

  return (
    <td className="table__cell table__cell--image">
      <Image
        src={`${IMAGE_URL}/tours/${tour.imageCover}`}
        alt={tour.name}
        onError={() => setImageError(true)}
        className="tour-thumbnail"
      />
    </td>
  );
};

// Name Column with Secret Badge
const NameColumn = ({ tour }) => (
  <td className="table__cell table__cell--name">
    <div className="tour-name-cell">
      <span className="tour-name-cell__name">{tour.name}</span>
      {tour.secretTour && <span className="tour-name-cell__badge">🔒 Secret</span>}
    </div>
  </td>
);

// Rating Column Component
const RatingColumn = ({ tour }) => (
  <td className="table__cell">
    <div className="rating-cell">
      <span className="rating-cell__stars">⭐</span>
      <span className="rating-cell__value">{tour.ratingsAverage || 'N/A'}</span>
      <span className="rating-cell__count">({tour.ratingsQuantity || 0})</span>
    </div>
  </td>
);

// Guides Column Component
const GuidesColumn = ({ tour }) => (
  <td className="table__cell table__cell--center">
    <div className="guides-cell">
      {tour.guides && tour.guides.length > 0 ? (
        <div className="guides-avatars">
          {tour.guides.slice(0, 2).map((guide, idx) => (
            <div key={idx} className="guides-avatars__item" title={guide.name}>
              {guide.name?.charAt(0) || '?'}
            </div>
          ))}
          {tour.guides.length > 2 && (
            <div className="guides-avatars__more">+{tour.guides.length - 2}</div>
          )}
        </div>
      ) : (
        <span className="guides-cell__empty">None</span>
      )}
    </div>
  </td>
);

// Actions Column Component
const ActionsColumn = ({ tour, onEdit, isDeleting, onDeleteClick }) => (
  <td className="table__cell table__cell--center table__cell--actions">
    <div className="actions-group">
      <Button onClick={() => onEdit(tour)} variant="primary" size="sm" title="Edit tour">
        ✎ Edit
      </Button>
      <Button
        onClick={() => onDeleteClick(tour)}
        variant="danger"
        size="sm"
        disabled={isDeleting === tour._id}
        loading={isDeleting === tour._id}
        title="Delete tour"
      >
        🗑️ Delete
      </Button>
    </div>
  </td>
);

// Tour Row Component
const TourRow = ({ tour, onEdit, isDeleting, onDeleteClick }) => (
  <tr className="table__row">
    <ImageColumn tour={tour} />
    <NameColumn tour={tour} />

    <td className="table__cell">
      <span className="tour-info-cell">📅 {tour.duration} days</span>
    </td>

    <td className="table__cell">
      <span className="tour-info-cell">👥 {tour.maxGroupSize}</span>
    </td>

    <td className="table__cell">
      <span className="price-cell__price">${tour.price}</span>
    </td>

    <td className="table__cell">
      <DifficultyBadge difficulty={tour.difficulty} />
    </td>

    <RatingColumn tour={tour} />
    <GuidesColumn tour={tour} />
    <ActionsColumn
      tour={tour}
      onEdit={onEdit}
      isDeleting={isDeleting}
      onDeleteClick={onDeleteClick}
    />
  </tr>
);

// Main Table Component
export default function TourTable({ tours, onEdit, onDelete, isDeleting }) {
  const confirm = useConfirmDialog();

  const handleDeleteClick = useCallback(
    async (tour) => {
      const result = await confirm.open({
        title: '⚠️ Delete Tour',
        message: `Are you sure you want to delete "${tour.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      });

      if (result) {
        try {
          await onDelete(tour._id);
        } finally {
          confirm.setLoading(false);
        }
      }
    },
    [confirm, onDelete]
  );

  if (!tours || tours.length === 0) {
    return (
      <Card className="tour-table">
        <ErrorState
          title="No tours found"
          message="Create your first tour to get started!"
          emoji="🗻"
          showAction={false}
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="tour-table">
        <div className="table-container">
          <table className="table">
            <thead className="table__head">
              <tr>
                <th className="table__header table__header--image">Image</th>
                <th className="table__header">Name</th>
                <th className="table__header">Duration</th>
                <th className="table__header">Group Size</th>
                <th className="table__header">Price</th>
                <th className="table__header">Difficulty</th>
                <th className="table__header">Rating</th>
                <th className="table__header table__header--center">Guides</th>
                <th className="table__header table__header--center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <TourRow
                  key={tour._id}
                  tour={tour}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                  onDeleteClick={handleDeleteClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
    </>
  );
}
