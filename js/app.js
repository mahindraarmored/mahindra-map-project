// js/app.js
import {
  MAPBOX_TOKEN,
  HYGRAPH_ENDPOINT,
  INITIAL_MAP_CENTER,
  INITIAL_MAP_ZOOM,
  REGION_LABEL,
  SERVICE_LABEL,
  SERVICE_ICON_MAP,
  ICON_MAP,
  MANUFACTURING_BASE64,
  SUPPORT_BASE64,
  EMAIL_SVG,
  WHATSAPP_SVG
} from './config.js';

/* =========================
   MAP INIT
========================= */

mapboxgl.accessToken = MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: INITIAL_MAP_CENTER,
  zoom: INITIAL_MAP_ZOOM
});

// Controls
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  }),
  'bottom-right'
);

/* =========================
   ICON LOADING
========================= */

function loadMapIcons() {
  return new Promise(resolve => {
    const icons = [
      { id: ICON_MAP.fullCapabilityHub, src: MANUFACTURING_BASE64 },
      { id: ICON_MAP.supportCenter, src: SUPPORT_BASE64 }
    ];

    let loaded = 0;
    icons.forEach(({ id, src }) => {
      map.loadImage(src, (err, img) => {
        if (!err && img && !map.hasImage(id)) {
          map.addImage(id, img);
        }
        if (++loaded === icons.length) resolve();
      });
    });
  });
}

/* =========================
   DATA FETCHING
========================= */

async function fetchCenters() {
  const res = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      query: `
        query {
          serviceNetworks(stage: PUBLISHED, first: 1000, orderBy: updatedAt_DESC) {
            id
            name
            country
            region
            hubID
            serviceRange
            phone
            email
            location { latitude longitude }
            image { url }
          }
        }
      `
    })
  });

  const json = await res.json();
  if (!json.data) {
    console.error('Hygraph error:', json.errors || json);
    return [];
  }

  return (json.data.serviceNetworks || [])
    .filter(c => c.location)
    .map(c => ({
      id: c.id,
      name: c.name,
      country: c.country || '',
      region: c.region || '',
      hubID: c.hubID || '',
      phone: c.phone || '',
      email: c.email || '',
      services: c.serviceRange,
      logo: c.image?.url || '',
      location: { lat: c.location.latitude, lng: c.location.longitude }
    }));
}

/* =========================
   UI HELPERS
========================= */

const normalizePhone = s => (s || '').replace(/[^\d]/g, '');

function getServiceIconsHTML(p) {
  const data = SERVICE_LABEL[p.serviceKey];
  const items = Array.isArray(data) ? data : data ? [data] : [];
  return items
    .map(label => SERVICE_ICON_MAP[label])
    .filter(Boolean)
    .map(sym => `<span aria-hidden="true">${sym}</span>`)
    .join('');
}

