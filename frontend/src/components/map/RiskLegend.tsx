/**
 * RiskLegend - Always-visible legend showing the 4-level risk color scale.
 * Positioned as an overlay on the bottom-left of the map.
 * Displays color swatch, label, and score range for each priority level.
 */

interface LegendItem {
  color: string;
  label: string;
  range: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { color: '#22c55e', label: 'Low', range: '0–40' },
  { color: '#eab308', label: 'Medium', range: '40–60' },
  { color: '#f97316', label: 'High', range: '60–80' },
  { color: '#ef4444', label: 'Critical', range: '80–100' },
];

export default function RiskLegend() {
  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white/90 shadow-md border border-gray-200 p-3"
      aria-label="Risk level legend"
      role="complementary"
    >
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Risk Level</h4>
      <ul className="space-y-1">
        {LEGEND_ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-gray-600">
            <span
              className="inline-block w-4 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="font-medium">{item.label}</span>
            <span className="text-gray-400">({item.range})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
