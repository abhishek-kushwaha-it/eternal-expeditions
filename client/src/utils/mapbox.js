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
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

  const bounds = new mapboxgl.LngLatBounds();
  const compactMap = mapContainer.clientWidth <= 768;
  let activePopup = null;

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';
    const popupContent = document.createElement('p');
    popupContent.textContent = `Day ${loc.day}: ${loc.description}`;
    const popup = new mapboxgl.Popup({
      offset: [0, -35],
      closeButton: true,
      closeOnClick: !compactMap,
    })
      .setLngLat(loc.coordinates)
      .setDOMContent(popupContent);

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    if (compactMap) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Show details for day ${loc.day}: ${loc.description}`);

      const openPopup = () => {
        activePopup?.remove();
        activePopup = popup.addTo(map);
      };

      el.addEventListener('click', openPopup);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPopup();
        }
      });
    } else {
      popup.addTo(map);
    }

    bounds.extend(loc.coordinates);
  });

  const verticalPadding = Math.min(150, Math.floor(mapContainer.clientHeight * 0.15));
  const horizontalPadding = Math.min(100, Math.floor(mapContainer.clientWidth * 0.1));

  map.fitBounds(bounds, {
    padding: {
      top: verticalPadding,
      bottom: verticalPadding,
      left: horizontalPadding,
      right: horizontalPadding,
    },
    duration: 1200,
  });

  return map;
};
