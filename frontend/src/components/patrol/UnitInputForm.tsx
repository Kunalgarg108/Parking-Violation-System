import { useState } from 'react'

interface UnitInputFormProps {
  onSubmit: (units: number) => void
  loading: boolean
}

export default function UnitInputForm({ onSubmit, loading }: UnitInputFormProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function validate(input: string): string | null {
    if (input.trim() === '') {
      return 'Number of units is required.'
    }
    const num = Number(input)
    if (!Number.isInteger(num)) {
      return 'Must be a whole number.'
    }
    if (num < 1 || num > 50) {
      return 'Must be between 1 and 50.'
    }
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate(value)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSubmit(Number(value))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    if (error) {
      setError(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <div className="flex flex-col">
        <label htmlFor="patrol-units" className="mb-1 text-sm font-medium text-gray-700">
          Number of Patrol Units
        </label>
        <input
          id="patrol-units"
          type="number"
          value={value}
          onChange={handleChange}
          className={`w-40 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="1–50"
          aria-describedby={error ? 'units-error' : undefined}
          aria-invalid={!!error}
        />
        {error && (
          <p id="units-error" className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Generate Assignments'}
      </button>
    </form>
  )
}
