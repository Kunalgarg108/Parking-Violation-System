/**
 * HeatmapLayer - Renders a continuous heat gradient overlay using leaflet.heat.
 * Each zone contributes a weighted data point at [lat, lng, intensity].
 *
 * The risk_score_100 values in the dataset follow a heavily right-skewed
 * distribution (mean ~8, most values < 1, only ~16 zones above 50).
 * To produce a visible heatmap at city-wide zoom, we:
 *  - Use a larger radius (35px) so individual points bleed together
 *  - Set max to the effective ceiling of actual data (rather than 100)
 *  - Apply a minimum intensity floor so low-risk zones still contribute faintly
 *  - Set minOpacity so the layer is always perceptible when active
 */
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Zone } from '../../types';

interface HeatmapLayerProps {
  /** Array of zones providing heatmap data points */
  zones: Zone[];
  /** Whether the heatmap layer is visible */
  visible: boolean;
}

/**
 * Maps a raw risk_score_100 (0–100) to a heatmap intensity (0–1).
 * Applies a square-root transform to spread out the low end of the distribution,
 * making zones with risk 5–30 actually visible rather than invisible.
 */
function toIntensity(riskScore100: number): number {
  // Clamp to [0, 100] then normalize with sqrt to expand low values
  const clamped = Math.max(0, Math.min(100, riskScore100));
  return Math.sqrt(clamped / 100); // e.g. risk=1 → 0.1, risk=25 → 0.5, risk=100 → 1.0
}

export default function HeatmapLayer({ zones, visible }: HeatmapLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  // Manage visibility: add/remove layer
  useEffect(() => {
    if (!visible) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Build heatmap data with transformed intensity
    const heatData: [number, number, number][] = zones
      .filter((z) => z.latitude !== 0 && z.longitude !== 0)
      .map((zone) => [
        zone.latitude,
        zone.longitude,
        toIntensity(zone.riskScore100),
      ]);

    if (heatLayerRef.current) {
      heatLayerRef.current.setLatLngs(heatData);
    } else {
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 35,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.3,
        gradient: {
          0.0: '#313695',
          0.2: '#4575b4',
          0.4: '#74add1',
          0.5: '#abd9e9',
          0.6: '#fee090',
          0.7: '#fdae61',
          0.8: '#f46d43',
          0.9: '#d73027',
          1.0: '#a50026',
        },
      });
      heatLayerRef.current.addTo(map);
    }

    // Cleanup only on unmount or when switching away
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [zones, visible, map]);

  return null;
}
