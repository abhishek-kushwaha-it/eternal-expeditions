import { memo } from 'react';
import styles from './FilterPanel.module.css';

/**
 * FilterPanel Component
 * Simple, compact horizontal filter layout
 * Multiple small input boxes for better UX
 */
const FilterPanel = memo(
  ({
    filters = [],
    activeFilter,
    onFilterChange,
    sorts = [],
    activeSort,
    onSortChange,
    searchTerm,
    onSearchChange,
    showSearch = true,
    searchPlaceholder = 'Search tours...',
    className = '',
    variant = 'default',
  }) => {
    return (
      <div
        className={`${styles['filter-panel']} ${
          variant === 'tours' ? styles['filter-panel--tours'] : ''
        } ${className}`.trim()}
      >
        {variant === 'tours' && (
          <div className={styles['filter-panel__heading']}>
            <h2>Refine tours</h2>
          </div>
        )}
        <div className={styles['filter-panel__container']}>
          {/* SEARCH INPUT */}
          {showSearch && (
            <div className={styles['filter-panel__item']}>
              <label className={styles['filter-panel__label']}>
                <span>Search tours</span>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className={styles['filter-panel__input']}
                />
              </label>
            </div>
          )}

          {/* DIFFICULTY FILTER */}
          {filters.length > 0 && (
            <div className={styles['filter-panel__item']}>
              <label className={styles['filter-panel__label']}>
                <span>Difficulty</span>
                <select
                  value={activeFilter}
                  onChange={(e) => onFilterChange?.(e.target.value)}
                  className={`${styles['filter-panel__select']} ${styles['filter-panel__select--medium']}`}
                >
                  {filters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label} ({filter.count})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* SORT OPTION */}
          {sorts.length > 0 && (
            <div className={styles['filter-panel__item']}>
              <label className={styles['filter-panel__label']}>
                <span>Sort by</span>
                <select
                  value={activeSort}
                  onChange={(e) => onSortChange?.(e.target.value)}
                  className={styles['filter-panel__select']}
                >
                  {sorts.map((sort) => (
                    <option key={sort.value} value={sort.value}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
