import { useQuery } from '@tanstack/react-query'
import { fetchSHAP } from '../../services/api'
import SHAPImportanceChart from '../analytics/SHAPImportanceChart'
import LoadingSpinner from '../shared/LoadingSpinner'
import ErrorMessage from '../shared/ErrorMessage'

/**
 * Reusable panel that fetches SHAP feature importance data and renders
 * it via SHAPImportanceChart. Shows loading/error states as appropriate.
 *
 * Requirement 6.5: If SHAP data is not available, displays a message
 * indicating global feature importance data is not currently available.
 */
export default function SHAPImportancePanel() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['shap'],
    queryFn: fetchSHAP,
  })

  if (isLoading) {
    return <LoadingSpinner label="Loading SHAP data" />
  }

  if (isError) {
    return (
      <ErrorMessage
        message="Global feature importance data is not currently available."
        retryable
        onRetry={() => refetch()}
      />
    )
  }

  return <SHAPImportanceChart data={data ?? []} />
}
