import { memo } from 'react';
import './FilterPanel.css';

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
  }) => {
    return (
      <div className="filter-panel">
        <div className="filter-panel__container">
          {/* SEARCH INPUT */}
          {showSearch && (
            <div className="filter-panel__item">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="filter-panel__input"
              />
            </div>
          )}

          {/* DIFFICULTY FILTER */}
          {filters.length > 0 && (
            <div className="filter-panel__item">
              <select
                value={activeFilter}
                onChange={(e) => onFilterChange?.(e.target.value)}
                className="filter-panel__select filter-panel__select--medium"
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
            <div className="filter-panel__item">
              <select
                value={activeSort}
                onChange={(e) => onSortChange?.(e.target.value)}
                className="filter-panel__select"
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
