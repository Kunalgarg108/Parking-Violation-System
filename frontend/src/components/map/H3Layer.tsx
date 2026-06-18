/**
 * H3Layer - Renders H3 hexagonal cells as GeoJSON polygons on the map.
 * Each cell is colored by its risk score using the 4-level priority color scheme.
 * Supports zone selection and click interaction.
 */
import { useMemo, useCallback } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import type { Zone } from '../../types';
import { h3ToGeoJsonPolygon } from '../../utils/h3Utils';
import { riskColor } from '../../utils/riskColors';

interface H3LayerProps {
  /** Array of zones to render as hexagonal cells */
  zones: Zone[];
  /** Callback when a zone polygon is clicked */
  onZoneClick?: (zone: Zone) => void;
  /** ID of the currently selected zone for highlight styling */
  selectedZoneId?: string;
}

interface H3CellData {
  zone: Zone;
  positions: [number, number][];
}

export default function H3Layer({ zones, onZoneClick, selectedZoneId }: H3LayerProps) {
  // Memoize polygon data to avoid recomputing H3 boundaries on every render
  const cellData = useMemo<H3CellData[]>(() => {
    return zones.map((zone) => {
      // h3ToGeoJsonPolygon returns [lng, lat][] - Leaflet needs [lat, lng][]
      const geoJsonCoords = h3ToGeoJsonPolygon(zone.h3Index);
      const positions: [number, number][] = geoJsonCoords.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      return { zone, positions };
    });
  }, [zones]);

  const getPathOptions = useCallback(
    (zone: Zone): PathOptions => {
      const isSelected = zone.zoneId === selectedZoneId;
      return {
        fillColor: riskColor(zone.riskScore100),
        fillOpacity: isSelected ? 0.8 : 0.6,
        color: isSelected ? '#1e40af' : '#374151',
        weight: isSelected ? 3 : 1,
      };
    },
    [selectedZoneId]
  );

  return (
    <>
      {cellData.map(({ zone, positions }) => (
        <Polygon
          key={zone.zoneId}
          positions={positions}
          pathOptions={getPathOptions(zone)}
          eventHandlers={{
            click: () => onZoneClick?.(zone),
          }}
        >
          <Tooltip>
            <div>
              <strong>{zone.locationDescription}</strong>
              <br />
              Risk Score: {zone.riskScore100.toFixed(1)}
              <br />
              Priority: {zone.priorityLevel}
            </div>
          </Tooltip>
        </Polygon>
      ))}
    </>
  );
}
