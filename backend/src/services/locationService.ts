/**
 * Lightweight location labeling for Bengaluru zones.
 * Maps lat/lon to nearest known locality using a static grid.
 * Results are cached per H3 cell ID.
 */

interface Locality {
  name: string;
  lat: number;
  lon: number;
}

// Well-known Bengaluru localities with approximate centroids
const BENGALURU_LOCALITIES: Locality[] = [
  { name: 'MG Road', lat: 12.9716, lon: 77.6070 },
  { name: 'Indiranagar', lat: 12.9784, lon: 77.6408 },
  { name: 'Koramangala', lat: 12.9352, lon: 77.6245 },
  { name: 'Whitefield', lat: 12.9698, lon: 77.7500 },
  { name: 'Electronic City', lat: 12.8390, lon: 77.6770 },
  { name: 'Yeshwanthpur', lat: 13.0220, lon: 77.5440 },
  { name: 'Hebbal', lat: 13.0358, lon: 77.5970 },
  { name: 'Majestic', lat: 12.9767, lon: 77.5713 },
  { name: 'Jayanagar', lat: 12.9250, lon: 77.5938 },
  { name: 'JP Nagar', lat: 12.9063, lon: 77.5857 },
  { name: 'Banashankari', lat: 12.9255, lon: 77.5468 },
  { name: 'Rajajinagar', lat: 12.9900, lon: 77.5520 },
  { name: 'Malleshwaram', lat: 13.0035, lon: 77.5644 },
  { name: 'HSR Layout', lat: 12.9116, lon: 77.6389 },
  { name: 'BTM Layout', lat: 12.9166, lon: 77.6101 },
  { name: 'Marathahalli', lat: 12.9591, lon: 77.6974 },
  { name: 'Bellandur', lat: 12.9262, lon: 77.6762 },
  { name: 'Sarjapur Road', lat: 12.9107, lon: 77.6872 },
  { name: 'Yelahanka', lat: 13.1007, lon: 77.5963 },
  { name: 'RT Nagar', lat: 13.0210, lon: 77.5960 },
  { name: 'Basavanagudi', lat: 12.9422, lon: 77.5755 },
  { name: 'Vijayanagar', lat: 12.9719, lon: 77.5332 },
  { name: 'Nagarbhavi', lat: 12.9610, lon: 77.5090 },
  { name: 'Peenya', lat: 13.0295, lon: 77.5189 },
  { name: 'Bannerghatta Road', lat: 12.8876, lon: 77.5975 },
  { name: 'KR Puram', lat: 13.0090, lon: 77.6960 },
  { name: 'Mahadevapura', lat: 12.9988, lon: 77.6830 },
  { name: 'Hennur', lat: 13.0450, lon: 77.6370 },
  { name: 'Thanisandra', lat: 13.0590, lon: 77.6250 },
  { name: 'Kengeri', lat: 12.9060, lon: 77.4870 },
  { name: 'RR Nagar', lat: 12.9280, lon: 77.5170 },
  { name: 'Bommanahalli', lat: 12.9010, lon: 77.6180 },
  { name: 'Silk Board', lat: 12.9170, lon: 77.6230 },
  { name: 'Domlur', lat: 12.9610, lon: 77.6370 },
  { name: 'Ulsoor', lat: 12.9830, lon: 77.6200 },
  { name: 'Shivajinagar', lat: 12.9857, lon: 77.6050 },
  { name: 'Frazer Town', lat: 12.9960, lon: 77.6130 },
  { name: 'Sadashivanagar', lat: 13.0060, lon: 77.5800 },
  { name: 'Vasanth Nagar', lat: 12.9900, lon: 77.5900 },
  { name: 'Cunningham Road', lat: 12.9830, lon: 77.5850 },
];

// In-memory cache: h3CellId → locationName
const locationCache = new Map<string, string>();

/**
 * Haversine-based distance (simplified for short distances within a city).
 * Returns approximate distance in km.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest Bengaluru locality name for given coordinates.
 * Appends "Area" suffix for consistency.
 */
export function getLocationName(lat: number, lon: number): string {
  let nearest = BENGALURU_LOCALITIES[0];
  let minDist = Infinity;

  for (const locality of BENGALURU_LOCALITIES) {
    const dist = haversineDistance(lat, lon, locality.lat, locality.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = locality;
    }
  }

  return `${nearest.name} Area`;
}

/**
 * Get or compute cached location name for an H3 cell.
 */
export function getCachedLocationName(h3CellId: string, lat: number, lon: number): string {
  const cached = locationCache.get(h3CellId);
  if (cached) return cached;

  const name = getLocationName(lat, lon);
  locationCache.set(h3CellId, name);
  return name;
}

/**
 * Clear the location cache (useful for testing).
 */
export function clearLocationCache(): void {
  locationCache.clear();
}