function hoverHTML(p) {
  const wa = normalizePhone(p.phone) || '971527118654';
  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent(
    `Hub ID: ${p.hubID || 'N/A'}`
  )}`;

  const mailHref = `mailto:${p.email || 'support@mahindraarmored.com'}`;

  return `
    <div class="hover-card">
      <strong>${p.country}</strong>
      <div>${getServiceIconsHTML(p)}</div>
      <div class="actions">
        <a href="${waHref}" target="_blank">${WHATSAPP_SVG}</a>
        <a href="${mailHref}">${EMAIL_SVG}</a>
      </div>
    </div>
  `;
}

function popupHTML(p) {
  const wa = normalizePhone(p.phone) || '971527118654';
  return `
    <div class="popup">
      ${p.logo ? `<img src="${p.logo}" />` : ''}
      <p><strong>${p.country}</strong></p>
      ${
        Array.isArray(SERVICE_LABEL[p.serviceKey])
          ? `<ul>${SERVICE_LABEL[p.serviceKey]
              .map(i => `<li>${i}</li>`)
              .join('')}</ul>`
          : `<p>${SERVICE_LABEL[p.serviceKey] || ''}</p>`
      }
      <div class="contact-buttons">
        <a href="https://wa.me/${wa}" target="_blank">WhatsApp</a>
        <a href="mailto:${p.email || 'support@mahindraarmored.com'}">Email</a>
      </div>
    </div>
  `;
}

/* =========================
   STATE & FILTERING
========================= */

let allCenters = [];
let currentRegionFilter = '';
let hoverPopup = null;
let hoverTimer = null;
let detailOpen = false;

function cleanupHover() {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverPopup?.remove();
  hoverPopup = null;
  map.getCanvas().style.cursor = '';
}

['dragstart', 'zoomstart', 'movestart', 'styledata'].forEach(ev =>
  map.on(ev, cleanupHover)
);

function applyFiltersAndRender() {
  const filtered = allCenters.filter(
    c => !currentRegionFilter || c.region === currentRegionFilter
  );

  if (!map.getSource('svc')) {
    map.addSource('svc', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: allCenters.map(c => ({
          type: 'Feature',
          properties: { ...c, serviceKey: c.services },
          geometry: {
            type: 'Point',
            coordinates: [c.location.lng, c.location.lat]
          }
        }))
      }
    });

    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: 'svc',
      layout: {
        'icon-image': [
          'case',
          ['==', ['get', 'serviceKey'], 'fullCapabilityHub'],
          ICON_MAP.fullCapabilityHub,
          ICON_MAP.supportCenter
        ],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.03, 10, 0.12],
        'icon-allow-overlap': true
      }
    });

    map.on('click', 'points', e => {
      detailOpen = true;
      new mapboxgl.Popup()
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(popupHTML(e.features[0].properties))
        .addTo(map)
        .on('close', () => (detailOpen = false));
    });

    map.on('mouseenter', 'points', e => {
      if (detailOpen) return;
      map.getCanvas().style.cursor = 'pointer';
      hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14
      })
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(hoverHTML(e.features[0].properties))
        .addTo(map);
    });

    map.on('mouseleave', 'points', () => {
      hoverTimer = setTimeout(cleanupHover, 120);
    });
  }

  if (filtered.length) {
    const b = new mapboxgl.LngLatBounds();
    filtered.forEach(c => b.extend([c.location.lng, c.location.lat]));
    map.fitBounds(b, { padding: 50, maxZoom: 6 });
  }
}

/* =========================
   REGION CHIPS
========================= */

function buildRegionChips(list) {
  const el = document.getElementById('regionChips');
  const order = ['AMER', 'EMEA', 'APAC'];
  const regions = [...new Set(list.map(c => c.region))]
    .filter(Boolean)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));

  el.innerHTML = regions
    .map(
      r =>
        `<button class="region-chip" data-region="${r}">
          ${(REGION_LABEL[r] || r).split(':')[0]}
        </button>`
    )
    .join('');

  el.onclick = e => {
    const btn = e.target.closest('.region-chip');
    if (!btn) return;
    currentRegionFilter = btn.dataset.region;
    el.querySelectorAll('.region-chip').forEach(b =>
      b.classList.remove('active')
    );
    btn.classList.add('active');
    applyFiltersAndRender();
  };
}

/* =========================
   INIT
========================= */

const geocoder = new MapboxGeocoder({
  accessToken: MAPBOX_TOKEN,
  mapboxgl,
  marker: false,
  placeholder: 'Search MEVA Hubs'
});

document.getElementById('geocoder-container').appendChild(
  geocoder.onAdd(map)
);

document.getElementById('resetMapBtn').onclick = () => {
  currentRegionFilter = '';
  geocoder.clear();
  document
    .querySelectorAll('.region-chip')
    .forEach(b => b.classList.remove('active'));
  applyFiltersAndRender();
  map.flyTo({ center: INITIAL_MAP_CENTER, zoom: INITIAL_MAP_ZOOM });
};

(async () => {
  await new Promise(res => map.on('load', res));
  await loadMapIcons();

  document.getElementById('legend-icon-mfg').src = MANUFACTURING_BASE64;
  document.getElementById('legend-icon-support').src = SUPPORT_BASE64;

  allCenters = await fetchCenters();
  buildRegionChips(allCenters);
  applyFiltersAndRender();
})();
