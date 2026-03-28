import { Link, useNavigate } from 'react-router-dom';
import TourCard from '../components/TourCard';
import { LoadingState, ErrorState, Button } from '../core-components';
import { useTopCheapTours } from '../hooks/useQueries';
import './TopCheapToursPage.css';

export default function TopCheapToursPage() {
  const { data: cheapTours = [], isLoading, error } = useTopCheapTours();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingState message="Loading budget-friendly tours..." minHeight="60vh" />;
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
    <main className="main top-cheap-page">
      {/* HEADER SECTION */}
      <section className="top-cheap-header-section">
        <div className="top-cheap-header-container">
          <div className="top-cheap-header-content">
            <h1 className="top-cheap-main-title">💰 Top 5 Budget-Friendly Tours</h1>
            <div className="top-cheap-badge">Best Value Picks</div>
          </div>
          <p className="top-cheap-description">
            Discover our most affordable and incredible tour experiences
          </p>
        </div>
      </section>

      {/* TOURS SECTION */}
      <div className="top-cheap-content">
        {cheapTours && cheapTours.length > 0 ? (
          <>
            <div className="top-cheap-tours-grid">
              {cheapTours.map((tour) => (
                <TourCard key={tour._id} tour={tour} />
              ))}
            </div>
            <div className="top-cheap-footer-section">
              <p className="top-cheap-footer-text">Want to see all tours?</p>
              <Button variant="primary" size="md" onClick={() => navigate('/')}>
                View All Tours
              </Button>
            </div>
          </>
        ) : (
          <div className="top-cheap-empty-state">
            <p className="top-cheap-empty-text">
              No budget-friendly tours available at the moment.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
