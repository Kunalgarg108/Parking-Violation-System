/**
 * MapContainer - Leaflet map wrapper component.
 * Renders an OpenStreetMap-based interactive map centered on the city coverage area.
 * Accepts children components (H3Layer, HeatmapLayer) for layer composition.
 */
import { type ReactNode } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/** Default center: Bengaluru, India */
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 10;
const MAX_ZOOM = 18;

interface MapContainerProps {
  /** Map center as [latitude, longitude] */
  center?: [number, number];
  /** Initial zoom level (10-18) */
  zoom?: number;
  /** Child layers to render inside the map */
  children?: ReactNode;
  /** Optional CSS class name */
  className?: string;
}

export default function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  className = 'h-full w-full',
}: MapContainerProps) {
  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMapContainer>
  );
}
