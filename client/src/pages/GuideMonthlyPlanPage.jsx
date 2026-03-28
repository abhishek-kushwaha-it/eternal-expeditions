import { useState, useMemo } from 'react';
import { Card, LoadingState, ErrorState } from '../core-components';
import { useMonthlyPlan } from '../hooks/useQueries';
import './GuideMonthlyPlanPage.css';

/**
 * GuideMonthlyPlanPage
 * Displays monthly tour statistics
 * RESTful: GET /tours/monthly-plan/:year
 */
export default function GuideMonthlyPlanPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: monthlyPlan = [], isLoading, error } = useMonthlyPlan(selectedYear);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }, []);

  if (error) {
    return (
      <main className="main">
        <ErrorState
          title="Failed to Load Monthly Plan"
          message="Failed to load monthly plan data. Please try again."
          emoji="⚠️"
          showAction={false}
        />
      </main>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading monthly plan..." minHeight="100vh" />;
  }

  return (
    <main className="main">
      <div className="monthly-plan-container">
        <h1>Monthly Tour Plan</h1>

        <div className="year-selector">
          <label>Select Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {monthlyPlan && monthlyPlan.length > 0 ? (
          <div className="monthly-plan-grid">
            {monthlyPlan.map((monthData) => {
              const monthName = new Date(2024, monthData.month - 1).toLocaleString('en-US', {
                month: 'long',
              });
              return (
                <Card
                  key={monthData.month}
                  className="month-card"
                  header={
                    <div className="month-card__header">
                      <h3 className="month-card__month">{monthName}</h3>
                      <span className="month-card__count">{monthData.numTourStarts}</span>
                    </div>
                  }
                >
                  <div className="month-card__body">
                    <div className="month-card__tours-label">Tours Starting:</div>
                    <ul className="month-card__tours-list">
                      {monthData.tours && monthData.tours.length > 0 ? (
                        monthData.tours.map((tourName, idx) => (
                          <li key={idx} className="month-card__tour-item">
                            <span className="tour-bullet">•</span>
                            {tourName}
                          </li>
                        ))
                      ) : (
                        <li className="month-card__tour-item month-card__tour-item--empty">
                          No tours scheduled
                        </li>
                      )}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No tour data available for {selectedYear}</p>
          </div>
        )}

        {monthlyPlan && monthlyPlan.length > 0 && (
          <div className="plan-summary">
            <div className="summary-stat">
              <span>Total Tours Started:</span>
              <span className="stat-value">
                {monthlyPlan.reduce((sum, m) => sum + m.numTourStarts, 0)}
              </span>
            </div>
            <div className="summary-stat">
              <span>Total Months Active:</span>
              <span className="stat-value">{monthlyPlan.length}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
