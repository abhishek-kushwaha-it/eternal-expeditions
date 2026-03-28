import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookingCard } from '../components';
import { LoadingState, Button, ErrorState } from '../core-components';
import { useMyBookings, useCreateBookingMutation } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import './BookingListPage.css';

/**
 * BookingListPage (My Tour Bookings)
 * Lists all user's tour bookings with filtering
 * RESTful: GET /bookings/my-bookings
 */
export default function BookingListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingProcessedRef = useRef(false);
  const { data: bookings = [], isLoading, error } = useMyBookings();
  const { addToast } = useToasts();
  const createBookingMutation = useCreateBookingMutation();

  // Handle Stripe callback - process pending booking
  useEffect(() => {
    const processPendingBooking = async () => {
      // Check if user is returning from Stripe checkout
      const tourId = searchParams.get('tour');
      const userId = searchParams.get('user');
      const price = searchParams.get('price');

      if (tourId && userId && price && !bookingProcessedRef.current) {
        bookingProcessedRef.current = true;

        try {
          // Create the booking with the mutation
          await createBookingMutation.mutateAsync({
            tourId,
            userId,
            price: parseFloat(price),
          });

          // Clean up URL and show success message
          navigate('/my-tour-bookings', { replace: true });
          addToast('Booking completed successfully!', 'success');
        } catch {
          addToast('Failed to complete booking', 'error');
          bookingProcessedRef.current = false;
        }
      }
    };

    processPendingBooking();
  }, [searchParams, navigate, addToast, createBookingMutation]);

  const filteredBookings = bookings;

  if (error) {
    return (
      <main className="main">
        <ErrorState
          title="Failed to Load Bookings"
          message="Failed to load your bookings. Please try again."
          emoji="⚠️"
          showAction={false}
        />
      </main>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading your bookings..." minHeight="100vh" />;
  }

  return (
    <main className="main">
      <div className="bookings-list-page">
        <div className="bookings-list-container">
          {/* Page Header */}
          <div className="bookings-list-header">
            <div className="bookings-list-header__content">
              <h1 className="bookings-list-header__title">My Tour Bookings</h1>
              <span className="bookings-list-header__count">
                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
          </div>

          {/* Bookings List or Empty State */}
          {filteredBookings.length > 0 ? (
            <div className="bookings-list-content">
              <div className="bookings-list-grid">
                {filteredBookings.map((booking, index) => (
                  <div
                    key={booking._id}
                    className="bookings-list-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <BookingCard booking={booking} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bookings-list-empty">
              <div className="bookings-empty-content">
                <span className="bookings-empty-icon">📭</span>
                <h2 className="bookings-empty-title">No Bookings Yet</h2>
                <p className="bookings-empty-message">
                  You haven't booked any tours yet. Start your adventure today!
                </p>
                <Button
                  as="a"
                  href="/"
                  variant="primary"
                  size="md"
                  className="bookings-empty-button"
                >
                  🌍 Explore Tours
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
