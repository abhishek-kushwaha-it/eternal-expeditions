import { useState, useMemo } from 'react';
import TourCard from '../components/TourCard';
import FilterPanel from '../components/FilterPanel';
import { LoadingState, ErrorState, Button } from '../core-components';
import { useTours, useToursWithin, useDistances } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import './ToursPage.css';

export default function ToursPage() {
  const { data: tours = [], isLoading, error } = useTours();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('name-asc');

  // Location search states
  const [distance, setDistance] = useState('10');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [unit, setUnit] = useState('mi');
  const [hasLocationSearch, setHasLocationSearch] = useState(false);
  const [searchMode, setSearchMode] = useState('distances'); // 'within' or 'distances'

  const { data: toursWithin = [], isLoading: isSearchingLocation } = useToursWithin(
    hasLocationSearch && searchMode === 'within' ? distance : null,
    hasLocationSearch && searchMode === 'within' ? latitude : null,
    hasLocationSearch && searchMode === 'within' ? longitude : null,
    unit
  );

  const { data: toursByDistance = [], isLoading: isLoadingDistances } = useDistances(
    hasLocationSearch && searchMode === 'distances' ? latitude : null,
    hasLocationSearch && searchMode === 'distances' ? longitude : null,
    unit
  );
  const { addToast } = useToasts();

  // Filter options based on difficulty levels
  const filterOptions = useMemo(() => {
    if (!tours.length) return [];

    const difficulties = new Set(tours.map((t) => t.difficulty));
    const filters = [{ label: 'All', value: 'all', count: tours.length }];

    difficulties.forEach((difficulty) => {
      const count = tours.filter((t) => t.difficulty === difficulty).length;
      filters.push({
        label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        value: difficulty,
        count,
      });
    });

    return filters;
  }, [tours]);

  // Sort options
  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Price (Low to High)', value: 'price-asc' },
    { label: 'Price (High to Low)', value: 'price-desc' },
    { label: 'Duration (Short to Long)', value: 'duration-asc' },
    { label: 'Duration (Long to Short)', value: 'duration-desc' },
    { label: 'Rating (High to Low)', value: 'rating-desc' },
    { label: 'Rating (Low to High)', value: 'rating-asc' },
  ];

  // Handle geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        addToast('Location detected!', 'success');
      },
      () => {
        addToast('Unable to get your location. Please enter coordinates manually.', 'error');
      }
    );
  };

  // Handle location search
  const handleLocationSearch = (e) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      addToast('Please fill in latitude and longitude', 'error');
      return;
    }

    if (searchMode === 'within' && !distance) {
      addToast('Please fill in search radius', 'error');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      addToast('Please enter valid latitude and longitude', 'error');
      return;
    }

    if (lat < -90 || lat > 90) {
      addToast('Latitude must be between -90 and 90', 'error');
      return;
    }

    if (lat < -180 || lng > 180) {
      addToast('Longitude must be between -180 and 180', 'error');
      return;
    }

    // Normalize coordinates and update state (removes any whitespace)
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setHasLocationSearch(true);
  };

  // Apply filters and search
  const filteredAndSortedTours = useMemo(() => {
    // Determine which data to use
    let filtered;
    if (hasLocationSearch && searchMode === 'within') {
      filtered = toursWithin;
    } else if (hasLocationSearch && searchMode === 'distances') {
      filtered = toursByDistance;
    } else {
      filtered = tours;
    }

    // Apply difficulty filter (not for distances mode, as it might have limited results)
    if (!hasLocationSearch && activeFilter !== 'all') {
      filtered = filtered.filter((tour) => tour.difficulty === activeFilter);
    }

    // Apply search filter (search by name and summary)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tour) =>
          tour.name.toLowerCase().includes(term) ||
          (tour.summary && tour.summary.toLowerCase().includes(term))
      );
    }

    // For distances mode, already sorted by distance from API
    // For other modes, apply sorting
    if (hasLocationSearch && searchMode === 'distances') {
      return filtered; // Already sorted by distance from backend
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (activeSort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'duration-asc':
          return a.durationDays - b.durationDays;
        case 'duration-desc':
          return b.durationDays - a.durationDays;
        case 'rating-asc':
          return (a.ratingsAverage || 0) - (b.ratingsAverage || 0);
        case 'rating-desc':
          return (b.ratingsAverage || 0) - (a.ratingsAverage || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    tours,
    toursWithin,
    toursByDistance,
    hasLocationSearch,
    searchMode,
    activeFilter,
    searchTerm,
    activeSort,
  ]);

  if (isLoading) {
    return <LoadingState message="Loading all tours..." minHeight="60vh" />;
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

  const isLoadingResults = isLoading || isSearchingLocation || isLoadingDistances;

  return (
    <main className="main">
      <div className="tours-page">
        <div className="tours-page__header">
          {/* LEFT SECTION - TITLE & SUBTITLE & FILTER */}
          <div className="header__left">
            <h1 className="tours-page__title">🌍 Explore All Tours</h1>
            <p className="tours-page__subtitle">
              Discover our complete collection of amazing adventures
            </p>

            {/* FILTER PANEL - MOVED TO LEFT */}
            {!hasLocationSearch && (
              <FilterPanel
                filters={filterOptions}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                sorts={sortOptions}
                activeSort={activeSort}
                onSortChange={setActiveSort}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="🔍 Search by tour name or description..."
                showSearch={true}
              />
            )}
          </div>

          {/* RIGHT SECTION - LOCATION SEARCH FORM */}
          <div className="header__right">
            <h2 className="header__location-title">📍 Search via Location</h2>

            {/* SEARCH MODE TABS + ACTION BUTTONS */}
            <div className="header__search-controls">
              <Button
                variant={searchMode === 'distances' ? 'primary' : 'outline'}
                size="xs"
                onClick={() => setSearchMode('distances')}
                className="search-mode-tab"
              >
                📏 Distance
              </Button>
              <Button
                variant={searchMode === 'within' ? 'primary' : 'outline'}
                size="xs"
                onClick={() => setSearchMode('within')}
                className="search-mode-tab"
              >
                🎯 Radius
              </Button>

              <Button
                type="button"
                variant="primary"
                size="xs"
                onClick={handleGetCurrentLocation}
                className="action-btn"
              >
                Fetch current location
              </Button>
              <Button
                type="button"
                variant="primary"
                size="xs"
                onClick={handleLocationSearch}
                disabled={isSearchingLocation || isLoadingDistances}
                className="action-btn"
              >
                {isSearchingLocation || isLoadingDistances
                  ? 'Searching...'
                  : searchMode === 'within'
                    ? '🔍 Search'
                    : 'View'}
              </Button>
            </div>

            {/* LOCATION SEARCH FORM */}
            <form
              onSubmit={handleLocationSearch}
              className="tours-page__location-form location-search-form"
            >
              <div className="location-form-grid">
                {searchMode === 'within' && (
                  <div className="form-group">
                    <label className="form-label">
                      Search Radius ({unit === 'mi' ? 'Miles' : 'Kilometers'})
                    </label>
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      min="1"
                      max="1000"
                      placeholder="e.g., 10"
                      className="form-input"
                    />
                    <small className="form-helper">How far to search from your location</small>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Distance Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="form-input"
                  >
                    <option value="mi">Miles (mi)</option>
                    <option value="km">Kilometers (km)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 40.7128 (New York)"
                    step="0.0001"
                    className="form-input"
                  />
                  <small className="form-helper">Vertical position (-90 to 90)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., -74.0060 (New York)"
                    step="0.0001"
                    className="form-input"
                  />
                  <small className="form-helper">Horizontal position (-180 to 180)</small>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RESULTS SECTION */}
        <div className="tours-page__content">
          {isLoadingResults ? (
            <LoadingState
              message={
                hasLocationSearch
                  ? searchMode === 'within'
                    ? 'Searching nearby tours...'
                    : 'Loading tours by distance...'
                  : 'Loading tours...'
              }
              minHeight="60vh"
            />
          ) : filteredAndSortedTours.length > 0 ? (
            <>
              <div className="card-container">
                {filteredAndSortedTours.map((tour) => (
                  <div key={tour._id || tour.id} className="tour-card-wrapper">
                    <TourCard
                      tour={tour}
                      distance={
                        hasLocationSearch && searchMode === 'distances' ? tour.distance : undefined
                      }
                      unit={unit}
                    />
                  </div>
                ))}
              </div>
              <p className="tours-page__count">
                {hasLocationSearch && searchMode === 'within'
                  ? `Found ${filteredAndSortedTours.length} tour(s) within ${distance} ${unit === 'mi' ? 'miles' : 'km'}`
                  : hasLocationSearch && searchMode === 'distances'
                    ? `Showing ${filteredAndSortedTours.length} tour(s) sorted by distance`
                    : `Showing ${filteredAndSortedTours.length} of ${tours.length} tours`}
              </p>
            </>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">
                {hasLocationSearch
                  ? searchMode === 'within'
                    ? `No tours found within ${distance} ${unit === 'mi' ? 'miles' : 'km'}. Try increasing the search radius.`
                    : 'No tours found at your location.'
                  : searchTerm || activeFilter !== 'all'
                    ? 'No tours match your filters. Try adjusting your search criteria.'
                    : 'No tours available at the moment'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
