import { useState, useCallback, useMemo } from 'react';
import {
  useAllBookings,
  useDeleteBookingMutation,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useTours,
  useAllUsers,
} from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import {
  Button,
  LoadingState,
  ErrorState,
  ConfirmDialog,
  useConfirmDialog,
} from '../core-components';
import { BookingCard } from '../components';
import './ManageBookings.css';

export default function ManageBookings() {
  const { data: bookings = [], isLoading, error } = useAllBookings();
  const { data: tours = [] } = useTours();
  const { data: users = [] } = useAllUsers();
  const deleteBookingMutation = useDeleteBookingMutation();
  const createBookingMutation = useCreateBookingMutation();
  const updateBookingMutation = useUpdateBookingMutation();
  const { addToast } = useToasts();
  const {
    dialog: deleteDialog,
    open: openDeleteDialog,
    confirm: confirmDelete,
    cancel: cancelDelete,
  } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('newest');
  const [searchUser, setSearchUser] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    tour: '',
    user: '',
    price: '',
  });

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (searchUser && !b.user?.name?.toLowerCase().includes(searchUser.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'price-high':
            return b.price - a.price;
          case 'price-low':
            return a.price - b.price;
          default:
            return 0;
        }
      });
  }, [bookings, sortBy, searchUser]);

  const handleDeleteBooking = useCallback(
    async (bookingId) => {
      const confirmed = await openDeleteDialog({
        title: 'Delete Booking?',
        message: 'This action cannot be undone. The booking will be permanently deleted.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      });

      if (confirmed) {
        try {
          await deleteBookingMutation.mutateAsync(bookingId);
          addToast('Booking deleted successfully!', 'success');
        } catch {
          addToast('Failed to delete booking', 'error');
        }
      }
    },
    [deleteBookingMutation, addToast, openDeleteDialog]
  );

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBooking(null);
    setFormData({ tour: '', user: '', price: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'tour') {
      // Auto-populate price from selected tour
      const selectedTour = tours.find((t) => t._id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        price: selectedTour ? selectedTour.price : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleOpenForm = (booking = null) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        tour: booking.tour._id,
        user: booking.user._id,
        price: booking.price,
      });
    } else {
      setEditingBooking(null);
      setFormData({ tour: '', user: '', price: '' });
    }
    setShowForm(true);
  };

  const handleSubmitForm = useCallback(
    async (e) => {
      e.preventDefault();

      if (!formData.tour || !formData.user || !formData.price) {
        addToast('Please fill all required fields', 'error');
        return;
      }

      try {
        if (editingBooking) {
          await updateBookingMutation.mutateAsync({
            bookingId: editingBooking._id,
            data: {
              price: parseFloat(formData.price),
            },
          });
          addToast('Booking updated successfully!', 'success');
        } else {
          await createBookingMutation.mutateAsync({
            tourId: formData.tour,
            userId: formData.user,
            price: parseFloat(formData.price),
          });
          addToast('Booking created successfully!', 'success');
        }
        handleCloseForm();
      } catch {
        addToast(editingBooking ? 'Failed to update booking' : 'Failed to create booking', 'error');
      }
    },
    [formData, editingBooking, createBookingMutation, updateBookingMutation, addToast]
  );

  if (isLoading) {
    return <LoadingState message="Loading bookings..." minHeight="60vh" />;
  }

  if (error) {
    return (
      <main className="main">
        <ErrorState
          title="Failed to Load Bookings"
          message={error?.message || 'An error occurred while loading bookings.'}
          emoji="⚠️"
          showAction={false}
        />
      </main>
    );
  }

  return (
    <main className="main">
      <div className="page__container">
        <div className="manage-bookings__header">
          <h2 className="page__title">📅 Manage Bookings ({bookings.length})</h2>
          <Button variant="primary" onClick={() => handleOpenForm()}>
            + Create Booking
          </Button>
        </div>

        <div className="manage-bookings__filters">
          <div className="filters__grid">
            <div className="form__group">
              <label className="form__label">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form__select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
              </select>
            </div>

            <div className="form__group">
              <label className="form__label">Search User</label>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="User name..."
                className="form__input"
              />
            </div>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__text">No bookings match your filters</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                showReviews={false}
                showAdminControls={true}
                onEditBooking={handleOpenForm}
                onDeleteBooking={handleDeleteBooking}
                isDeleting={deleteBookingMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Booking Form Modal */}
      {showForm && (
        <div className="form-modal-overlay">
          <div className="form-modal">
            <div className="form-modal__header">
              <h3>{editingBooking ? 'Edit Booking' : 'Create New Booking'}</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseForm}
                className="form-modal__close"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmitForm} className="form-modal__body">
              <div className="form__group">
                <label className="form__label">Select Tour *</label>
                <select
                  name="tour"
                  value={formData.tour}
                  onChange={handleFormChange}
                  className="form__select"
                  disabled={editingBooking}
                >
                  <option value="">Choose a tour...</option>
                  {tours.map((tour) => (
                    <option key={tour._id} value={tour._id}>
                      {tour.name} - ${tour.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label className="form__label">Select User *</label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={handleFormChange}
                  className="form__select"
                  disabled={editingBooking}
                >
                  <option value="">Choose a user...</option>
                  {users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label className="form__label">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  className="form__input"
                  placeholder="Enter booking price"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-modal__footer">
                <Button type="button" variant="secondary" onClick={handleCloseForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createBookingMutation.isPending || updateBookingMutation.isPending}
                >
                  {createBookingMutation.isPending || updateBookingMutation.isPending
                    ? 'Saving...'
                    : editingBooking
                      ? 'Update Booking'
                      : 'Create Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...deleteDialog} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </main>
  );
}
