import { useNavigate } from 'react-router-dom';
import TourCard from '../components/TourCard';
import { LoadingState, ErrorState, Button } from '../core-components';
import { useTours } from '../hooks/useQueries';
import './HomePage.css';

export default function HomePage() {
  const { data: tours = [], isLoading, error } = useTours();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingState message="Loading amazing tours..." minHeight="60vh" />;
  }

  if (error) {
    return (
      <main className="main">
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
    <main className="main">
      {/* PROMO SECTION - TOP 5 CHEAP TOURS */}
      <section className="overview-section overview-promo">
        <div className="overview-header">
          <div className="overview-header-top">
            <h2 className="overview-heading">💰 Looking for Budget-Friendly Tours?</h2>
            <div className="overview-badge">Special Offer</div>
          </div>
          <p className="overview-description">
            Check out our top 5 most affordable and amazing tour experiences with all the details
            you need to decide!
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/top-5-cheap')}>
            View Top 5 Budget Picks
          </Button>
        </div>
      </section>

      {/* ALL TOURS SECTION */}
      <div className="overview-content">
        <h2 className="overview-title">🌍 All Tours</h2>
        <div className="card-container">
          {tours.length > 0 ? (
            tours.map((tour) => <TourCard key={tour.id} tour={tour} />)
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No tours available at the moment</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
