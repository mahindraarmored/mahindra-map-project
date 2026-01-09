/**
 * Data Fetching Module with Geocoding Fallback
 * Manages Hygraph CMS integration and coordinate standardization
 */
const HYGRAPH_ENDPOINT = 'https://ap-south-1.cdn.hygraph.com/content/cmfpk332g005s08uylh0ezd8a/master';

/**
 * Fallback: Fetches center coordinates for a country if specific hub coords are missing
 */
async function getCoordsFromCountry(countryName) {
    if (!countryName) return null;
    try {
        // Accesses Mapbox Geocoding API using the global token
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryName)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data && data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            return { lat, lng };
        }
    } catch (e) {
        console.error(`Geocoding failed for ${countryName}:`, e);
    }
    return null;
}

/**
 * Main Data Fetcher: Retrieves and normalizes hub data
 */
async function fetchServiceHubs() {
    const query = `query {
        serviceNetworks(stage: PUBLISHED, first: 1000) {
            id name country region hubID serviceRange phone email
            location { latitude longitude }
            image { url }
        }
    }`;

    try {
        const res = await fetch(HYGRAPH_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json = await res.json();
        
        if (!json.data || !json.data.serviceNetworks) return [];

        const rawHubs = json.data.serviceNetworks;

        // Process all hubs in parallel to handle any necessary geocoding fallbacks
        const processedHubs = await Promise.all(rawHubs.map(async (c) => {
            let coords = null;

            // Priority 1: Use specific latitude/longitude from Hygraph
            if (c.location && c.location.latitude && c.location.longitude) {
                coords = { lat: c.location.latitude, lng: c.location.longitude };
            } 
            // Priority 2: Use country name to find a fallback location
            else if (c.country) {
                console.warn(`Standardizing location for ${c.country} hub...`);
                coords = await getCoordsFromCountry(c.country);
            }

            return {
                ...c,
                serviceKey: c.serviceRange,
                logo: c.image?.url || '',
                location: coords // Pointers rely on this being a valid {lat, lng} object
            };
        }));

        // Final safety filter: remove any entries that still lack coordinates
        return processedHubs.filter(h => h.location !== null);
    } catch (err) {
        console.error("Hygraph Fetch Error:", err);
        return [];
    }
}