import { useQuery } from '@tanstack/react-query'
import { fetchDashboard, fetchZones } from '../services/api'
import KPIGrid from '../components/dashboard/KPIGrid'
import TopZonesTable from '../components/dashboard/TopZonesTable'

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: () => fetchZones(),
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="space-y-8">
        <KPIGrid
          data={dashboardQuery.data ?? null}
          loading={dashboardQuery.isLoading}
          error={dashboardQuery.error ? (dashboardQuery.error as Error).message : null}
          onRetry={() => dashboardQuery.refetch()}
        />

        <section aria-label="Top Risk Zones">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Top Risk Zones</h2>
          <TopZonesTable
            zones={zonesQuery.data ?? []}
            loading={zonesQuery.isLoading}
            error={zonesQuery.error ? (zonesQuery.error as Error).message : null}
            onRetry={() => zonesQuery.refetch()}
          />
        </section>
      </div>
    </div>
  )
}
