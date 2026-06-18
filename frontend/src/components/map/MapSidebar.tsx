/**
 * MapSidebar - Left sidebar panel for the Risk Map page.
 * Provides filtering controls: risk threshold slider and priority level checkboxes.
 * Filter changes propagate to the parent to update H3Layer within 1 second.
 *
 * Validates: Requirements 13.3, 13.4
 */
import type { PriorityLevel } from '../../types';

interface MapSidebarProps {
  /** Current minimum risk threshold (0–100) */
  minRisk: number;
  /** Callback when the risk threshold changes */
  onMinRiskChange: (value: number) => void;
  /** Currently selected priority levels */
  selectedLevels: PriorityLevel[];
  /** Callback when selected priority levels change */
  onSelectedLevelsChange: (levels: PriorityLevel[]) => void;
  /** Optional children to render at the top (e.g., SearchBox) */
  children?: React.ReactNode;
}

const PRIORITY_LEVELS: { value: PriorityLevel; label: string }[] = [
  { value: 'low', label: 'Low (0–40)' },
  { value: 'medium', label: 'Medium (40–60)' },
  { value: 'high', label: 'High (60–80)' },
  { value: 'critical', label: 'Critical (80–100)' },
];

export default function MapSidebar({
  minRisk,
  onMinRiskChange,
  selectedLevels,
  onSelectedLevelsChange,
  children,
}: MapSidebarProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMinRiskChange(Number(e.target.value));
  };

  const handleCheckboxChange = (level: PriorityLevel) => {
    if (selectedLevels.includes(level)) {
      onSelectedLevelsChange(selectedLevels.filter((l) => l !== level));
    } else {
      onSelectedLevelsChange([...selectedLevels, level]);
    }
  };

  return (
    <aside
      className="absolute left-0 top-0 h-full w-72 bg-white shadow-lg z-[1000] overflow-y-auto"
      aria-label="Map filters sidebar"
    >
      <div className="p-4 space-y-6">
        {/* Optional children (SearchBox) rendered at the top */}
        {children}

        {/* Risk Threshold Slider */}
        <div>
          <label
            htmlFor="risk-threshold-slider"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Minimum Risk Score: {minRisk}
          </label>
          <input
            id="risk-threshold-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={minRisk}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={minRisk}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Priority Level Checkboxes */}
        <div>
          <span className="block text-sm font-semibold text-gray-700 mb-2">
            Priority Levels
          </span>
          <div className="space-y-2">
            {PRIORITY_LEVELS.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(value)}
                  onChange={() => handleCheckboxChange(value)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
