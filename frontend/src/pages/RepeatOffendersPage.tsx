import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRepeatOffenders } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

const PAGE_SIZE = 20

export default function RepeatOffendersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
    // Simple debounce via timeout
    clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__searchTimeout)
    ;(window as unknown as Record<string, ReturnType<typeof setTimeout>>).__searchTimeout = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['repeat-offenders', debouncedSearch, page],
    queryFn: () =>
      fetchRepeatOffenders({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortOrder: 'desc',
      }),
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Repeat Offenders</h1>
        <p className="mt-1 text-sm text-gray-600">
          Vehicles with multiple parking violations, sorted by violation count.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by vehicle number..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Search by vehicle number"
        />
      </div>

      {isLoading && <LoadingSpinner label="Loading repeat offenders" />}

      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load data'}
          retryable
          onRetry={() => refetch()}
        />
      )}

      {data && data.offenders.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            {debouncedSearch ? 'No vehicles match your search.' : 'No repeat offenders found.'}
          </p>
        </div>
      )}

      {data && data.offenders.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Repeat offenders">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vehicle Number
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Vehicle Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Violation Count
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Seen
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Most Common Area
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Most Common Violations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.offenders.map((offender) => (
                  <tr key={offender.vehicleNumber} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {offender.vehicleNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {offender.vehicleType || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                        {offender.violationCount}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {offender.lastSeen ? new Date(offender.lastSeen).toLocaleDateString() : '—'}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-700" title={offender.mostCommonArea}>
                      {offender.mostCommonArea || '—'}
                    </td>
                    <td className="max-w-[250px] truncate px-4 py-3 text-sm text-gray-700" title={offender.mostCommonViolations}>
                      {offender.mostCommonViolations || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
