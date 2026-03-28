import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewCard from '../components/ReviewCard';
import { LoadingState, ErrorState, Button, ConfirmDialog, Image } from '../core-components';
import { useTour, useBookTourMutation } from '../hooks/useQueries';
import { displayMap } from '../utils/mapbox';
import { useToasts } from '../store/hooks';
import { useAuth } from '../hooks/useAuth';
import { IMAGE_URL } from '../utils/api';
import './TourPage.css';

export default function TourPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: tour, isLoading, error } = useTour(id);
  const bookTourMutation = useBookTourMutation();
  const mapContainer = useRef(null);
  const { addToast } = useToasts();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    if (tour && mapContainer.current) {
      displayMap(mapContainer.current, tour.locations);
    }
  }, [tour]);

  const handleBookTour = () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    handleConfirmBookTour();
  };

  const handleConfirmBookTour = async () => {
    if (!tour) return;
    try {
      const response = await bookTourMutation.mutateAsync(tour._id);
      // Redirect to Stripe checkout
      if (response.data.session.url) {
        window.location.href = response.data.session.url;
      }
    } catch {
      addToast('Error booking tour! Try again.', 'error');
    }
    setShowLoginDialog(false);
  };

  const handleLoginNavigate = () => {
    setShowLoginDialog(false);
    navigate('/login');
  };

  if (isLoading) {
    return <LoadingState message="Loading tour details..." minHeight="500px" />;
  }

  if (error || !tour) {
    return (
      <main className="main">
        <ErrorState
          title="Tour Not Found"
          message={error?.message || 'The tour you are looking for does not exist.'}
          emoji="🔥"
          showAction={false}
        />
      </main>
    );
  }

  const startDate = new Date(tour.startDates[0]).toLocaleString('en-us', {
    month: 'long',
    year: 'numeric',
  });

  const guides = tour.guides || [];
  const reviews = tour.reviews || [];
  const descriptions = tour.description?.split('\n') || [];

  return (
    <main className="main">
      {/* SECTION HEADER */}
      <section className="section-header">
        <div className="header__hero">
          <div className="header__hero-overlay">&nbsp;</div>
          <Image
            className="header__hero-img"
            src={`${IMAGE_URL}/tours/${tour.imageCover}`}
            alt={`${tour.name}`}
          />
        </div>

        <div className="heading-box">
          <h1 className="heading-primary">
            <span>{tour.name} tour</span>
          </h1>
          <div className="heading-box__group">
            <div className="heading-box__detail">
              <svg className="heading-box__icon">
                <use xlinkHref="/img/icons.svg#icon-clock"></use>
              </svg>
              <span className="heading-box__text">{tour.duration} days</span>
            </div>
            <div className="heading-box__detail">
              <svg className="heading-box__icon">
                <use xlinkHref="/img/icons.svg#icon-map-pin"></use>
              </svg>
              <span className="heading-box__text">{tour.startLocation.description}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DESCRIPTION */}
      <section className="section-description">
        <div>
          <div className="overview-box">
            <div>
              <div className="overview-box__group">
                <h2 className="heading-secondary ma-bt-lg">Quick facts</h2>

                <div className="overview-box__detail">
                  <svg className="overview-box__icon">
                    <use xlinkHref="/img/icons.svg#icon-calendar"></use>
                  </svg>
                  <span className="overview-box__label">Next date</span>
                  <span className="overview-box__text">{startDate}</span>
                </div>

                <div className="overview-box__detail">
                  <svg className="overview-box__icon">
                    <use xlinkHref="/img/icons.svg#icon-trending-up"></use>
                  </svg>
                  <span className="overview-box__label">Difficulty</span>
                  <span className="overview-box__text">{tour.difficulty}</span>
                </div>

                <div className="overview-box__detail">
                  <svg className="overview-box__icon">
                    <use xlinkHref="/img/icons.svg#icon-user"></use>
                  </svg>
                  <span className="overview-box__label">Participants</span>
                  <span className="overview-box__text">{tour.maxGroupSize} people</span>
                </div>

                <div className="overview-box__detail">
                  <svg className="overview-box__icon">
                    <use xlinkHref="/img/icons.svg#icon-star"></use>
                  </svg>
                  <span className="overview-box__label">Rating</span>
                  <span className="overview-box__text">{tour.ratingsAverage} / 5</span>
                </div>
              </div>

              <div className="overview-box__group">
                <h2 className="heading-secondary ma-bt-lg">Your tour guides</h2>

                {guides.map((guide) => (
                  <div key={guide._id} className="overview-box__detail">
                    <Image
                      className="overview-box__img"
                      src={`${IMAGE_URL}/users/${guide.photo}`}
                      alt={`${guide.name}`}
                      size="sm"
                    />
                    <div>
                      <span className="overview-box__label">Guide</span>
                      <span className="overview-box__text">{guide.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="description-box">
          <h2 className="heading-secondary ma-bt-lg">About {tour.name} tour</h2>
          {descriptions.map((p, index) => (
            <p key={index} className="description__text">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* SECTION PICTURES */}
      <section className="section-pictures">
        {tour.images?.map((img, i) => (
          <div key={i} className="picture-box">
            <Image
              className={`picture-box__img picture-box__img--${i + 1}`}
              src={`${IMAGE_URL}/tours/${img}`}
              alt={`${tour.name} - Image ${i + 1}`}
              loading="lazy"
            />
          </div>
        ))}
      </section>

      {/* SECTION MAP */}
      <section className="section-map">
        <div ref={mapContainer} id="map"></div>
      </section>

      {/* SECTION REVIEWS */}
      {reviews.length > 0 && (
        <section className="section-reviews">
          <div className="reviews">
            {reviews.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                isOwnReview={user?._id === review.user?._id}
                canManage={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION CTA */}
      <section className="section-cta">
        <div className="cta">
          <div className="cta__img cta__img--logo">
            <Image src="/img/logo.png" alt="ashoka logo" />
          </div>
          {tour.images?.length >= 3 && (
            <>
              <Image
                className="cta__img cta__img--1"
                src={`${IMAGE_URL}/tours/${tour.images[1]}`}
                alt="Tour promotional image 1"
                loading="lazy"
              />
              <Image
                className="cta__img cta__img--2"
                src={`${IMAGE_URL}/tours/${tour.images[2]}`}
                alt="Tour promotional image 2"
                loading="lazy"
              />
            </>
          )}
          <div className="cta__content">
            <h2 className="heading-secondary">What are you waiting for?</h2>
            <p className="cta__text">
              {tour.duration} days. 1 adventure. Infinite memories. Make it yours today!
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleBookTour}
              disabled={bookTourMutation.isPending}
            >
              {bookTourMutation.isPending ? 'Processing...' : 'Book tour now!'}
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={showLoginDialog}
        title="Authentication Required"
        message="You need to be logged in to book a tour. Please log in to your account to proceed."
        confirmText="Go to Login"
        cancelText="Cancel"
        isDangerous={false}
        isLoading={bookTourMutation.isPending}
        onConfirm={handleLoginNavigate}
        onCancel={() => setShowLoginDialog(false)}
      />
    </main>
  );
}
