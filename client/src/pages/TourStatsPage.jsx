import { Card, LoadingState, ErrorState } from '../core-components';
import { useTourStats } from '../hooks/useQueries';
import './TourStatsPage.css';

const DIFFICULTY_COLORS = {
  EASY: { icon: '🟢', color: '#27ae60', bgColor: '#d5f4e6' },
  MEDIUM: { icon: '🟡', color: '#f39c12', bgColor: '#fef5e7' },
  DIFFICULT: { icon: '🔴', color: '#e74c3c', bgColor: '#fadbd8' },
};

export default function TourStatsPage() {
  const { data: response = {}, isLoading, error } = useTourStats();
  const stats = response?.stats || [];

  if (isLoading) {
    return <LoadingState message="Loading tour statistics..." minHeight="100vh" />;
  }

  if (error) {
    return (
      <main className="main">
        <ErrorState
          title="Failed to Load Statistics"
          message={error?.message || 'An error occurred while loading tour statistics.'}
          emoji="⚠️"
          showAction={false}
        />
      </main>
    );
  }

  // Calculate overall stats
  const totalTours = stats.reduce((sum, item) => sum + item.numTours, 0);
  const totalRatings = stats.reduce((sum, item) => sum + item.numRatings, 0);
  const overallAvgRating =
    stats.length > 0
      ? (stats.reduce((sum, item) => sum + item.avgRating * item.numTours, 0) / totalTours).toFixed(
          1
        )
      : '0.0';
  const overallAvgPrice =
    stats.length > 0
      ? (stats.reduce((sum, item) => sum + item.avgPrice * item.numTours, 0) / totalTours).toFixed(
          0
        )
      : '0';

  return (
    <main className="main">
      <div className="stats-container">
        <div className="stats-header">
          <h1 className="stats-title">📊 Tour Statistics Dashboard</h1>
          <p className="stats-subtitle">Real-time analytics grouped by difficulty level</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="summary-cards">
          <Card className="stat-card stat-card--primary">
            <div className="stat-card__header">
              <div className="stat-card__icon">🏔️</div>
              <h3 className="stat-card__title">Total Tours</h3>
            </div>
            <div className="stat-card__value">{totalTours}</div>
            <p className="stat-card__label">across all difficulty levels</p>
          </Card>

          <Card className="stat-card stat-card--success">
            <div className="stat-card__header">
              <div className="stat-card__icon">⭐</div>
              <h3 className="stat-card__title">Avg Rating</h3>
            </div>
            <div className="stat-card__value">{overallAvgRating}</div>
            <p className="stat-card__label">from {totalRatings} reviews</p>
          </Card>

          <Card className="stat-card stat-card--info">
            <div className="stat-card__header">
              <div className="stat-card__icon">💵</div>
              <h3 className="stat-card__title">Avg Price</h3>
            </div>
            <div className="stat-card__value">${overallAvgPrice}</div>
            <p className="stat-card__label">average tour price</p>
          </Card>

          <Card className="stat-card stat-card--warning">
            <div className="stat-card__header">
              <div className="stat-card__icon">📝</div>
              <h3 className="stat-card__title">Total Reviews</h3>
            </div>
            <div className="stat-card__value">{totalRatings}</div>
            <p className="stat-card__label">customer ratings</p>
          </Card>
        </div>

        {/* DIFFICULTY-BASED STATS */}
        <div className="difficulty-stats">
          <h2 className="difficulty-stats__title">Statistics by Difficulty Level</h2>

          <div className="difficulty-cards">
            {stats.length === 0 ? (
              <div className="empty-state">
                <p>No statistics available</p>
              </div>
            ) : (
              stats.map((item) => {
                const diffConfig = DIFFICULTY_COLORS[item._id] || DIFFICULTY_COLORS.MEDIUM;
                const minMaxDiff = item.maxPrice - item.minPrice;

                return (
                  <Card
                    key={item._id}
                    className="difficulty-card"
                    style={{ borderLeft: `4px solid ${diffConfig.color}` }}
                  >
                    <div
                      className="difficulty-card__header"
                      style={{ borderBottomColor: diffConfig.color }}
                    >
                      <div
                        className="difficulty-badge"
                        style={{
                          backgroundColor: diffConfig.bgColor,
                          color: diffConfig.color,
                        }}
                      >
                        {diffConfig.icon} {item._id}
                      </div>
                    </div>

                    <div className="difficulty-card__content">
                      {/* Tours & Reviews */}
                      <div className="stats-row">
                        <div className="stat-item">
                          <div className="stat-item__label">Number of Tours</div>
                          <div className="stat-item__value">{item.numTours}</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-item__label">Total Reviews</div>
                          <div className="stat-item__value">{item.numRatings}</div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="stats-row">
                        <div className="stat-item full-width">
                          <div className="stat-item__label">Average Rating</div>
                          <div className="stat-item__value rating">
                            {item.avgRating.toFixed(2)} <span className="rating-star">⭐</span>
                          </div>
                          <div className="rating-bar">
                            <div
                              className="rating-bar__fill"
                              style={{
                                width: `${(item.avgRating / 5) * 100}%`,
                                backgroundColor: diffConfig.color,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Price Statistics */}
                      <div className="stats-section">
                        <h4 className="stats-section__title">Pricing</h4>
                        <div className="stats-row">
                          <div className="stat-item">
                            <div className="stat-item__label">Average</div>
                            <div className="stat-item__value price">
                              ${item.avgPrice.toFixed(0)}
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-item__label">Minimum</div>
                            <div className="stat-item__value price price--min">
                              ${item.minPrice}
                            </div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-item__label">Maximum</div>
                            <div className="stat-item__value price price--max">
                              ${item.maxPrice}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price Range Visualization */}
                      <div className="price-range">
                        <div className="price-range__label">
                          Range: ${item.minPrice} - ${item.maxPrice}
                        </div>
                        <div className="price-range__bar">
                          <div
                            className="price-range__segment"
                            style={{
                              width: `${minMaxDiff > 0 ? ((item.avgPrice - item.minPrice) / (item.maxPrice - item.minPrice)) * 100 : 50}%`,
                              backgroundColor: diffConfig.color,
                            }}
                          ></div>
                        </div>
                        <div className="price-range__value">Avg: ${item.avgPrice.toFixed(0)}</div>
                      </div>

                      {/* Insights */}
                      <div className="stat-insight">
                        <div className="insight-item">
                          <span className="insight-icon">📊</span>
                          <span className="insight-text">
                            Average of <strong>${item.avgPrice.toFixed(0)}</strong> per{' '}
                            {item._id.toLowerCase()} tour
                          </span>
                        </div>
                        <div className="insight-item">
                          <span className="insight-icon">📈</span>
                          <span className="insight-text">
                            <strong>{(item.numRatings / item.numTours).toFixed(1)}</strong> reviews
                            per tour
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="info-section">
          <Card>
            <div className="info-section__content">
              <h3 className="info-section__title">📈 About These Statistics</h3>
              <p className="info-section__text">
                These statistics are automatically calculated from all tours grouped by difficulty
                level. The data includes aggregated metrics such as average ratings, pricing
                information, and review counts. This helps identify performance patterns across
                different tour difficulty categories.
              </p>
              <ul className="info-section__list">
                <li>
                  🟢 <strong>Easy Tours:</strong> Suitable for beginners and families
                </li>
                <li>
                  🟡 <strong>Medium Tours:</strong> For experienced hikers
                </li>
                <li>
                  🔴 <strong>Difficult Tours:</strong> For advanced adventurers
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
