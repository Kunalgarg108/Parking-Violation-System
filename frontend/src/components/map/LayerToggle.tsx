/**
 * LayerToggle - Segmented control to switch between H3 Grid and Heatmap visualization modes.
 * Positioned as an overlay on the top-right of the map.
 * Default active layer is 'h3'.
 */

export type MapLayer = 'h3' | 'heatmap';

interface LayerToggleProps {
  /** Currently active visualization layer */
  activeLayer: MapLayer;
  /** Callback when the user switches layers */
  onLayerChange: (layer: MapLayer) => void;
}

export default function LayerToggle({ activeLayer, onLayerChange }: LayerToggleProps) {
  return (
    <div
      className="absolute top-3 right-3 z-[1000] flex rounded-lg bg-white shadow-md border border-gray-200"
      role="group"
      aria-label="Map visualization mode"
    >
      <button
        type="button"
        className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
          activeLayer === 'h3'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={activeLayer === 'h3'}
        onClick={() => onLayerChange('h3')}
      >
        H3 Grid
      </button>
      <button
        type="button"
        className={`px-3 py-1.5 text-sm font-medium rounded-r-lg border-l border-gray-200 transition-colors ${
          activeLayer === 'heatmap'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={activeLayer === 'heatmap'}
        onClick={() => onLayerChange('heatmap')}
      >
        Heatmap
      </button>
    </div>
  );
}
