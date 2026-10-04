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
  }) => {
    return (
      <div className={`${styles['filter-panel']} ${className}`.trim()}>
        <div className={styles['filter-panel__container']}>
          {/* SEARCH INPUT */}
          {showSearch && (
            <div className={styles['filter-panel__item']}>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className={styles['filter-panel__input']}
              />
            </div>
          )}

          {/* DIFFICULTY FILTER */}
          {filters.length > 0 && (
            <div className={styles['filter-panel__item']}>
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
            </div>
          )}

          {/* SORT OPTION */}
          {sorts.length > 0 && (
            <div className={styles['filter-panel__item']}>
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
            </div>
          )}
        </div>
      </div>
    );
  }
);

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
