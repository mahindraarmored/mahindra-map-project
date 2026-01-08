import { 
  MAPBOX_TOKEN, 
  HYGRAPH_ENDPOINT, 
  INITIAL_MAP_CENTER, 
  INITIAL_MAP_ZOOM, 
  ICON_MAP, 
  MANUFACTURING_BASE64, 
  SUPPORT_BASE64,
  EMAIL_SVG,
  WHATSAPP_SVG
} from './config.js';

// 1. Initialize Map
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: INITIAL_MAP_CENTER,
  zoom: INITIAL_MAP_ZOOM
});

// 2. Load Icons from Base64
async function loadMapIcons() {
  const icons = [
    { id: ICON_MAP.fullCapabilityHub, src: MANUFACTURING_BASE64 },
    { id: ICON_MAP.supportCenter, src: SUPPORT_BASE64 }
  ];
  for (const icon of icons) {
    await new Promise(res => {
      map.loadImage(icon.src, (err, img) => {
        if (!err && img && !map.hasImage(icon.id)) map.addImage(icon.id, img);
        res();
      });
    });
  }
}

// 3. Fetch Data from Hygraph
async function fetchCenters() {
  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query {
        serviceNetworks(first: 100) {
          id
          name
          country
          region
          phone
          email
          serviceRange
          location { latitude longitude }
        }
      }`
    })
  });
  const json = await response.json();
  return json.data.serviceNetworks;
}

// 4. Main App Logic
map.on('load', async () => {
  await loadMapIcons();
  const centers = await fetchCenters();

  map.addSource('svc', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: centers.map(c => ({
        type: 'Feature',
        geometry: { 
          type: 'Point', 
          coordinates: [c.location.longitude, c.location.latitude] 
        },
        properties: { 
          ...c, 
          serviceKey: c.serviceRange // Logic to decide which icon to show
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
        ['==', ['get', 'serviceKey'], 'fullCapabilityHub'], ICON_MAP.fullCapabilityHub,
        ICON_MAP.supportCenter
      ],
      'icon-size': 0.6, // Visible size for pins
      'icon-allow-overlap': true
    }
  });

  // 5. Click for Popup (WhatsApp/Email)
  map.on('click', 'points', (e) => {
    const p = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`
        <div style="padding:10px; font-family:sans-serif;">
          <h3 style="margin:0 0 5px 0;">${p.country}</h3>
          <p style="font-size:12px; margin-bottom:10px;">${p.name}</p>
          <div style="display:flex; gap:10px;">
            <a href="https://wa.me/${p.phone}" target="_blank" style="text-decoration:none;">${WHATSAPP_SVG}</a>
            <a href="mailto:${p.email}" style="text-decoration:none;">${EMAIL_SVG}</a>
          </div>
        </div>
      `)
      .addTo(map);
  });

  // Change cursor on hover
  map.on('mouseenter', 'points', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'points', () => map.getCanvas().style.cursor = '');
});
