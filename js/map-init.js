const MAPBOX_TOKEN =
  'pk.eyJ1IjoibnJhanBrIiwiYSI6ImNtZnFoejJhaDBua2cybHM4dHRtZ2xycW4ifQ.wAJkzxTCQiRmIZuSyW59Uw';

mapboxgl.accessToken = MAPBOX_TOKEN;

window.map = null;
window.allCenters = [];
window.detailOpen = false;
window.userInteracted = false;
window.currentRegionFilter = '';
window.lastOpenedCountry = null;
window.returnCamera = null; // saves camera before zoom-in


// ===== NEW 1 =====
const getMobileState = () => window.matchMedia('(max-width: 640px)').matches;
function stashReturnCamera() {
  if (!window.map) return;
  window.returnCamera = {
    center: window.map.getCenter(),
    zoom: window.map.getZoom(),
    bearing: window.map.getBearing(),
    pitch: window.map.getPitch()
  };
}

let map;
document.addEventListener('DOMContentLoaded', async () => {
  const isMobile = getMobileState();

  window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [25, 15],
    zoom: isMobile ? 1.5 : 2.5,
    projection: 'globe'
  });
map = window.map;
  const DEFAULT_VIEW = {
    center: [25, 15],
    zoom: isMobile ? 1.5 : 2.5
  };
  // --- STOP GLOBE ROTATION ON USER INTERACTION ---
  window.map.on('mousedown', () => { window.userInteracted = true; });
  window.map.on('touchstart', () => { window.userInteracted = true; });
  window.map.on('wheel', () => { window.userInteracted = true; });


  window.map.on('load', async () => {
    await loadMapIcons();

    const { valid, missing } = await fetchServiceHubs();
    window.allCenters = valid;

    if (!window.allCenters.length) {
      console.error('No hubs with coordinates');
      return;
    }

    // ===== UI =====
    window.buildRegionChips(window.allCenters);

    // ===== MAP =====
    render();
    rotateGlobe();

    // ===== SEARCH (COUNTRY ONLY) =====
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl: mapboxgl,
      marker: false,
      types: 'country',
      placeholder: 'Search Country'
    });

    const geocoderContainer = document.getElementById('geocoder-container');
    if (geocoderContainer) {
      geocoderContainer.appendChild(geocoder.onAdd(map));
    }

    let sidebarTimer = null;

    geocoder.on('result', e => {
      if (!e || !e.result) return;

      const searchedCountry = (e.result.text || '').toLowerCase();
      if (!searchedCountry) return;

      const matches = window.allCenters.filter(
        c => c.country && c.country.toLowerCase() === searchedCountry
      );

      if (!matches.length) return;

      const hub = matches[0];

      if (
        window.detailOpen &&
        window.lastOpenedCountry === hub.country
      ) {
        return;
      }

      window.lastOpenedCountry = hub.country;
      window.userInteracted = true;
if (!window.detailOpen) stashReturnCamera();

      map.flyTo({
  center: [hub.location.lng, hub.location.lat],
  zoom: getMobileState() ? 2.6 : 4.5,
  offset: getMobileState() ? [0, Math.round(window.innerHeight * 0.18)] : [-200, 0],
  essential: true
});


      if (sidebarTimer) clearTimeout(sidebarTimer);

      sidebarTimer = setTimeout(() => {
        showSkeleton();
        openSidebar(hub);
      }, 600);
    });

    // ===== RESET (Rotation-Aware) =====
const resetBtn = document.getElementById('resetMapBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
     window.returnCamera = null;
    window.currentRegionFilter = '';
    window.userInteracted = false;
    window.lastOpenedCountry = null;

    if (typeof window.closeSidebar === 'function') window.closeSidebar();
    if (typeof window.buildRegionChips === 'function') window.buildRegionChips(window.allCenters);
    if (typeof window.applyFiltersAndRender === 'function') window.applyFiltersAndRender();

    const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder input');
    if (geocoderInput) geocoderInput.value = '';

    const isMobile = getMobileState();

    window.map.easeTo({
      center: [25, 15],
      zoom: isMobile ? 1.5 : 2.5,
      bearing: 0,
      pitch: 0,
      duration: 1200,
      essential: true
    });
  });
}


    // ===== VISUALS =====
    map.addLayer({
      id: 'sky',
      type: 'sky',
      paint: {
        'sky-type': 'atmosphere',
        'sky-atmosphere-color': '#0b1220',
        'sky-atmosphere-halo-color': '#ffffff',
        'sky-atmosphere-sun-intensity': 5
      }
    });

    map.setFog({
      range: [0.8, 8],
      color: '#ffffff',
      'high-color': '#e5e7eb',
      'space-color': '#0b1220',
      'horizon-blend': 0.05,
      'star-intensity': 0.25
    });

    // ===== SAFE FALLBACK =====
    missing.forEach(async hub => {
      const coords = await geocodeCountry(hub.country);
      if (!coords) return;

      window.allCenters.push({
        ...hub,
        location: coords
      });
      render();
    });
  });
});

// ================== MAP RENDER ==================
function render() {
  const filteredCenters = window.currentRegionFilter
    ? window.allCenters.filter(
        c => c.region === window.currentRegionFilter
      )
    : window.allCenters;

  const geo = {
    type: 'FeatureCollection',
    features: filteredCenters.map(c => ({
      type: 'Feature',
      properties: c,
      geometry: {
        type: 'Point',
        coordinates: [c.location.lng, c.location.lat]
      }
    }))
  };

  if (!map.getSource('svc')) {
    map.addSource('svc', { type: 'geojson', data: geo });

    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: 'svc',
      layout: {
        'icon-image': [
          'match',
          ['get', 'serviceKey'],
          'fullCapabilityHub', 'h-m',
          'supportCenter', 'h-s',
          'h-s'
        ],
        'icon-size': [
  'interpolate',
  ['linear'],
  ['zoom'],
  2, getMobileState() ? 0.35 : 0.5,
  9, getMobileState() ? 0.9  : 1.2
],

        'icon-allow-overlap': true
      }
    });

    map.on('click', 'points', e => {
  const props = e.features[0].properties;
  const coords = e.features[0].geometry.coordinates;
if (!window.detailOpen) stashReturnCamera();

  showSkeleton();
  openSidebar(props);
 
  map.flyTo({
    center: coords,
    zoom: getMobileState() ? 2.6 : 4.5,
    offset: getMobileState()
      ? [0, Math.round(window.innerHeight * 0.18)]
      : [-200, 0],
    essential: true
  });
});

  } else {
    map.getSource('svc').setData(geo);
  }
}

window.applyFiltersAndRender = render;

// ================== HELPERS ==================
async function geocodeCountry(country) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        country
      )}.json?limit=1&access_token=${MAPBOX_TOKEN}`
    );
    const data = await res.json();
    if (!data.features?.length) return null;
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function loadMapIcons() {
  const icons = [
    { id: 'h-m', color: '#dc2626' },
    { id: 'h-s', color: '#2563eb' }
  ];

  for (const i of icons) {
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50">
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="${i.color}"/>
      </svg>`
    )}`;
    await img.decode();
    map.addImage(i.id, img);
  }
}

// ================== ROTATION ==================
function rotateGlobe() {
  if (!window.detailOpen && !window.userInteracted && map.getZoom() < 5) {
    const c = map.getCenter();
    c.lng -= 0.02;
    map.easeTo({ center: c, duration: 0 });
  }
  requestAnimationFrame(rotateGlobe);
}




