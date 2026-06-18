import { useQuery } from '@tanstack/react-query'
import { fetchAnalytics } from '../services/api'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import RiskHistogram from '../components/analytics/RiskHistogram'
import PriorityDistribution from '../components/analytics/PriorityDistribution'
import SHAPImportanceChart from '../components/analytics/SHAPImportanceChart'

export default function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>
        <LoadingSpinner size="lg" label="Loading analytics data" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>
        <ErrorMessage
          message="Analytics data is temporarily unavailable. Please try again later."
          retryable={true}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const hasNoData =
    !data ||
    (data.riskHistogram.length === 0 &&
      data.shapFeatureImportance.length === 0 &&
      data.priorityDistribution.low === 0 &&
      data.priorityDistribution.medium === 0 &&
      data.priorityDistribution.high === 0 &&
      data.priorityDistribution.critical === 0)

  if (hasNoData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mb-6 text-gray-500">
          No analytics data is currently available.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
            Risk Histogram — No data
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
            Priority Distribution — No data
          </div>
          <div className="col-span-full flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
            SHAP Feature Importance — No data
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <RiskHistogram data={data.riskHistogram} />
          </section>
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <PriorityDistribution data={data.priorityDistribution} />
          </section>
        </div>
        <SHAPImportanceChart data={data.shapFeatureImportance} />
      </div>
    </div>
  )
}
