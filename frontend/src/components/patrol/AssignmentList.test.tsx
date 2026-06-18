import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AssignmentList from './AssignmentList'
import type { PatrolAssignment } from '../../types'

const mockAssignments: PatrolAssignment[] = [
  {
    unitLabel: 'Unit 1',
    zoneId: 'zone_001',
    riskScore100: 85.6,
    expectedSeverity: 12.34,
    priorityLevel: 'critical',
  },
  {
    unitLabel: 'Unit 2',
    zoneId: 'zone_002',
    riskScore100: 62.3,
    expectedSeverity: 8.5,
    priorityLevel: 'high',
  },
  {
    unitLabel: 'Unit 3',
    zoneId: 'zone_003',
    riskScore100: 45.0,
    expectedSeverity: 5.12,
    priorityLevel: 'medium',
  },
]

describe('AssignmentList', () => {
  it('renders empty state when no assignments', () => {
    render(<AssignmentList assignments={[]} shortfall={null} />)
    expect(screen.getByText(/no assignments to display/i)).toBeInTheDocument()
  })

  it('renders assignment table with correct data', () => {
    render(<AssignmentList assignments={mockAssignments} shortfall={null} />)

    expect(screen.getByText('Unit 1')).toBeInTheDocument()
    expect(screen.getByText('zone_001')).toBeInTheDocument()
    expect(screen.getByText('85.6')).toBeInTheDocument()
    expect(screen.getByText('12.34')).toBeInTheDocument()
    expect(screen.getByText('critical')).toBeInTheDocument()

    expect(screen.getByText('Unit 2')).toBeInTheDocument()
    expect(screen.getByText('zone_002')).toBeInTheDocument()
    expect(screen.getByText('62.3')).toBeInTheDocument()
    expect(screen.getByText('8.50')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('formats risk score with 1 decimal place', () => {
    render(<AssignmentList assignments={mockAssignments} shortfall={null} />)
    expect(screen.getByText('45.0')).toBeInTheDocument()
  })

  it('formats severity with 2 decimal places', () => {
    render(<AssignmentList assignments={mockAssignments} shortfall={null} />)
    expect(screen.getByText('5.12')).toBeInTheDocument()
  })

  it('does not show shortfall warning when shortfall is null', () => {
    render(<AssignmentList assignments={mockAssignments} shortfall={null} />)
    expect(screen.queryByText(/could not be assigned/i)).not.toBeInTheDocument()
  })

  it('shows shortfall warning when shortfall is present', () => {
    render(<AssignmentList assignments={mockAssignments} shortfall={2} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Only 3 zones qualify')
    expect(alert).toHaveTextContent('2 unit(s) could not be assigned')
  })

  it('applies priority badge classes correctly', () => {
    render(<AssignmentList assignments={mockAssignments} shortfall={null} />)
    const criticalBadge = screen.getByText('critical')
    expect(criticalBadge).toHaveClass('bg-red-100', 'text-red-800')

    const highBadge = screen.getByText('high')
    expect(highBadge).toHaveClass('bg-orange-100', 'text-orange-800')

    const mediumBadge = screen.getByText('medium')
    expect(mediumBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })
})
