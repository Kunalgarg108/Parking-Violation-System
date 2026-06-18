import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import UnitInputForm from './UnitInputForm'

describe('UnitInputForm', () => {
  it('renders the input and submit button', () => {
    render(<UnitInputForm onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByLabelText(/number of patrol units/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate assignments/i })).toBeInTheDocument()
  })

  it('calls onSubmit with valid integer input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitInputForm onSubmit={onSubmit} loading={false} />)

    const input = screen.getByLabelText(/number of patrol units/i)
    await user.type(input, '5')
    await user.click(screen.getByRole('button', { name: /generate assignments/i }))

    expect(onSubmit).toHaveBeenCalledWith(5)
  })

  it('shows error for empty input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitInputForm onSubmit={onSubmit} loading={false} />)

    await user.click(screen.getByRole('button', { name: /generate assignments/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error for value less than 1', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitInputForm onSubmit={onSubmit} loading={false} />)

    const input = screen.getByLabelText(/number of patrol units/i)
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: /generate assignments/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 50/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error for value greater than 50', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitInputForm onSubmit={onSubmit} loading={false} />)

    const input = screen.getByLabelText(/number of patrol units/i)
    await user.type(input, '51')
    await user.click(screen.getByRole('button', { name: /generate assignments/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 50/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error for non-integer value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitInputForm onSubmit={onSubmit} loading={false} />)

    const input = screen.getByLabelText(/number of patrol units/i)
    await user.type(input, '3.5')
    await user.click(screen.getByRole('button', { name: /generate assignments/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/whole number/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables button while loading', () => {
    render(<UnitInputForm onSubmit={vi.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })

  it('clears error when user types again', async () => {
    const user = userEvent.setup()
    render(<UnitInputForm onSubmit={vi.fn()} loading={false} />)

    // Trigger error
    await user.click(screen.getByRole('button', { name: /generate assignments/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Type to clear
    const input = screen.getByLabelText(/number of patrol units/i)
    await user.type(input, '5')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
