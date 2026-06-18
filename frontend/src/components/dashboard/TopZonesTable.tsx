import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Zone, PriorityLevel } from '../../types'
import { formatRiskScore, formatSeverity } from '../../utils/formatters'
import { riskColor } from '../../utils/riskColors'
import Pagination, { getPageItems } from '../shared/Pagination'
import LoadingSpinner from '../shared/LoadingSpinner'
import ErrorMessage from '../shared/ErrorMessage'

interface TopZonesTableProps {
  zones: Zone[]
  loading: boolean
  error: string | null
  onRetry?: () => void
}

const PAGE_SIZE = 20

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

/** Truncate text to a given length, adding ellipsis if needed */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

export default function TopZonesTable({ zones, loading, error, onRetry }: TopZonesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  // Sort zones by descending riskScore100
  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => b.riskScore100 - a.riskScore100)
  }, [zones])

  // Get items for current page
  const pageZones = useMemo(() => {
    return getPageItems(sortedZones, currentPage, PAGE_SIZE)
  }, [sortedZones, currentPage])

  const handleRowClick = (zoneId: string) => {
    navigate(`/map?zone=${zoneId}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return <LoadingSpinner label="Loading zones" />
  }

  if (error) {
    return <ErrorMessage message={error} retryable={!!onRetry} onRetry={onRetry} />
  }

  if (zones.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">No zones available.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" aria-label="Top risk zones">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Risk Score
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Expected Severity
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Priority
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Details
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Map
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageZones.map((zone) => (
              <tr
                key={zone.zoneId}
                onClick={() => handleRowClick(zone.zoneId)}
                className="cursor-pointer transition-colors hover:bg-blue-50 focus-within:bg-blue-50"
                role="row"
                tabIndex={0}
                aria-label={`${zone.locationDescription || zone.zoneId}, risk score ${formatRiskScore(zone.riskScore100)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRowClick(zone.zoneId)
                  }
                }}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900" title={zone.zoneId}>
                  {zone.locationDescription || 'Unknown Area'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className="font-semibold"
                    style={{ color: riskColor(zone.riskScore100) }}
                  >
                    {formatRiskScore(zone.riskScore100)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {formatSeverity(zone.expectedSeverity)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getPriorityBadgeClasses(zone.priorityLevel)}`}
                  >
                    {zone.priorityLevel}
                  </span>
                </td>
                <td
                  className="max-w-[200px] px-4 py-3 text-sm text-gray-600"
                  title={zone.topViolationDetails || ''}
                >
                  {zone.topViolationDetails ? truncateText(zone.topViolationDetails, 60) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/map?zone=${zone.zoneId}`)
                    }}
                    className="inline-flex items-center rounded px-2 py-1 text-blue-600 hover:bg-blue-100 hover:text-blue-800"
                    aria-label={`View ${zone.locationDescription || zone.zoneId} on map`}
                    title="View on map"
                  >
                    📍
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        totalItems={sortedZones.length}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
