/**
 * Map Initialization Module (The Orchestrator)
 * Coordinates Globe, Data Rendering, and UI Events
 */
const MAPBOX_TOKEN = 'pk.eyJ1IjoibnJhanBrIiwiYSI6ImNtZnFoejJhaDBua2cybHM4dHRtZ2xycW4ifQ.wAJkzxTCQiRmIZuSyW59Uw';

// 1. GLOBAL STATE: Shared across modular scripts
window.map = null;
window.allCenters = [];
window.currentFilter = '';
window.userInteracted = false;
window.detailOpen = false;

document.addEventListener('DOMContentLoaded', async () => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    window.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [25, 15],
        zoom: 2.5,
        projection: 'globe'
    });

    // Interaction Kill-switch: Stops rotation when user takes control
    const stopRotation = () => { 
        if (!window.userInteracted) {
            window.userInteracted = true; 
        }
    };

    window.map.on('mousedown', stopRotation);
    window.map.on('wheel', stopRotation);
    window.map.on('touchstart', stopRotation);

    // Safe Geocoder Initialization
    const geocoderContainer = document.getElementById('geocoder-container');
    if (geocoderContainer) {
        const geocoder = new MapboxGeocoder({
            accessToken: MAPBOX_TOKEN,
            mapboxgl: mapboxgl,
            marker: false,
            placeholder: 'Search Strategic Network'
        });
        geocoderContainer.appendChild(geocoder.onAdd(window.map));
        
        geocoder.on('result', () => { window.userInteracted = true; });
    }

    window.map.on('load', async () => {
    // 1. Correct the Layer IDs for light-v11 aesthetics
    if (window.map.getLayer('water')) {
        window.map.setPaintProperty('water', 'fill-color', '#c3e1ff');
    }
    if (window.map.getLayer('land')) { // Changed from 'background' to 'land'
        window.map.setPaintProperty('land', 'fill-color', '#f8f9fa');
    }

    // 2. Load icons FIRST
    await loadMapIcons(); 

    // 3. AWAIT the data fetch so 'allCenters' is NOT empty
    window.allCenters = await fetchServiceHubs(); 
console.log('HUB COUNT:', window.allCenters.length);

    // 4. Only render once data and icons are confirmed ready
    if (window.allCenters.length > 0) {
        buildRegionChips();
        render();
        rotateGlobe();
    } else {
        console.error("Data fetch returned empty. Check Hygraph connection.");
    }
});

    // 5. CLICK LISTENER: Bridges Map Pointers to Sidebar UI
    window.map.on('click', 'points-layer', (e) => {
        if (!e.features.length) return;
        const props = e.features[0].properties;
        
        showSkeleton(); // From ui-logic.js
        
        window.map.flyTo({
            center: e.features[0].geometry.coordinates,
            offset: [120, 0], // Offset for floating sidebar
            zoom: 5,
            essential: true
        });

        setTimeout(() => {
            openSidebar(props); // From ui-logic.js
        }, 350);
    });

    // 6. RESET BUTTON: Restores global view
    const resetBtn = document.getElementById('resetMapBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            window.currentFilter = '';
            window.closeSidebar();
            buildRegionChips();
            render();
            window.map.flyTo({ center: [25, 15], zoom: 2.5 });
        };
    }

    // Hover feedback
    window.map.on('mouseenter', 'points-layer', () => { window.map.getCanvas().style.cursor = 'pointer'; });
    window.map.on('mouseleave', 'points-layer', () => { window.map.getCanvas().style.cursor = ''; });
});

/** --- SUPPORT FUNCTIONS --- **/

async function loadMapIcons() {
    // Teardrop SVGs
    const RED_T = `data:image/svg+xml;base64,${btoa('<svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C8.95 0 0 8.95 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 8.95 31.05 0 20 0Z" fill="#dc2626"/><circle cx="20" cy="20" r="8" fill="white"/></svg>')}`;
    const BLUE_T = `data:image/svg+xml;base64,${btoa('<svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C8.95 0 0 8.95 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 8.95 31.05 0 20 0Z" fill="#2563eb"/><circle cx="20" cy="20" r="8" fill="white"/></svg>')}`;
    
    const icons = [{ id: 'h-m', p: RED_T }, { id: 'h-s', p: BLUE_T }];
    for (const n of icons) {
        const t = await new Promise(r => {
            const a = new Image();
            a.onload = () => r(a);
            a.src = n.p;
        });
        if (!window.map.hasImage(n.id)) window.map.addImage(n.id, t);
    }
}

function render() {
    if (!window.allCenters || window.allCenters.length === 0) return;

    const geoData = {
        type: 'FeatureCollection',
        features: window.allCenters
            .filter(c => !window.currentFilter || c.region === window.currentFilter)
            .map(c => ({
                type: 'Feature',
                properties: {
                    ...c,
                    serviceKey: c.serviceKey || 'supportCenter' 
                },
                geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] }
            }))
    };

    if (!window.map.getSource('svc-source')) {
        window.map.addSource('svc-source', { type: 'geojson', data: geoData });
        window.map.addLayer({
            id: 'points-layer',
            type: 'symbol',
            source: 'svc-source',
            layout: {
                'icon-image': ['match', ['get', 'serviceKey'], 'fullCapabilityHub', 'h-m', 'supportCenter', 'h-s', 'h-s'],
                'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 10, 1.2],
                'icon-allow-overlap': true
            }
        });
    } else {
        try {
            window.map.getSource('svc-source').setData(geoData);
        } catch (e) {
            console.warn("Mapbox Data Sync Error:", e);
        }
    }
}

function rotateGlobe() {
    if (!window.userInteracted && !window.detailOpen && window.map.getZoom() < 5) {
        const c = window.map.getCenter();
        c.lng -= 0.1;
        window.map.easeTo({ center: c, duration: 0, essential: true });
    }
    requestAnimationFrame(rotateGlobe);
}

function buildRegionChips() {
    const container = document.getElementById('regionChips');
    if (!container) return;
    const regions = ['AMER', 'EMEA', 'APAC'];
    container.innerHTML = regions.map(r => `
        <button class="region-chip${r === window.currentFilter ? ' active' : ''}" 
                onclick="window.setFilter('${r}')">${r}</button>
    `).join('');
}

window.setFilter = (f) => {
    window.currentFilter = window.currentFilter === f ? '' : f;
    buildRegionChips();
    render();

};
