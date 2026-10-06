import { Card, LoadingState, ErrorState } from '../core-components';
import { useTourStats } from '../hooks/useQueries';
import styles from './TourStatsPage.module.css';

const DIFFICULTY_COLORS = {
  EASY: { icon: '🟢', color: '#27ae60', bgColor: '#d5f4e6' },
  MEDIUM: { icon: '🟡', color: '#f39c12', bgColor: '#fef5e7' },
  DIFFICULT: { icon: '🔴', color: '#e74c3c', bgColor: '#fadbd8' },
};

export default function TourStatsPage() {
  const { data: response = {}, isLoading, error } = useTourStats();
  const stats = response?.stats || [];

  if (isLoading) {
    return (
      <LoadingState
        message="Loading tour statistics..."
        minHeight="100vh"
        className={styles['tour-stats-root']}
      />
    );
  }

  if (error) {
    return (
      <main className={`main ${styles['tour-stats-root']}`}>
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
    totalRatings > 0
      ? (stats.reduce((sum, item) => sum + item.avgRating * item.numRatings, 0) / totalRatings).toFixed(
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
    <main className={`main ${styles['tour-stats-root']}`}>
      <div className={styles['stats-container']}>
        <div className={styles['stats-header']}>
          <h1 className={styles['stats-title']}>📊 Tour Statistics Dashboard</h1>
          <p className={styles['stats-subtitle']}>Real-time analytics grouped by difficulty level</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className={styles['summary-cards']}>
          <Card className={`${styles['stat-card']} ${styles['stat-card--primary']}`}>
            <div className={styles['stat-card__header']}>
              <div className={styles['stat-card__icon']}>🏔️</div>
              <h3 className={styles['stat-card__title']}>Total Tours</h3>
            </div>
            <div className={styles['stat-card__value']}>{totalTours}</div>
            <p className={styles['stat-card__label']}>across all difficulty levels</p>
          </Card>

          <Card className={`${styles['stat-card']} ${styles['stat-card--success']}`}>
            <div className={styles['stat-card__header']}>
              <div className={styles['stat-card__icon']}>⭐</div>
              <h3 className={styles['stat-card__title']}>Avg Rating</h3>
            </div>
            <div className={styles['stat-card__value']}>{overallAvgRating}</div>
            <p className={styles['stat-card__label']}>from {totalRatings} reviews</p>
          </Card>

          <Card className={`${styles['stat-card']} ${styles['stat-card--info']}`}>
            <div className={styles['stat-card__header']}>
              <div className={styles['stat-card__icon']}>💵</div>
              <h3 className={styles['stat-card__title']}>Avg Price</h3>
            </div>
            <div className={styles['stat-card__value']}>${overallAvgPrice}</div>
            <p className={styles['stat-card__label']}>average tour price</p>
          </Card>

          <Card className={`${styles['stat-card']} ${styles['stat-card--warning']}`}>
            <div className={styles['stat-card__header']}>
              <div className={styles['stat-card__icon']}>📝</div>
              <h3 className={styles['stat-card__title']}>Total Reviews</h3>
            </div>
            <div className={styles['stat-card__value']}>{totalRatings}</div>
            <p className={styles['stat-card__label']}>customer ratings</p>
          </Card>
        </div>

        {/* DIFFICULTY-BASED STATS */}
        <div className={styles['difficulty-stats']}>
          <h2 className={styles['difficulty-stats__title']}>Statistics by Difficulty Level</h2>

          <div className={styles['difficulty-cards']}>
            {stats.length === 0 ? (
              <div className={styles['empty-state']}>
                <p>No statistics available</p>
              </div>
            ) : (
              stats.map((item) => {
                const diffConfig = DIFFICULTY_COLORS[item._id] || DIFFICULTY_COLORS.MEDIUM;
                const minMaxDiff = item.maxPrice - item.minPrice;

                return (
                  <Card
                    key={item._id}
                    className={styles['difficulty-card']}
                    style={{ borderLeft: `4px solid ${diffConfig.color}` }}
                  >
                    <div
                      className={styles['difficulty-card__header']}
                      style={{ borderBottomColor: diffConfig.color }}
                    >
                      <div
                        className={styles['difficulty-badge']}
                        style={{
                          backgroundColor: diffConfig.bgColor,
                          color: diffConfig.color,
                        }}
                      >
                        {diffConfig.icon} {item._id}
                      </div>
                    </div>

                    <div className={styles['difficulty-card__content']}>
                      {/* Tours & Reviews */}
                      <div className={styles['stats-row']}>
                        <div className={styles['stat-item']}>
                          <div className={styles['stat-item__label']}>Number of Tours</div>
                          <div className={styles['stat-item__value']}>{item.numTours}</div>
                        </div>
                        <div className={styles['stat-item']}>
                          <div className={styles['stat-item__label']}>Total Reviews</div>
                          <div className={styles['stat-item__value']}>{item.numRatings}</div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className={styles['stats-row']}>
                        <div className={`${styles['stat-item']} ${styles['full-width']}`}>
                          <div className={styles['stat-item__label']}>Average Rating</div>
                          <div className={`${styles['stat-item__value']} ${styles.rating}`}>
                            {item.avgRating.toFixed(2)}{' '}
                            <span className={styles['rating-star']}>⭐</span>
                          </div>
                          <div className={styles['rating-bar']}>
                            <div
                              className={styles['rating-bar__fill']}
                              style={{
                                width: `${(item.avgRating / 5) * 100}%`,
                                backgroundColor: diffConfig.color,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Price Statistics */}
                      <div className={styles['stats-section']}>
                        <h4 className={styles['stats-section__title']}>Pricing</h4>
                        <div className={styles['stats-row']}>
                          <div className={styles['stat-item']}>
                            <div className={styles['stat-item__label']}>Average</div>
                            <div
                              className={`${styles['stat-item__value']} ${styles.price}`}
                            >
                              ${item.avgPrice.toFixed(0)}
                            </div>
                          </div>
                          <div className={styles['stat-item']}>
                            <div className={styles['stat-item__label']}>Minimum</div>
                            <div
                              className={`${styles['stat-item__value']} ${styles.price} ${styles['price--min']}`}
                            >
                              ${item.minPrice}
                            </div>
                          </div>
                          <div className={styles['stat-item']}>
                            <div className={styles['stat-item__label']}>Maximum</div>
                            <div
                              className={`${styles['stat-item__value']} ${styles.price} ${styles['price--max']}`}
                            >
                              ${item.maxPrice}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price Range Visualization */}
                      <div className={styles['price-range']}>
                        <div className={styles['price-range__label']}>
                          Range: ${item.minPrice} - ${item.maxPrice}
                        </div>
                        <div className={styles['price-range__bar']}>
                          <div
                            className={styles['price-range__segment']}
                            style={{
                              width: `${minMaxDiff > 0 ? ((item.avgPrice - item.minPrice) / (item.maxPrice - item.minPrice)) * 100 : 50}%`,
                              backgroundColor: diffConfig.color,
                            }}
                          ></div>
                        </div>
                        <div className={styles['price-range__value']}>
                          Avg: ${item.avgPrice.toFixed(0)}
                        </div>
                      </div>

                      {/* Insights */}
                      <div className={styles['stat-insight']}>
                        <div className={styles['insight-item']}>
                          <span className={styles['insight-icon']}>📊</span>
                          <span className={styles['insight-text']}>
                            Average of <strong>${item.avgPrice.toFixed(0)}</strong> per{' '}
                            {item._id.toLowerCase()} tour
                          </span>
                        </div>
                        <div className={styles['insight-item']}>
                          <span className={styles['insight-icon']}>📈</span>
                          <span className={styles['insight-text']}>
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
        <div className={styles['info-section']}>
          <Card>
            <div className={styles['info-section__content']}>
              <h3 className={styles['info-section__title']}>📈 About These Statistics</h3>
              <p className={styles['info-section__text']}>
                These statistics are automatically calculated from all tours grouped by difficulty
                level. The data includes aggregated metrics such as average ratings, pricing
                information, and review counts. This helps identify performance patterns across
                different tour difficulty categories.
              </p>
              <ul className={styles['info-section__list']}>
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
