interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
}

export default function LoadingSpinner({ size = 'md', label = 'Loading' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-4" role="status" aria-label={label}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-gray-300 border-t-blue-600`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
