import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { SHAPFeatureImportance } from '../../types'

export interface SHAPImportanceChartProps {
  data: SHAPFeatureImportance[]
}

const MAX_FEATURES = 20
const COLOR_LIGHT = '#93c5fd' // light blue (low importance)
const COLOR_DARK = '#1d4ed8'  // dark blue (high importance)

/**
 * Interpolates between light and dark blue based on a normalized value (0–1).
 * Uses lightness variation rather than hue, making it accessible to color-blind users.
 */
function getBarColor(normalizedValue: number): string {
  const r = Math.round(
    parseInt(COLOR_LIGHT.slice(1, 3), 16) +
      (parseInt(COLOR_DARK.slice(1, 3), 16) - parseInt(COLOR_LIGHT.slice(1, 3), 16)) * normalizedValue
  )
  const g = Math.round(
    parseInt(COLOR_LIGHT.slice(3, 5), 16) +
      (parseInt(COLOR_DARK.slice(3, 5), 16) - parseInt(COLOR_LIGHT.slice(3, 5), 16)) * normalizedValue
  )
  const b = Math.round(
    parseInt(COLOR_LIGHT.slice(5, 7), 16) +
      (parseInt(COLOR_DARK.slice(5, 7), 16) - parseInt(COLOR_LIGHT.slice(5, 7), 16)) * normalizedValue
  )
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default function SHAPImportanceChart({ data }: SHAPImportanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8"
        role="status"
        aria-label="No SHAP data available"
      >
        <p className="text-gray-500">No SHAP data available</p>
      </div>
    )
  }

  // Sort by importance descending and cap at 20 features
  const sortedData = [...data]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, MAX_FEATURES)

  const maxImportance = sortedData[0]?.importance ?? 1

  // Prepare chart data with reversed order so highest importance appears at the top
  const chartData = [...sortedData].reverse().map((item) => ({
    featureName: item.featureName,
    importance: item.importance,
    normalizedImportance: maxImportance > 0 ? item.importance / maxImportance : 0,
  }))

  const chartHeight = Math.max(400, chartData.length * 32)

  return (
    <section
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-label="Global SHAP Feature Importance chart"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Global SHAP Feature Importance
      </h2>
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 60, left: 160, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              label={{ value: 'Importance', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="category"
              dataKey="featureName"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [value.toFixed(4), 'Importance']}
              labelFormatter={(label: string) => `Feature: ${label}`}
            />
            <Bar dataKey="importance" name="Importance" aria-label="Feature importance bars">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.normalizedImportance)}
                />
              ))}
              <LabelList
                dataKey="importance"
                position="right"
                formatter={(value: number) => value.toFixed(4)}
                style={{ fontSize: 11, fill: '#374151' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
