import KPICard from './KPICard'
import { formatCount, formatRiskScore } from '../../utils/formatters'
import type { DashboardData } from '../../types'

export interface KPIGridProps {
  data: DashboardData | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export default function KPIGrid({ data, loading, error, onRetry }: KPIGridProps) {
  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Key Performance Indicators"
    >
      <KPICard
        title="Total Active Zones"
        value={data ? formatCount(data.totalActiveZones) : null}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <KPICard
        title="Average Risk Score"
        value={data ? formatRiskScore(data.averageRiskScore100) : null}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <KPICard
        title="Critical Zones"
        value={data ? formatCount(data.totalCriticalZones) : null}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <KPICard
        title="High-Risk Zones"
        value={data ? formatCount(data.totalHighRiskZones) : null}
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
    </section>
  )
}
