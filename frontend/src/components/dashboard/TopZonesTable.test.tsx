import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import TopZonesTable from './TopZonesTable'
import type { Zone } from '../../types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function createMockZone(overrides: Partial<Zone> = {}): Zone {
  return {
    zoneId: 'zone-001',
    h3Index: '8a2a1072b59ffff',
    latitude: 40.7128,
    longitude: -74.006,
    riskScore100: 75.5,
    expectedSeverity: 12.345,
    activityProbability: 0.8,
    priorityLevel: 'high',
    locationDescription: 'Test location description',
    ...overrides,
  }
}

function renderTable(props: Partial<Parameters<typeof TopZonesTable>[0]> = {}) {
  const defaultProps = {
    zones: [] as Zone[],
    loading: false,
    error: null,
    onRetry: vi.fn(),
  }
  return render(
    <MemoryRouter>
      <TopZonesTable {...defaultProps} {...props} />
    </MemoryRouter>
  )
}

describe('TopZonesTable', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders loading state', () => {
    renderTable({ loading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders error state with retry button', () => {
    const onRetry = vi.fn()
    renderTable({ error: 'Something went wrong', onRetry })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('renders empty state when no zones', () => {
    renderTable({ zones: [] })
    expect(screen.getByText('No zones available.')).toBeInTheDocument()
  })

  it('renders zone data with correct formatting', () => {
    const zones = [
      createMockZone({
        zoneId: 'zone-A',
        riskScore100: 82.456,
        expectedSeverity: 15.7,
        priorityLevel: 'critical',
        locationDescription: 'Main Street and 5th Avenue',
      }),
    ]
    renderTable({ zones })

    // Location is now the primary column (zone ID in title attribute)
    expect(screen.getByText('Main Street and 5th Avenue')).toBeInTheDocument()
    expect(screen.getByTitle('zone-A')).toBeInTheDocument()
    expect(screen.getByText('82.5')).toBeInTheDocument() // 1 decimal
    expect(screen.getByText('15.70')).toBeInTheDocument() // 2 decimals
    expect(screen.getByText('critical')).toBeInTheDocument()
  })

  it('sorts zones by descending risk score', () => {
    const zones = [
      createMockZone({ zoneId: 'low-zone', riskScore100: 30, locationDescription: 'Low Area' }),
      createMockZone({ zoneId: 'high-zone', riskScore100: 90, locationDescription: 'High Area' }),
      createMockZone({ zoneId: 'mid-zone', riskScore100: 60, locationDescription: 'Mid Area' }),
    ]
    renderTable({ zones })

    const rows = screen.getAllByRole('row').slice(1) // skip header
    // Zone IDs are now in title attributes; location descriptions are visible
    expect(within(rows[0]).getByTitle('high-zone')).toBeInTheDocument()
    expect(within(rows[1]).getByTitle('mid-zone')).toBeInTheDocument()
    expect(within(rows[2]).getByTitle('low-zone')).toBeInTheDocument()
  })

  it('shows full location description without truncation', () => {
    const longDescription = 'A'.repeat(120)
    const zones = [createMockZone({ locationDescription: longDescription })]
    renderTable({ zones })

    // Location description is now shown in full (no truncation)
    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })

  it('does not truncate location descriptions of 100 chars or fewer', () => {
    const description = 'B'.repeat(100)
    const zones = [createMockZone({ locationDescription: description })]
    renderTable({ zones })

    expect(screen.getByText(description)).toBeInTheDocument()
  })

  it('navigates to map with zone id on row click', async () => {
    const user = userEvent.setup()
    const zones = [createMockZone({ zoneId: 'zone-123' })]
    renderTable({ zones })

    const row = screen.getAllByRole('row')[1] // first data row
    await user.click(row)
    expect(mockNavigate).toHaveBeenCalledWith('/map?zone=zone-123')
  })

  it('navigates on keyboard Enter press', async () => {
    const user = userEvent.setup()
    const zones = [createMockZone({ zoneId: 'zone-456' })]
    renderTable({ zones })

    const row = screen.getAllByRole('row')[1]
    row.focus()
    await user.keyboard('{Enter}')
    expect(mockNavigate).toHaveBeenCalledWith('/map?zone=zone-456')
  })

  it('renders priority badges with correct styling', () => {
    const zones = [
      createMockZone({ zoneId: 'z1', priorityLevel: 'critical', riskScore100: 95 }),
      createMockZone({ zoneId: 'z2', priorityLevel: 'low', riskScore100: 20 }),
    ]
    renderTable({ zones })

    const criticalBadge = screen.getByText('critical')
    const lowBadge = screen.getByText('low')

    expect(criticalBadge).toHaveClass('bg-red-100', 'text-red-800')
    expect(lowBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('paginates with 20 items per page', () => {
    const zones = Array.from({ length: 25 }, (_, i) =>
      createMockZone({ zoneId: `zone-${i}`, riskScore100: 100 - i })
    )
    renderTable({ zones })

    // Should show 20 data rows on the first page
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(20)

    // Pagination should be visible
    expect(screen.getByLabelText('Pagination')).toBeInTheDocument()
  })

  it('changes page when pagination is clicked', async () => {
    const user = userEvent.setup()
    const zones = Array.from({ length: 25 }, (_, i) =>
      createMockZone({ zoneId: `zone-${String(i).padStart(3, '0')}`, riskScore100: 100 - i })
    )
    renderTable({ zones })

    // Click page 2
    await user.click(screen.getByLabelText('Page 2'))

    // Should show 5 data rows on page 2
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(5)
  })
})
