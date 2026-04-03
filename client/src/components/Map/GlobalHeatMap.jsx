import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate country bounds for offsetting markers (lat, lon ranges)
const countryBounds = {
  'US': { latMin: 24.5, latMax: 49.4, lonMin: -125.0, lonMax: -66.9 },
  'IN': { latMin: 6.5, latMax: 37.1, lonMin: 68.1, lonMax: 97.4 },
  'CN': { latMin: 18.2, latMax: 53.6, lonMin: 73.6, lonMax: 135.0 },
  'RU': { latMin: 41.2, latMax: 82.0, lonMin: 19.6, lonMax: 180.0 },
  'BR': { latMin: -33.7, latMax: 5.3, lonMin: -73.9, lonMax: -34.8 },
  'GB': { latMin: 49.9, latMax: 58.6, lonMin: -8.2, lonMax: 1.8 },
  'DE': { latMin: 47.3, latMax: 55.1, lonMin: 5.9, lonMax: 15.0 },
  'FR': { latMin: 41.3, latMax: 51.1, lonMin: -5.1, lonMax: 9.6 },
  'JP': { latMin: 24.3, latMax: 45.5, lonMin: 122.9, lonMax: 145.8 },
  'AU': { latMin: -43.6, latMax: -10.1, lonMin: 113.3, lonMax: 153.6 },
  // Add more countries as needed
};

// Function to normalize country names to codes
function normalizeCountry(country) {
  if (!country) return '';
  const trimmed = String(country).trim();
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();

  const map = {
    'united states': 'US',
    'united states of america': 'US',
    'usa': 'US',
    'america': 'US',
    'u s a': 'US',
    'u s': 'US',
    'india': 'IN',
    'bharat': 'IN',
    'hindustan': 'IN',
    'germany': 'DE',
    'deutschland': 'DE',
    'federal republic of germany': 'DE',
    'united kingdom': 'GB',
    'uk': 'GB',
    'great britain': 'GB',
    'britain': 'GB',
    'england': 'GB',
    'scotland': 'GB',
    'wales': 'GB',
    'northern ireland': 'GB',
    'france': 'FR',
    'republic of france': 'FR',
    'china': 'CN',
    'people s republic of china': 'CN',
    'prc': 'CN',
    'japan': 'JP',
    'nippon': 'JP',
    'brazil': 'BR',
    'brasil': 'BR',
    'russia': 'RU',
    'russian federation': 'RU',
    'australia': 'AU',
    'new zealand': 'NZ',
    'canada': 'CA',
    'mexico': 'MX',
    'south korea': 'KR',
    'republic of korea': 'KR',
    'korea republic': 'KR',
    'north korea': 'KP',
    'korea democratic people s republic': 'KP',
    'spain': 'ES',
    'espa a': 'ES',
    'italy': 'IT',
    'italia': 'IT',
    'netherlands': 'NL',
    'holland': 'NL',
    'switzerland': 'CH',
    'swissie': 'CH',
    'south africa': 'ZA',
    'nigeria': 'NG',
    'egypt': 'EG',
    'argentina': 'AR',
    'colombia': 'CO',
    'indonesia': 'ID',
    'philippines': 'PH',
    'philippine': 'PH',
    'pakistan': 'PK',
    'bangladesh': 'BD',
    'turkey': 'TR',
    'saudi arabia': 'SA',
    'united arab emirates': 'AE',
    'uae': 'AE',
    'iran': 'IR',
    'iraq': 'IQ',
    'argentine republic': 'AR',
    'republic of india': 'IN',
  };

  return map[normalized] || upper;
}

// Function to get spread lat/lon around a base location
function getSpreadLatLon(baseLat, baseLon, country) {
  const normalized = normalizeCountry(country);
  const bounds = countryBounds[normalized];
  let spreadLat, spreadLon;
  if (bounds) {
    // Spread within country bounds, but centered around base location
    const latRange = bounds.latMax - bounds.latMin;
    const lonRange = bounds.lonMax - bounds.lonMin;
    const spreadFactor = 5.0; // 500% of country size for much better spread to avoid stacking
    const latOffset = (Math.random() - 0.5) * latRange * spreadFactor;
    const lonOffset = (Math.random() - 0.5) * lonRange * spreadFactor;
    spreadLat = baseLat + latOffset;
    spreadLon = baseLon + lonOffset;
    // Allow slight overflow outside bounds for better spread
    spreadLat = Math.max(bounds.latMin - 1, Math.min(bounds.latMax + 1, spreadLat));
    spreadLon = Math.max(bounds.lonMin - 1, Math.min(bounds.lonMax + 1, spreadLon));
  } else {
    // Default spread around base
    const offset = 5.0; // +/- 5 degrees for better spread
    spreadLat = baseLat + (Math.random() - 0.5) * offset;
    spreadLon = baseLon + (Math.random() - 0.5) * offset;
  }
  return { lat: spreadLat, lon: spreadLon };
}

