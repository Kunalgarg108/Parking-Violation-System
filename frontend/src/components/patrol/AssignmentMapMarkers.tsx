import type { PatrolAssignment, PriorityLevel } from '../../types'

interface AssignmentMapMarkersProps {
  assignments: PatrolAssignment[]
}

function getMarkerColor(level: PriorityLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
  }
}

/**
 * Visual reference component for patrol assignments on a map.
 * Displays numbered zone markers with priority-based coloring
 * that can be used as a map overlay legend or reference panel.
 */
export default function AssignmentMapMarkers({ assignments }: AssignmentMapMarkersProps) {
  if (assignments.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Assigned Zones Map Reference</h3>
      <div className="flex flex-wrap gap-2">
        {assignments.map((assignment, index) => (
          <div
            key={assignment.unitLabel}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1"
            title={`${assignment.unitLabel} → ${assignment.zoneId} (${assignment.priorityLevel})`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${getMarkerColor(assignment.priorityLevel)}`}
            >
              {index + 1}
            </span>
            <span className="text-xs text-gray-600">{assignment.zoneId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
