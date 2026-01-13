const HYGRAPH_ENDPOINT =
  'https://ap-south-1.cdn.hygraph.com/content/cmfpk332g005s08uylh0ezd8a/master';

async function fetchServiceHubs() {
  const query = `query {
    serviceNetworks(stage: PUBLISHED, first: 1000) {
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
  }`;

  try {
    const res = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const json = await res.json();
    const raw = json?.data?.serviceNetworks || [];

    const valid = [];
    const missing = [];

    raw.forEach(c => {
      const base = {
        ...c,
        serviceKey: normalizeServiceKey(c.serviceRange),
        logo: c.image?.url || ''
      };

      if (c.location?.latitude && c.location?.longitude) {
        valid.push({
          ...base,
          location: {
            lat: c.location.latitude,
            lng: c.location.longitude
          }
        });
      } else {
        missing.push(base);
      }
    });

    return { valid, missing };
  } catch (e) {
    console.error('Hygraph fetch failed:', e);
    return { valid: [], missing: [] };
  }
}

function normalizeServiceKey(v) {
  if (!v) return 'supportCenter';
  const s = v.toLowerCase();
  if (s.includes('full')) return 'fullCapabilityHub';
  return 'supportCenter';
}
