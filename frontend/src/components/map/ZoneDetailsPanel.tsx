/**
 * ZoneDetailsPanel - Slide-out panel displaying detailed zone information.
 * Shows H3 index, coordinates, risk metrics, contributing features,
 * and recommended actions when a zone is selected on the map.
 */
import type { ZoneDetail, PriorityLevel } from '../../types'
import { formatCoordinates, formatRiskScore, formatSeverity } from '../../utils/formatters'
import { riskColor } from '../../utils/riskColors'

interface ZoneDetailsPanelProps {
  /** The currently selected zone detail (null when no zone selected) */
  zone: ZoneDetail | null
  /** Whether zone detail is being fetched */
  loading?: boolean
  /** Callback to close the panel */
  onClose: () => void
}

/** Get Tailwind classes for a priority level badge. */
function getPriorityBadgeClasses(level: PriorityLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
  }
}

/** Get background color classes for recommended action by priority level. */
function getActionBackgroundClasses(level: PriorityLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-50 border-red-200'
    case 'high':
      return 'bg-orange-50 border-orange-200'
    case 'medium':
      return 'bg-yellow-50 border-yellow-200'
    case 'low':
      return 'bg-green-50 border-green-200'
  }
}

export default function ZoneDetailsPanel({ zone, loading = false, onClose }: ZoneDetailsPanelProps) {
  const isVisible = zone !== null || loading

  return (
    <div
      className={`absolute right-0 top-0 z-[1000] h-full w-80 transform overflow-y-auto bg-white shadow-lg transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="complementary"
      aria-label="Zone details panel"
      aria-hidden={!isVisible}
    >
      {/* Loading state */}
      {loading && !zone && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="mt-2 text-sm text-gray-500">Loading zone details...</p>
          </div>
        </div>
      )}

      {/* Zone content */}
      {zone && (
        <div className="flex flex-col">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <h2 className="truncate text-sm font-semibold text-gray-900" title={zone.locationDescription || zone.h3Index}>
              {zone.locationDescription || 'Unknown Area'}
            </h2>
            <button
              onClick={onClose}
              className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close zone details"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Location */}
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Location
            </h3>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {zone.locationDescription || 'Unknown Area'}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Lat:</span> {formatCoordinates(zone.latitude)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Lng:</span> {formatCoordinates(zone.longitude)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              <span className="font-medium">H3 Cell:</span> {zone.h3Index}
            </p>
          </div>

          {/* Top Violations */}
          {zone.topViolationDetails && (
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Top Violations
              </h3>
              <p className="text-sm text-gray-700">{zone.topViolationDetails}</p>
            </div>
          )}

          {/* Risk Metrics */}
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              Risk Metrics
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Score</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: riskColor(zone.riskScore100) }}
                >
                  {formatRiskScore(zone.riskScore100)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Severity</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatSeverity(zone.expectedSeverity)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Activity Probability</span>
                <span className="text-sm font-medium text-gray-900">
                  {zone.activityProbability.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority Level</span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getPriorityBadgeClasses(zone.priorityLevel)}`}
                >
                  {zone.priorityLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Contributing Features or Pending Message */}
          {zone.contributingFeatures && zone.contributingFeatures.length > 0 ? (
            <>
              {/* Contributing Features */}
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contributing Features
                </h3>
                <ul className="space-y-2">
                  {zone.contributingFeatures.slice(0, 10).map((feature) => (
                    <li key={feature.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-gray-700" title={feature.name}>
                          {feature.name}
                        </span>
                        <span className="ml-2 shrink-0 text-gray-500">
                          {feature.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${Math.min(feature.importance * 100, 100)}%` }}
                          aria-label={`Importance: ${(feature.importance * 100).toFixed(1)}%`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Action */}
              {zone.recommendedAction && (
                <div className="px-4 py-3">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recommended Action
                  </h3>
                  <div
                    className={`rounded-lg border p-3 ${getActionBackgroundClasses(zone.priorityLevel)}`}
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {zone.recommendedAction.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {zone.recommendedAction.reason}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No prediction data */
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                Predictions are pending for this zone
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
