interface ErrorMessageProps {
  message: string
  retryable?: boolean
  onRetry?: () => void
}

export default function ErrorMessage({ message, retryable = false, onRetry }: ErrorMessageProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-center"
      role="alert"
    >
      <p className="text-sm text-red-700">{message}</p>
      {retryable && onRetry && (
        <button
          onClick={onRetry}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  )
}
