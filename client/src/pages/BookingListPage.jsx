import { BookingCard } from '../components';
import { LoadingState, Button, ErrorState } from '../core-components';
import { useMyBookings } from '../hooks/useQueries';
import styles from './BookingListPage.module.css';

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
      <div className={styles['bookings-list-page']}>
        <div className={styles['bookings-list-container']}>
          {/* Page Header */}
          <div className={styles['bookings-list-header']}>
            <div className={styles['bookings-list-header__content']}>
              <h1 className={styles['bookings-list-header__title']}>My Tour Bookings</h1>
              <span className={styles['bookings-list-header__count']}>
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
          </div>

          {/* Bookings List or Empty State */}
          {bookings.length > 0 ? (
            <div className={styles['bookings-list-content']}>
              <div className={styles['bookings-list-grid']}>
                {bookings.map((booking, index) => (
                  <div
                    key={booking._id}
                    className={styles['bookings-list-item']}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <BookingCard booking={booking} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles['bookings-list-empty']}>
              <div className={styles['bookings-empty-content']}>
                <span className={styles['bookings-empty-icon']}>📭</span>
                <h2 className={styles['bookings-empty-title']}>No Bookings Yet</h2>
                <p className={styles['bookings-empty-message']}>
                  You haven't booked any tours yet. Start your adventure today!
                </p>
                <Button
                  as="a"
                  href="/"
                  variant="primary"
                  size="md"
                  className={styles['bookings-empty-button']}
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
