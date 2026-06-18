import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RiskLegend from '../../components/map/RiskLegend'

describe('RiskLegend', () => {
  it('renders all four risk levels', () => {
    render(<RiskLegend />)

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('displays threshold ranges for each level', () => {
    render(<RiskLegend />)

    expect(screen.getByText('(0–40)')).toBeInTheDocument()
    expect(screen.getByText('(40–60)')).toBeInTheDocument()
    expect(screen.getByText('(60–80)')).toBeInTheDocument()
    expect(screen.getByText('(80–100)')).toBeInTheDocument()
  })

  it('renders a heading', () => {
    render(<RiskLegend />)

    expect(screen.getByText('Risk Level')).toBeInTheDocument()
  })

  it('has an accessible label', () => {
    render(<RiskLegend />)

    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Risk level legend')
  })

  it('renders four color swatches with correct background colors', () => {
    const { container } = render(<RiskLegend />)

    const swatches = container.querySelectorAll('[aria-hidden="true"]')
    expect(swatches).toHaveLength(4)

    // jsdom converts hex to rgb format
    const expectedColors = [
      'rgb(34, 197, 94)',   // #22c55e - Green
      'rgb(234, 179, 8)',   // #eab308 - Yellow
      'rgb(249, 115, 22)',  // #f97316 - Orange
      'rgb(239, 68, 68)',   // #ef4444 - Red
    ]
    swatches.forEach((swatch, index) => {
      expect((swatch as HTMLElement).style.backgroundColor).toBe(expectedColors[index])
    })
  })
})
