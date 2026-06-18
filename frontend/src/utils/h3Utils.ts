/**
 * H3 hexagonal spatial index utilities.
 * Converts H3 cell indices to GeoJSON-compatible polygon coordinates
 * for Leaflet map rendering.
 */
import { cellToBoundary, cellToLatLng } from 'h3-js';

/**
 * Convert an H3 index to a GeoJSON Polygon coordinate array.
 * GeoJSON uses [longitude, latitude] order, and the ring must be closed
 * (first point === last point).
 *
 * @param h3Index - A valid H3 cell index string
 * @returns Array of [lng, lat] coordinate pairs forming a closed polygon ring
 */
export function h3ToGeoJsonPolygon(h3Index: string): [number, number][] {
  // cellToBoundary returns [lat, lng][] pairs
  const boundary = cellToBoundary(h3Index);

  // Convert to GeoJSON [lng, lat] order
  const coords: [number, number][] = boundary.map(
    ([lat, lng]) => [lng, lat] as [number, number]
  );

  // Close the polygon ring
  coords.push(coords[0]);

  return coords;
}

/**
 * Get the centroid of an H3 cell as [latitude, longitude].
 *
 * @param h3Index - A valid H3 cell index string
 * @returns Tuple of [latitude, longitude]
 */
export function h3ToLatLng(h3Index: string): [number, number] {
  return cellToLatLng(h3Index) as [number, number];
}
