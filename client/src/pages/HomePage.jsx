import { useNavigate } from 'react-router-dom';
import TourCard from '../components/TourCard';
import { LoadingState, ErrorState, Button } from '../core-components';
import { useTours } from '../hooks/useQueries';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { data: tours = [], isLoading, error } = useTours();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingState message="Loading amazing tours..." minHeight="60vh" />;
  }

  if (error) {
    return (
      <main className={`main ${styles['home-page-root']}`}>
        <ErrorState
          title="Failed to Load Tours"
          message={error?.message || 'An error occurred while loading tours.'}
          emoji="🔥"
          showAction={false}
        />
      </main>
    );
  }

  return (
    <main className={`main ${styles['home-page-root']}`}>
      {/* PROMO SECTION - TOP 5 CHEAP TOURS */}
      <section
        className={`${styles['overview-section']} ${styles['overview-promo']}`}
      >
        <div className={styles['overview-header']}>
          <div className={styles['overview-header-top']}>
            <h2 className={styles['overview-heading']}>💰 Looking for Budget-Friendly Tours?</h2>
            <div className={styles['overview-badge']}>Special Offer</div>
          </div>
          <p className={styles['overview-description']}>
            Check out our top 5 most affordable and amazing tour experiences with all the details
            you need to decide!
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/top-5-cheap')}>
            View Top 5 Budget Picks
          </Button>
        </div>
      </section>

      {/* ALL TOURS SECTION */}
      <div className={styles['overview-content']}>
        <h2 className={styles['overview-title']}>🌍 All Tours</h2>
        <div className={styles['card-container']}>
          {tours.length > 0 ? (
            tours.map((tour) => <TourCard key={tour.id} tour={tour} />)
          ) : (
            <div className={styles['empty-state']}>
              <p className={styles['empty-state-text']}>No tours available at the moment</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
