import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Image, ErrorState, LoadingState } from '../core-components';
import { useBooking } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import { IMAGE_URL } from '../utils/api';
import './BookingDetailsPage.css';

/**
 * BookingDetailsPage
 * Displays details of a single booking
 * RESTful: GET /bookings/:id
 */
export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = useBooking(bookingId);
  const { addToast } = useToasts();

  useEffect(() => {
    if (error) {
      addToast('Failed to load booking details', 'error');
      navigate('/my-tour-bookings');
    }
  }, [error, addToast, navigate]);

  if (isLoading) {
    return <LoadingState message="Loading booking details..." minHeight="100vh" />;
  }

  if (!booking) {
    return (
      <main className="main">
        <ErrorState
          title="Booking Not Found"
          message="The booking you're looking for doesn't exist or has been removed."
          emoji="🔍"
          actionLabel="Back to Bookings"
          onAction={() => navigate('/my-tour-bookings')}
        />
      </main>
    );
  }

  return (
    <main className="main">
      <div className="booking-details-page">
        <div className="booking-details-container">
          {/* Page Header */}
          <div className="booking-details-header">
            <h1 className="booking-details-header__title">Booking Details</h1>
            <span
              className={`booking-status booking-status--${booking.paymentStatus === 'succeeded' ? 'confirmed' : 'pending'}`}
            >
              {booking.paymentStatus === 'succeeded' ? '✓ Paid' : 'Awaiting Payment'}
            </span>
          </div>

          {/* Main Content Grid */}
          <div className="booking-details-content">
            {/* Tour Information Card */}
            <Card className="booking-details-card booking-details-card--tour">
              <div className="booking-card-header">
                <h2 className="booking-card-title">
                  <svg
                    className="booking-card-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                  Tour Information
                </h2>
              </div>
              <div className="booking-card-content">
                {/* Tour Image - Small, inside card */}
                {booking.tour?.imageCover && (
                  <div className="tour-image-small">
                    <Image
                      src={`${IMAGE_URL}/tours/${booking.tour.imageCover}`}
                      alt={booking.tour.name}
                      className="tour-image-small__img"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="booking-info-grid">
                  <div className="booking-info-item">
                    <span className="booking-info-label">Tour Name</span>
                    <span className="booking-info-value">{booking.tour?.name}</span>
                  </div>
                  <div className="booking-info-item">
                    <span className="booking-info-label">Start Date</span>
                    <span className="booking-info-value">
                      {new Date(booking.tour?.startDates?.[0]).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="booking-info-item">
                    <span className="booking-info-label">Duration</span>
                    <span className="booking-info-value">{booking.tour?.duration} days</span>
                  </div>
                  <div className="booking-info-item">
                    <span className="booking-info-label">Difficulty</span>
                    <span
                      className={`booking-difficulty booking-difficulty--${booking.tour?.difficulty?.toLowerCase()}`}
                    >
                      {booking.tour?.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Booking Information Card */}
            <Card className="booking-details-card">
              <div className="booking-card-header">
                <h2 className="booking-card-title">
                  <svg
                    className="booking-card-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.3-1.54c-.4-.5-1.12-.5-1.52 0-.4.5-.4 1.28 0 1.78l2.04 2.41c.4.5 1.12.5 1.52 0l3.97-5.05c.4-.5.4-1.28 0-1.78-.4-.49-1.12-.49-1.52 0z" />
                  </svg>
                  Booking Information
                </h2>
              </div>
              <div className="booking-card-content">
                <div className="booking-info-grid">
                  <div className="booking-info-item">
                    <span className="booking-info-label">Booking ID</span>
                    <span className="booking-info-value booking-info-value--monospace">
                      {booking._id}
                    </span>
                  </div>
                  <div className="booking-info-item">
                    <span className="booking-info-label">Participants</span>
                    <span className="booking-info-value">{booking.participants || 1}</span>
                  </div>
                  <div className="booking-info-item">
                    <span className="booking-info-label">Total Price</span>
                    <span className="booking-info-value booking-info-value--price">
                      ${booking.price}
                    </span>
                  </div>
                  <div className="booking-info-item">
                    <span className="booking-info-label">Booked On</span>
                    <span className="booking-info-value">
                      {new Date(booking.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Footer */}
          <div className="booking-details-footer">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/my-tour-bookings')}
              className="booking-details-footer__button"
            >
              ← Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
