// app.js
import { 
  MAPBOX_TOKEN, 
  HYGRAPH_ENDPOINT, 
  INITIAL_MAP_CENTER, 
  INITIAL_MAP_ZOOM, 
  REGION_LABEL, 
  SERVICE_LABEL, 
  SERVICE_ICON_MAP, 
  MANUFACTURING_BASE64, 
  SUPPORT_BASE64, 
  EMAIL_SVG, 
  WHATSAPP_SVG 
} from './config.js';

// ===== MAP INIT =====
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: INITIAL_MAP_CENTER,
  zoom: INITIAL_MAP_ZOOM
});

// 1. Add Zoom (Navigation) control
const navControl = new mapboxgl.NavigationControl();
map.addControl(navControl, 'bottom-right');

// 2. Add "Locate Me" (Geolocate) control
const geolocateControl = new mapboxgl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true
});
map.addControl(geolocateControl, 'bottom-right');

const ICON_MAP = {
  fullCapabilityHub: 'manufacturing-icon',
  supportCenter: 'support-icon'
};

function loadMapIcons() {
  return new Promise((resolve) => {
    const icons = [
      { id: ICON_MAP.fullCapabilityHub, path: MANUFACTURING_BASE64 },
      { id: ICON_MAP.supportCenter, path: SUPPORT_BASE64 }
    ];
    let loaded = 0;
    icons.forEach(({ id, path }) => {
      map.loadImage(path, (err, img) => {
        if (!err && img && !map.hasImage(id)) map.addImage(id, img);
        loaded++; if (loaded === icons.length) resolve();
      });
    });
  });
}

// ===== DATA FETCHING =====
async function fetchCenters() {
  const res = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    cache: 'no-store',
    body: JSON.stringify({ query: `
      query {
        serviceNetworks(stage: PUBLISHED, first: 1000, orderBy: updatedAt_DESC) {
          id name country region hubID serviceRange phone email
          location { latitude longitude }
          updatedAt
          image { url }
        }
      }` 
    })
  });
  const json = await res.json();
  if (!json.data) { console.error('Hygraph error:', json.errors || json); return []; }
  const list = (json.data.serviceNetworks || []).filter(c => c.location);
  return list.map(c => ({
    id: c.id,
    name: c.name,
    country: c.country || '',
    region: c.region || '',
    hubID: c.hubID || '',
    phone: c.phone || '',
    email: c.email || '',
    services: c.serviceRange,
    logo: (c.image && c.image.url) || '',
    location: { lat: c.location.latitude, lng: c.location.longitude }
  }));
}

// ===== UI BUILDERS =====
const normalizePhone = s => (s || '').replace(/[^\d]/g, '');

function getServiceIconsHTML(p) {
  const data = SERVICE_LABEL[p.serviceKey];
  const items = Array.isArray(data) ? data : (data ? [data] : []);
  return items.map(label => SERVICE_ICON_MAP[label] || '').filter(Boolean)
    .map(sym => `<span title="${sym}" aria-hidden="true">${sym}</span>`).join('');
}

function hoverHTML(p) {
  const isFC = p.serviceKey === 'fullCapabilityHub';
  const sub = isFC ? 'Full Capability Hub' : 'Regional Service Hub';
  const CENTRAL_WA = '971527118654';
  const waNumber = normalizePhone(p.phone) || CENTRAL_WA;
  const whatsappMsg = encodeURIComponent(`Hub ID: ${p.hubID || 'N/A'} | Support Request`);
  const waHref = `https://wa.me/${waNumber}?text=${whatsappMsg}`;
  const mailHref = `mailto:${p.email || 'support@mahindraarmored.com'}`;
  
  const BADGE_SIZE = '40px'; 
  const ICON_SIZE = '20px';
  const WHATSAPP_SVG_20PX = WHATSAPP_SVG.replace('width:24px; height:24px;', `width:${ICON_SIZE}; height:${ICON_SIZE};`);
  const EMAIL_SVG_20PX = EMAIL_SVG.replace('width:24px; height:24px;', `width:${ICON_SIZE}; height:${ICON_SIZE};`);
  
  return `
    <div class="hover-card" style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start;">
      <div class="info">
        <div class="title" style="font-weight:700;">${p.country || ''}</div>
        <div class="subtitle" style="font-size:13px;color:#555;">${sub}</div>
        <div class="svc-icons" style="display:flex;gap:8px;margin-top:4px;">${getServiceIconsHTML(p)}</div>
      </div>
      <div class="actions" style="display:grid;gap:6px;justify-items:end;">
        <a class="badge" href="${waHref}" target="_blank" rel="noopener" title="WhatsApp" 
           style="display:inline-flex;align-items:center;justify-content:center;width:${BADGE_SIZE};height:${BADGE_SIZE};border:1px solid rgba(0,0,0,.12);border-radius:6px;">
          ${WHATSAPP_SVG_20PX}
        </a>
        <a class="badge" href="${mailHref}" title="Email" 
           style="display:inline-flex;align-items:center;justify-content:center;width:${BADGE_SIZE};height:${BADGE_SIZE};border:1px solid rgba(0,0,0,.12);border-radius:6px;">
          ${EMAIL_SVG_20PX}
        </a>
      </div>
    </div>`;
}

