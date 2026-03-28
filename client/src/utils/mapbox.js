import mapboxgl from 'mapbox-gl';

export const displayMap = (mapContainer, locations) => {
  if (!mapContainer || !locations || locations.length === 0) return;

  mapboxgl.accessToken =
    'pk.eyJ1IjoiYWJoaWt1c2gwMTIiLCJhIjoiY21sZzZmYXN6MDk3ZzNmc2g0dWZuNnQ5ayJ9.Hd8iNrXwfpwuzYJaIySeeg';

  const map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/abhikush012/cmlg7uvv8006k01r3ckr5fop1',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: [0, -35],
      closeButton: true,
      closeOnClick: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
    duration: 1200,
  });

  return map;
};
