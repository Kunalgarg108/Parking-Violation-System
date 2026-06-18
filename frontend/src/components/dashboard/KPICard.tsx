import LoadingSpinner from '../shared/LoadingSpinner'
import ErrorMessage from '../shared/ErrorMessage'

export interface KPICardProps {
  title: string
  value: string | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export default function KPICard({ title, value, loading, error, onRetry }: KPICardProps) {
  return (
    <article
      className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-label={title}
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 min-h-[2.5rem] flex items-center justify-center">
        {loading && <LoadingSpinner size="sm" label={`Loading ${title}`} />}
        {!loading && error && (
          <ErrorMessage message={error} retryable={!!onRetry} onRetry={onRetry} />
        )}
        {!loading && !error && value !== null && (
          <p className="text-3xl font-bold text-gray-900" aria-live="polite">
            {value}
          </p>
        )}
      </div>
    </article>
  )
}
