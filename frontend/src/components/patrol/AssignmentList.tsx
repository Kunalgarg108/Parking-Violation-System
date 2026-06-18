import type { PatrolAssignment, PriorityLevel } from '../../types'
import { formatRiskScore, formatSeverity } from '../../utils/formatters'
import { riskColor } from '../../utils/riskColors'

interface AssignmentListProps {
  assignments: PatrolAssignment[]
  shortfall: number | null
}

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

export default function AssignmentList({ assignments, shortfall }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-600">No assignments to display.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shortfall !== null && (
        <div
          className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800"
          role="alert"
        >
          <span className="font-medium">Warning:</span> Only {assignments.length} zones qualify
          (risk &ge; 40). {shortfall} unit(s) could not be assigned.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" aria-label="Patrol assignments">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Unit
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Zone ID
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assignment) => (
                <tr key={assignment.unitLabel}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {assignment.unitLabel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {assignment.zoneId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className="font-semibold"
                      style={{ color: riskColor(assignment.riskScore100) }}
                    >
                      {formatRiskScore(assignment.riskScore100)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {formatSeverity(assignment.expectedSeverity)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getPriorityBadgeClasses(assignment.priorityLevel)}`}
                    >
                      {assignment.priorityLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
