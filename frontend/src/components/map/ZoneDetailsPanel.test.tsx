import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ZoneDetailsPanel from './ZoneDetailsPanel'
import type { ZoneDetail, ContributingFeature, RecommendedAction } from '../../types'

function createMockZoneDetail(overrides: Partial<ZoneDetail> = {}): ZoneDetail {
  return {
    zoneId: 'zone-001',
    h3Index: '8a2a1072b59ffff',
    latitude: 40.712776,
    longitude: -74.005974,
    riskScore100: 82.5,
    expectedSeverity: 15.73,
    activityProbability: 0.85,
    priorityLevel: 'critical',
    locationDescription: 'Main Street and 5th Avenue',
    contributingFeatures: [
      { name: 'historical_violations', value: 12.5, importance: 0.85 },
      { name: 'time_of_day', value: 14.0, importance: 0.72 },
      { name: 'meter_density', value: 8.3, importance: 0.65 },
    ],
    recommendedAction: {
      type: 'deploy_patrol_immediate',
      description: 'Deploy patrol immediately',
      reason: 'High historical violations and peak hour activity',
    },
    ...overrides,
  }
}

function renderPanel(props: Partial<Parameters<typeof ZoneDetailsPanel>[0]> = {}) {
  const defaultProps = {
    zone: null as ZoneDetail | null,
    loading: false,
    onClose: vi.fn(),
  }
  return render(<ZoneDetailsPanel {...defaultProps} {...props} />)
}

describe('ZoneDetailsPanel', () => {
  it('is hidden when zone is null and not loading', () => {
    renderPanel({ zone: null, loading: false })
    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel).toHaveClass('translate-x-full')
    expect(panel).toHaveAttribute('aria-hidden', 'true')
  })

  it('is visible when zone is provided', () => {
    renderPanel({ zone: createMockZoneDetail() })
    const panel = screen.getByRole('complementary')
    expect(panel).toHaveClass('translate-x-0')
  })

  it('shows loading state when loading without zone', () => {
    renderPanel({ zone: null, loading: true })
    expect(screen.getByText('Loading zone details...')).toBeInTheDocument()
  })

  it('displays H3 index in the header', () => {
    renderPanel({ zone: createMockZoneDetail({ h3Index: '8a2a1072b59ffff' }) })
    expect(screen.getByText('8a2a1072b59ffff')).toBeInTheDocument()
  })

  it('displays coordinates with 6 decimal places', () => {
    renderPanel({ zone: createMockZoneDetail({ latitude: 40.712776, longitude: -74.005974 }) })
    expect(screen.getByText('40.712776')).toBeInTheDocument()
    expect(screen.getByText('-74.005974')).toBeInTheDocument()
  })

  it('displays risk score with 1 decimal formatted and colored', () => {
    renderPanel({ zone: createMockZoneDetail({ riskScore100: 82.456 }) })
    expect(screen.getByText('82.5')).toBeInTheDocument()
  })

  it('displays expected severity with 2 decimal places', () => {
    renderPanel({ zone: createMockZoneDetail({ expectedSeverity: 15.7 }) })
    expect(screen.getByText('15.70')).toBeInTheDocument()
  })

  it('displays priority level badge', () => {
    renderPanel({ zone: createMockZoneDetail({ priorityLevel: 'critical' }) })
    const badge = screen.getByText('critical')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('displays contributing features sorted by importance (top 10 max)', () => {
    const features: ContributingFeature[] = Array.from({ length: 12 }, (_, i) => ({
      name: `feature_${i}`,
      value: 10 - i,
      importance: (12 - i) / 12,
    }))
    renderPanel({ zone: createMockZoneDetail({ contributingFeatures: features }) })

    // Should display first 10 features
    expect(screen.getByText('feature_0')).toBeInTheDocument()
    expect(screen.getByText('feature_9')).toBeInTheDocument()
    // Feature 10 and 11 should not be rendered
    expect(screen.queryByText('feature_10')).not.toBeInTheDocument()
    expect(screen.queryByText('feature_11')).not.toBeInTheDocument()
  })

  it('displays recommended action with description and reason', () => {
    const action: RecommendedAction = {
      type: 'deploy_patrol_immediate',
      description: 'Deploy patrol immediately',
      reason: 'High historical violations and peak hour activity',
    }
    renderPanel({ zone: createMockZoneDetail({ recommendedAction: action }) })

    expect(screen.getByText('Deploy patrol immediately')).toBeInTheDocument()
    expect(screen.getByText('High historical violations and peak hour activity')).toBeInTheDocument()
  })

  it('shows pending message when no contributing features', () => {
    renderPanel({ zone: createMockZoneDetail({ contributingFeatures: [] }) })
    expect(screen.getByText('Predictions are pending for this zone')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderPanel({ zone: createMockZoneDetail(), onClose })

    const closeButton = screen.getByLabelText('Close zone details')
    await user.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders importance bars with correct width', () => {
    const features: ContributingFeature[] = [
      { name: 'high_importance', value: 5.0, importance: 0.8 },
    ]
    renderPanel({ zone: createMockZoneDetail({ contributingFeatures: features }) })

    const bar = screen.getByLabelText('Importance: 80.0%')
    expect(bar).toHaveStyle({ width: '80%' })
  })

  it('colors recommended action section by priority level', () => {
    renderPanel({ zone: createMockZoneDetail({ priorityLevel: 'high' }) })
    const actionSection = screen.getByText('Deploy patrol immediately').closest('div')
    expect(actionSection).toHaveClass('bg-orange-50', 'border-orange-200')
  })
})