function GlobalHeatMap({ filters = {}, selectedLocation = null }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const fetchDetections = async () => {
    if (!mapRef.current) return;
    const params = new URLSearchParams();
    if (filters.media) params.set('media', filters.media);
    if (filters.country) params.set('country', filters.country);
    if (filters.window) params.set('window', filters.window);
    if (filters.min_conf != null) params.set('min_conf', filters.min_conf);
    if (filters.max_conf != null) params.set('max_conf', filters.max_conf);
    if (filters.verification_status) params.set('verification_status', filters.verification_status);
    // Add location filter if selected (e.g., from reports)
    if (selectedLocation && selectedLocation.country) {
      params.set('country', selectedLocation.country);
    }
    try {
      const res = await fetch(`/api/detections/export?${params}`);
      const csv = await res.text();
      const lines = csv.split('\n').slice(1); // skip header
      const points = [];
      for (const line of lines) {
        const cols = line.split(',');
        if (cols.length >= 9) {
          const lat = parseFloat(cols[7]);
          const lon = parseFloat(cols[8]);
          const conf = parseFloat(cols[4]);
          const country = cols[5];
          if (!isNaN(lat) && !isNaN(lon) && !isNaN(conf)) {
            points.push([lat, lon, conf, country]);
          }
        }
      }
      // Clear existing markers
      markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
      markersRef.current = [];
      // Add new markers with better spread if location is filtered
      points.forEach(([lat, lon, conf, country]) => {
        let adjustedLat, adjustedLon;
        if (selectedLocation && selectedLocation.country) {
          // For location-filtered view, spread markers within the country bounds
          const spreadPos = getSpreadLatLon(lat, lon, country);
          adjustedLat = spreadPos.lat;
          adjustedLon = spreadPos.lon;
        } else {
          // For global view, use actual lat/lon with small random offset
          const offset = 1.0;
          adjustedLat = lat + (Math.random() - 0.5) * offset;
          adjustedLon = lon + (Math.random() - 0.5) * offset;
        }
        const color = conf >= 0.9 ? 'red' : conf >= 0.7 ? 'orange' : 'yellow';
        const marker = L.circleMarker([adjustedLat, adjustedLon], {
          color: color,
          fillColor: color,
          fillOpacity: 0.45,
          radius: conf >= 0.9 ? 6 : conf >= 0.7 ? 4 : 2,
          weight: 1,
          className: 'heat-marker'
        }).addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    } catch (e) {
      console.error('Failed to fetch detections for heatmap:', e);
    }
  };

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('global-heat-map', { worldCopyJump: true, preferCanvas: true }).setView([20, 0], 2);

    // Dark basemap for black theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    const onNewDetection = (e) => {
      const d = e.detail;
      if (d && d.country) {
        // For real-time, randomize within country bounds to avoid stacking at centroid
        const randomPos = getSpreadLatLon(0, 0, d.country);
        const adjustedLat = randomPos.lat;
        const adjustedLon = randomPos.lon;
        const color = (d.confidence || 0.5) >= 0.9 ? 'red' : (d.confidence || 0.5) >= 0.7 ? 'orange' : 'yellow';
        // Heat-style marker for real-time detections
        const marker = L.circleMarker([adjustedLat, adjustedLon], {
          color: color,
          fillColor: color,
          fillOpacity: 0.45,
          radius: (d.confidence || 0.5) >= 0.9 ? 6 : (d.confidence || 0.5) >= 0.7 ? 4 : 2,
          weight: 1,
          className: 'heat-marker'
        }).addTo(mapRef.current);
        markersRef.current.push(marker);
      }
    };
    window.addEventListener('new-detection', onNewDetection);
    return () => window.removeEventListener('new-detection', onNewDetection);
  }, []);

  useEffect(() => {
    fetchDetections();
  }, [filters, selectedLocation]);

  return (
    <div className="bg-black border border-green-500/30 rounded-xl p-3 ring-1 ring-green-500/20">
      <div className="text-green-400 font-semibold mb-2">Global Live Heatmap</div>
      <div id="global-heat-map" className="w-full h-[420px] rounded overflow-hidden" />
    </div>
  );
}

export default GlobalHeatMap;
