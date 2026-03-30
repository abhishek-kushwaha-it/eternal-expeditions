import { BookingCard } from '../components';
import { LoadingState, Button, ErrorState } from '../core-components';
import { useMyBookings } from '../hooks/useQueries';
import './BookingListPage.css';

/**
 * BookingListPage (My Tour Bookings)
 * Lists all user's tour bookings with filtering
 * RESTful: GET /bookings/my-bookings
 */
export default function BookingListPage() {
  const { data: bookings = [], isLoading, error } = useMyBookings();

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
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
          </div>

          {/* Bookings List or Empty State */}
          {bookings.length > 0 ? (
            <div className="bookings-list-content">
              <div className="bookings-list-grid">
                {bookings.map((booking, index) => (
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
