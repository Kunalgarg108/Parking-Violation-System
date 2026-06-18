import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPatrolAssignments } from '../services/api'
import UnitInputForm from '../components/patrol/UnitInputForm'
import AssignmentList from '../components/patrol/AssignmentList'
import AssignmentMapMarkers from '../components/patrol/AssignmentMapMarkers'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

export default function PatrolPlannerPage() {
  const [units, setUnits] = useState<number | null>(null)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['patrolAssignments', units],
    queryFn: () => fetchPatrolAssignments(units!),
    enabled: units !== null,
  })

  function handleSubmit(requestedUnits: number) {
    setUnits(requestedUnits)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Patrol Planner</h1>

      <div className="space-y-6">
        <section aria-label="Unit input">
          <UnitInputForm onSubmit={handleSubmit} loading={isLoading} />
        </section>

        {isLoading && <LoadingSpinner label="Generating patrol assignments" />}

        {error && (
          <ErrorMessage
            message={(error as Error).message}
            retryable
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <>
            <section aria-label="Assignment map markers">
              <AssignmentMapMarkers assignments={data.assignments} />
            </section>

            <section aria-label="Patrol assignments">
              <AssignmentList
                assignments={data.assignments}
                shortfall={data.shortfall}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
