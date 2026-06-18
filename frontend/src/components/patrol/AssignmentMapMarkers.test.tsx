import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AssignmentMapMarkers from './AssignmentMapMarkers'
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
]

describe('AssignmentMapMarkers', () => {
  it('renders nothing when assignments is empty', () => {
    const { container } = render(<AssignmentMapMarkers assignments={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders zone IDs for each assignment', () => {
    render(<AssignmentMapMarkers assignments={mockAssignments} />)
    expect(screen.getByText('zone_001')).toBeInTheDocument()
    expect(screen.getByText('zone_002')).toBeInTheDocument()
  })

  it('renders numbered markers', () => {
    render(<AssignmentMapMarkers assignments={mockAssignments} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<AssignmentMapMarkers assignments={mockAssignments} />)
    expect(screen.getByText('Assigned Zones Map Reference')).toBeInTheDocument()
  })

  it('applies priority-based color classes to markers', () => {
    render(<AssignmentMapMarkers assignments={mockAssignments} />)
    const marker1 = screen.getByText('1')
    expect(marker1).toHaveClass('bg-red-500')

    const marker2 = screen.getByText('2')
    expect(marker2).toHaveClass('bg-orange-500')
  })
})
