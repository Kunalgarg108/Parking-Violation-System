/**
 * RiskMapPage - Full-page Risk Map composing all map components.
 * Supports zone filtering, layer toggling, zone selection with detail panel,
 * search-based navigation, and URL-driven zone centering from Dashboard.
 *
 * Validates: Requirements 3.1, 3.7, 4.5, 13.1
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchZones } from '../services/api';
import { useZoneDetail } from '../hooks/useZoneCache';
import MapContainer from '../components/map/MapContainer';
import H3Layer from '../components/map/H3Layer';
import HeatmapLayer from '../components/map/HeatmapLayer';
import LayerToggle, { type MapLayer } from '../components/map/LayerToggle';
import RiskLegend from '../components/map/RiskLegend';
import ZoneDetailsPanel from '../components/map/ZoneDetailsPanel';
import MapSidebar from '../components/map/MapSidebar';
import SearchBox from '../components/map/SearchBox';
import type { PriorityLevel, Zone } from '../types';

/** Inner component that uses useMap() to handle programmatic map movements */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/** Auto-fits map bounds to loaded zone data */
function AutoFitBounds({ zones }: { zones: Zone[] }) {
  const map = useMap();
  const [hasFitted, setHasFitted] = useState(false);

  useEffect(() => {
    if (!hasFitted && zones.length > 0) {
      const bounds = L.latLngBounds(
        zones.map((z) => [z.latitude, z.longitude] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
        setHasFitted(true);
      }
    }
  }, [zones, hasFitted, map]);

  return null;
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 11;
const ALL_LEVELS: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];

export default function RiskMapPage() {
  const [searchParams] = useSearchParams();

  // Layer state
  const [activeLayer, setActiveLayer] = useState<MapLayer>('h3');

  // Zone selection
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Filter state
  const [minRisk, setMinRisk] = useState(0);
  const [selectedLevels, setSelectedLevels] = useState<PriorityLevel[]>(ALL_LEVELS);

  // Map position state
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // Fetch all zones
  const {
    data: zones = [],
    isError: isZonesError,
  } = useQuery({
    queryKey: ['zones'],
    queryFn: () => fetchZones(),
  });

  // Fetch selected zone detail via cached hook
  const {
    data: selectedZone = null,
    isLoading: isZoneDetailLoading,
  } = useZoneDetail(selectedZoneId);

  // Handle URL search param for zone centering from Dashboard
  useEffect(() => {
    const zoneParam = searchParams.get('zone');
    if (zoneParam && zones.length > 0) {
      const targetZone = zones.find((z) => z.zoneId === zoneParam);
      if (targetZone) {
        setSelectedZoneId(targetZone.zoneId);
        setMapCenter([targetZone.latitude, targetZone.longitude]);
        setMapZoom(15);
      }
    }
  }, [searchParams, zones]);

  // Filter zones based on risk threshold and selected priority levels
  const filteredZones = useMemo(() => {
    return zones.filter(
      (zone) =>
        zone.riskScore100 >= minRisk &&
        selectedLevels.includes(zone.priorityLevel)
    );
  }, [zones, minRisk, selectedLevels]);

  // Handle zone click from H3Layer
  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZoneId(zone.zoneId);
    setMapCenter([zone.latitude, zone.longitude]);
    setMapZoom(15);
  }, []);

  // Handle closing the zone details panel
  const handleCloseDetails = useCallback(() => {
    setSelectedZoneId(null);
  }, []);

  // Handle search location found
  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Sidebar with filters and search */}
      <MapSidebar
        minRisk={minRisk}
        onMinRiskChange={setMinRisk}
        selectedLevels={selectedLevels}
        onSelectedLevelsChange={setSelectedLevels}
      >
        <SearchBox onLocationFound={handleLocationFound} />
      </MapSidebar>

      {/* Map area offset for sidebar */}
      <div className="absolute inset-0 left-72">
        <MapContainer center={mapCenter} zoom={mapZoom}>
          <MapController center={mapCenter} zoom={mapZoom} />
          <AutoFitBounds zones={zones} />
          <H3Layer
            zones={activeLayer === 'h3' ? filteredZones : []}
            onZoneClick={handleZoneClick}
            selectedZoneId={selectedZoneId ?? undefined}
          />
          <HeatmapLayer
            zones={filteredZones}
            visible={activeLayer === 'heatmap'}
          />
        </MapContainer>

        {/* Layer toggle overlay */}
        <LayerToggle activeLayer={activeLayer} onLayerChange={setActiveLayer} />

        {/* Risk legend overlay */}
        <RiskLegend />

        {/* Zone details slide-out panel */}
        <ZoneDetailsPanel
          zone={selectedZone}
          loading={isZoneDetailLoading}
          onClose={handleCloseDetails}
        />

        {/* Error overlay when zone data fails to load */}
        {isZonesError && (
          <div
            className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/30"
            role="alert"
            aria-live="assertive"
          >
            <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
              <p className="text-sm font-medium text-red-700">
                Zone data is temporarily unavailable
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Please try again later or check your connection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
