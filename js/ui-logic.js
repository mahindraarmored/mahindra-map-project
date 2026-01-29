const SERVICE_LABEL = {
  fullCapabilityHub: [
    'AV Manufacturing',
    'AV After Sales',
    'AV Spares Support',
    'AV Disposals'
  ],
  supportCenter: [
    'AV Service Support',
    'AV Spares Support',
    'AV Disposals'
  ]
};

function getServiceIconsHTML(p) {
  const ICON_MAP = {
    'AV Manufacturing': '🏭',
    'AV After Sales': '⚙️',
    'AV Spares Support': '🧰',
    'AV Disposals': '♻️',
    'AV Service Support': '🛠️'
  };

  return (SERVICE_LABEL[p.serviceKey] || [])
    .map(s => ICON_MAP[s])
    .filter(Boolean)
    .map(i => `<span class="text-lg">${i}</span>`)
    .join('');
}

function showSkeleton() {
  window.detailOpen = true;
  const content = document.getElementById('sidebar-content');
  content.innerHTML = `
    <div class="profile-hero-container skeleton" style="height:200px;"></div>
    <div class="profile-card-header">
      <div class="skeleton" style="height: 24px; width: 60%; margin-bottom: 8px;"></div>
      <div class="skeleton" style="height: 14px; width: 40%;"></div>
      <div class="action-bubble-row">
        <div class="skeleton" style="width: 36px; height: 36px; border-radius: 50%; margin: auto;"></div>
        <div class="skeleton" style="width: 36px; height: 36px; border-radius: 50%; margin: auto;"></div>
      </div>
    </div>`;
  document.getElementById('info-sidebar').classList.add('open');
}

function openSidebar(p) {
  window.detailOpen = true;
  const wa = (p.phone || '').replace(/[^\d]/g, '') || '971527118654';
  const content = document.getElementById('sidebar-content');

  content.innerHTML = `

<div class="profile-card-header" style="text-align: center; padding-top: 40px; position: relative;">
    <div class="hub-logo-wrapper" style="position: absolute; top: -35px;" >
        <img src="${p.logo}" alt="Hub Logo" class="hub-logo-circular">
    </div>

    <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] m-0">
        ${p.serviceKey === 'fullCapabilityHub' ? 'Armoured Vehicle (AV) Manufacturing Plant' : 'Regional Service Support Center'}
    </h2>
    <p class="text-lg font-extrabold text-slate-900 leading-tight m-0">${p.country}</p>
    
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px;">
        ${getServiceIconsHTML(p)}
    </div>

    <div class="flex items-center justify-center gap-1.5 mt-2 cursor-pointer" onclick="navigator.clipboard.writeText('${p.hubID}')" title="Copy ID">
        <span style="font-size: 10px; font-weight: 700; color: #5f6368; text-transform: uppercase; background: #f1f3f4; padding: 2px 8px; border-radius: 4px;">
            ID: ${p.hubID}
        </span>
        <span style="color: #1a73e8; font-size: 12px;">📋</span>
    </div>

   <div style="margin-top: 24px; padding-bottom: 24px; text-align: left;">
    <h3 style="padding: 0 16px; font-size: 11px; font-weight: 800; color: #70757a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
        ${p.serviceKey === 'fullCapabilityHub' ? 'Production Capabilities' : 'ARMOURED VEHICLE (AV) SERVICES'}
    </h3>

    <div class="service-capability-grid" style="display: flex; flex-direction: column; gap: 8px; padding: 0 16px;">
        ${(SERVICE_LABEL[p.serviceKey] || []).map(s => {
            const ICON_MAP = {
                'AV Manufacturing': '🏭',
                'AV After Sales': '⚙️',
                'AV Spares Support': '🧰',
                'AV Disposals': '♻️',
                'AV Service Support': '🛠️'
            };
            const icon = ICON_MAP[s] || '✓';

            return `
            <div class="legend-chip-item" style="display: flex; align-items: center; gap: 12px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 8px; padding: 10px 14px; width: 100%;">
                <span style="font-size: 16px; display: flex; align-items: center; justify-content: center;">${icon}</span>
                <span class="legend-chip-text" style="font-size: 13px; font-weight: 500; color: #3c4043;">${s}</span>
            </div>`;
        }).join('')}
    </div>

    <div style="display: flex; gap: 12px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <a href="https://wa.me/${wa}" target="_blank" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #16a34a; color: #ffffff; text-decoration: none; height: 44px; border-radius: 12px; font-size: 13px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);">
            💬 WhatsApp
        </a>
        <a href="mailto:${p.email || 'support@hub.com'}" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #1e293b; color: #ffffff; text-decoration: none; height: 44px; border-radius: 12px; font-size: 13px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(30, 41, 59, 0.2);">
            ✉️ Email
        </a>
    </div>
</div>


</div>

  `;

 

  document.getElementById('info-sidebar').classList.add('open');
}
window.closeSidebar = () => {
  document.getElementById('info-sidebar').classList.remove('open');
  window.detailOpen = false;

  // resume rotation after focused interaction
  window.userInteracted = false;

  // gently zoom back out if user came from search
  if (window.map && map.getZoom() > 3.5) {
    map.easeTo({
      zoom: 3.5,
      duration: 800,
      essential: true
    });
  }
};


window.currentRegionFilter = '';

window.buildRegionChips = function (list) {
  const container = document.getElementById('regionChips');
  if (!container) return;

  const regions = ['AMER', 'EMEA', 'APAC'];

  container.innerHTML = regions.map(code => `
    <button
      class="region-chip${code === window.currentRegionFilter ? ' active' : ''}"
      data-region="${code}">
      ${code}
    </button>
  `).join('');

  container.onclick = e => {
    const btn = e.target.closest('.region-chip');
    if (!btn) return;

    const code = btn.dataset.region;
    const isClearing = window.currentRegionFilter === code;

    window.currentRegionFilter = isClearing ? '' : code;

    buildRegionChips(list);
    applyFiltersAndRender();

    if (isClearing) {
      window.userInteracted = false;
      return;
    }

    window.userInteracted = true;

    const regionCenters = window.allCenters.filter(
      c => c.region === code
    );

    if (!regionCenters.length) return;

    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    regionCenters.forEach(c => {
      minLng = Math.min(minLng, c.location.lng);
      minLat = Math.min(minLat, c.location.lat);
      maxLng = Math.max(maxLng, c.location.lng);
      maxLat = Math.max(maxLat, c.location.lat);
    });

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      {
        padding: { top: 120, bottom: 120, left: 420, right: 120 },
        maxZoom: 4.5,
        duration: 1000
      }
    );
  };
};




