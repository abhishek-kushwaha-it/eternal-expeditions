import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllToursAdmin, useDeleteTourMutation } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import { Button, LoadingState } from '../core-components';
import TourTable from '../components/TourTable';
import './ManageTours.css';

export default function ManageTours() {
  const navigate = useNavigate();
  const { data: tours = [], isLoading: isLoadingTours } = useAllToursAdmin();
  const { addToast } = useToasts();

  const deleteMutation = useDeleteTourMutation();

  const [deletingTourId, setDeletingTourId] = useState(null);

  const handleCreateTour = useCallback(() => {
    navigate('/manage/tours/new');
  }, [navigate]);

  const handleEditTour = useCallback(
    (tour) => {
      navigate(`/manage/tours/${tour._id}/edit`);
    },
    [navigate]
  );

  const handleDeleteTour = useCallback(
    async (tourId) => {
      setDeletingTourId(tourId);
      try {
        await deleteMutation.mutateAsync(tourId);
        addToast('Tour deleted successfully! 🗑️', 'success');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete tour';
        addToast(errorMessage, 'error');
      } finally {
        setDeletingTourId(null);
      }
    },
    [deleteMutation, addToast]
  );

  if (isLoadingTours) {
    return <LoadingState message="Loading tours..." minHeight="60vh" />;
  }

  return (
    <main className="main">
      <div className="page__container manage-tours-container">
        {/* Header */}
        <div className="manage-tours__header">
          <div className="manage-tours__title-section">
            <h1 className="page__title">🏔️ Manage Tours</h1>
            <p className="manage-tours__subtitle">
              {tours.length} {tours.length === 1 ? 'tour' : 'tours'} available
            </p>
          </div>
          <Button
            onClick={handleCreateTour}
            variant="success"
            size="lg"
            className="manage-tours__create-btn"
          >
            + Create New Tour
          </Button>
        </div>

        {/* Statistics Cards */}
        {tours.length > 0 && (
          <div className="manage-tours__stats">
            <div className="stat-card">
              <span className="stat-card__label">Total Tours</span>
              <span className="stat-card__value">{tours.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Avg Price</span>
              <span className="stat-card__value">
                ${(tours.reduce((sum, t) => sum + t.price, 0) / tours.length).toFixed(2)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Avg Rating</span>
              <span className="stat-card__value">
                {tours.length > 0
                  ? (
                      tours.reduce((sum, t) => sum + (t.ratingsAverage || 0), 0) / tours.length
                    ).toFixed(1)
                  : 'N/A'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Secret Tours</span>
              <span className="stat-card__value">{tours.filter((t) => t.secretTour).length}</span>
            </div>
          </div>
        )}

        {/* Tour Table */}
        <div className="manage-tours__table-section">
          <TourTable
            tours={tours}
            onEdit={handleEditTour}
            onDelete={handleDeleteTour}
            isDeleting={deletingTourId}
          />
        </div>
      </div>
    </main>
  );
}