function popupHTML(p) {
  const isFC = p.serviceKey === 'fullCapabilityHub';
  const waNumber = normalizePhone(p.phone) || '971527118654';
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hub ID: ' + (p.hubID || 'N/A'))}`;
  const mailHref = `mailto:${p.email || 'support@mahindraarmored.com'}`;

  const serviceData = SERVICE_LABEL[p.serviceKey] || p.serviceKey || '';
  const serviceHTML = Array.isArray(serviceData)
    ? `<ul style="padding-left:20px;margin-top:6px;list-style:disc;color:#4b5563;">${serviceData.map(i => `<li>${i}</li>`).join('')}</ul>`
    : `<p style="margin-top:6px;">${String(serviceData || '—')}</p>`;

  const logoHTML = p.logo ? `
    <div style="text-align: center; padding-top: 10px; margin-bottom: 10px;">
      <div style="display: inline-flex; width: 60px; height: 60px; border-radius: 50%; background-color: #E6E6E6; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
        <img src="${p.logo}" style="width: 100%; height: 100%; object-fit: contain;">
      </div>
    </div>` : '';

  return `
    <div class="popup">
      ${logoHTML}
      <p><strong>${isFC ? '<span style="color:#E41837;">Full Capability Hub</span>' : 'Regional Support Hub — <span style="color:#E41837;">' + p.country + '</span>'}</strong></p>
      ${serviceHTML}
      <div class="contact-buttons">
        <a href="${waHref}" target="_blank">WhatsApp</a>
        <a href="${mailHref}">Email</a>
      </div>
    </div>`;
}

// ===== STATE & FILTERING =====
let allCenters = [];
let currentRegionFilter = '';
let hoverPopup = null, hoverCloseTimer = null, detailOpen = false, lastHoverId = null;

function cleanupHover() {
  if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
  if (hoverPopup) { hoverPopup.remove(); hoverPopup = null; }
  lastHoverId = null; map.getCanvas().style.cursor = '';
}

['dragstart', 'zoomstart', 'movestart', 'styledata'].forEach(ev => map.on(ev, cleanupHover));

function applyFiltersAndRender() {
  const r = currentRegionFilter;
  const inBounds = allCenters.filter(c => !r || c.region === r);
  const src = map.getSource('svc');

  if (!src) {
    map.addSource('svc', { 
        type: 'geojson', 
        data: { type: 'FeatureCollection', features: allCenters.map(c => ({
            type: 'Feature',
            properties: { ...c, serviceKey: c.services },
            geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] }
        }))} 
    });
    map.addLayer({
      id: 'points', type: 'symbol', source: 'svc',
      layout: {
        'icon-image': ['case', ['==', ['get', 'serviceKey'], 'fullCapabilityHub'], ICON_MAP.fullCapabilityHub, ICON_MAP.supportCenter],
        'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.024, 9, 0.061, 12, 0.121]
      }
    });

    map.on('click', 'points', (e) => {
      cleanupHover(); detailOpen = true;
      const f = e.features[0];
      new mapboxgl.Popup({ closeOnMove: true }).setLngLat(f.geometry.coordinates).setHTML(popupHTML(f.properties)).addTo(map).on('close', () => { detailOpen = false; });
    });

    map.on('mouseenter', 'points', (e) => {
      if (detailOpen) return;
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features[0];
      if (!hoverPopup) {
        hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 14 }).setLngLat(f.geometry.coordinates).setHTML(hoverHTML(f.properties)).addTo(map);
        lastHoverId = f.properties.id;
      }
    });
    map.on('mouseleave', 'points', () => { hoverCloseTimer = setTimeout(() => cleanupHover(), 120); });
  }

  if (inBounds.length) {
    const b = new mapboxgl.LngLatBounds();
    inBounds.forEach(c => b.extend([c.location.lng, c.location.lat]));
    map.fitBounds(b, { padding: 50, maxZoom: 6 });
  }
}

function buildRegionChips(list) {
  const container = document.getElementById('regionChips');
  const order = ['AMER', 'EMEA', 'APAC'];
  const regions = [...new Set(list.map(c => c.region).filter(Boolean))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  
  container.innerHTML = regions.map(code => {
    const label = (REGION_LABEL[code] || code).split(':')[0].trim();
    return `<button class="region-chip" data-region="${code}">${label}</button>`;
  }).join('');

  container.onclick = e => {
    const btn = e.target.closest('.region-chip'); if (!btn) return;
    const code = btn.getAttribute('data-region');
    if (currentRegionFilter === code) return;
    currentRegionFilter = code;
    container.querySelectorAll('.region-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFiltersAndRender();
  };
}

// ===== INITIALIZATION =====
const geocoder = new MapboxGeocoder({ accessToken: MAPBOX_TOKEN, mapboxgl, marker: false, placeholder: 'Search MEVA Hubs' });
document.getElementById('geocoder-container').appendChild(geocoder.onAdd(map));

document.getElementById('resetMapBtn').onclick = () => {
  currentRegionFilter = '';
  geocoder.clear();
  document.querySelectorAll('.region-chip').forEach(b => b.classList.remove('active'));
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
