/**
 * UI & Interaction Module
 * Manages Sidebar, Skeletons, and Icon Mapping
 */

// 1. Service capability mapping for visual icons
const SERVICE_LABEL = {
    fullCapabilityHub: ['AV Manufacturing', 'AV After Sales', 'AV Spares Support', 'AV Disposals'],
    supportCenter: ['AV Service Support', 'AV Spares Support', 'AV Disposals']
};

/**
 * Generates HTML for capability emojis based on hub type
 */
function getServiceIconsHTML(p) {
    const data = SERVICE_LABEL[p.serviceKey];
    const items = Array.isArray(data) ? data : (data ? [data] : []);
    const ICON_MAP = { 
        'AV Manufacturing': '🏭', 
        'AV After Sales': '⚙️', 
        'AV Spares Support': '🧰', 
        'AV Disposals': '♻️', 
        'AV Service Support': '🛠️' 
    };
    return items.map(label => ICON_MAP[label] || '')
                .filter(Boolean)
                .map(sym => `<span class="text-lg" title="${sym}">${sym}</span>`)
                .join('');
}

/**
 * Displays an animated loading state immediately upon clicking a hub
 */
function showSkeleton() {
    window.detailOpen = true; // Stop globe rotation immediately
    const content = document.getElementById('sidebar-content');
    if (!content) return;

    content.innerHTML = `
        <div class="p-6 flex flex-col gap-4">
            <div class="skeleton sk-circle mx-auto"></div>
            <div class="skeleton h-8 w-3/4 mx-auto"></div>
            <div class="skeleton sk-text"></div>
            <div class="skeleton sk-text w-1/2"></div>
            <div class="skeleton h-20 w-full mt-4 rounded-xl"></div>
        </div>`;
    document.getElementById('info-sidebar').classList.add('open');
}

/**
 * Populates the sidebar with real data from the selected hub
 */
function openSidebar(p) {
    window.detailOpen = true; 
    const wa = (p.phone || '').replace(/[^\d]/g, '') || '971527118654';
    const content = document.getElementById('sidebar-content');
    if (!content) return;

    content.innerHTML = `
        <img src="${p.logo}" class="hub-hero-img" alt="${p.country} hub">
        <div class="p-6">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black text-red-600 uppercase tracking-widest">${p.region} Hub</span>
                <div class="flex gap-2">${getServiceIconsHTML(p)}</div>
            </div>
            <h2 class="text-2xl font-black text-slate-900 leading-tight">${p.country}</h2>
            <p class="text-xs font-bold text-slate-400 uppercase mt-1">Operational ID: ${p.hubID}</p>
            
            <div class="flex gap-3 my-6 border-y py-4 border-slate-50">
                <a href="https://wa.me/${wa}" target="_blank" class="flex-1 text-center py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors">WhatsApp</a>
                <a href="mailto:${p.email}" class="flex-1 text-center py-3 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors text-slate-700">Email</a>
            </div>

            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Service Capabilities</h4>
            <div class="space-y-2.5">
                ${(SERVICE_LABEL[p.serviceKey] || []).map(s => `
                    <div class="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        ${s}
                    </div>`).join('')}
            </div>
        </div>`;
    document.getElementById('info-sidebar').classList.add('open');
}

/**
 * Closes the sidebar and signals the map to resume rotation
 */
window.closeSidebar = () => {
    const sidebar = document.getElementById('info-sidebar');
    if (sidebar) sidebar.classList.remove('open');
    
    window.detailOpen = false; // Allow globe rotation to resume
    
    // Smoothly re-center the map to remove the sidebar offset
    if (window.map) {
        window.map.easeTo({ offset: [0, 0], duration: 800 });
    }
};