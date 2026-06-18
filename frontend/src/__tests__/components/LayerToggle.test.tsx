import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import LayerToggle from '../../components/map/LayerToggle'

describe('LayerToggle', () => {
  it('renders H3 Grid and Heatmap buttons', () => {
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayer="h3" onLayerChange={onLayerChange} />)

    expect(screen.getByText('H3 Grid')).toBeInTheDocument()
    expect(screen.getByText('Heatmap')).toBeInTheDocument()
  })

  it('marks H3 Grid as pressed when activeLayer is h3', () => {
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayer="h3" onLayerChange={onLayerChange} />)

    expect(screen.getByText('H3 Grid')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Heatmap')).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks Heatmap as pressed when activeLayer is heatmap', () => {
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayer="heatmap" onLayerChange={onLayerChange} />)

    expect(screen.getByText('H3 Grid')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Heatmap')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onLayerChange with heatmap when Heatmap is clicked', async () => {
    const user = userEvent.setup()
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayer="h3" onLayerChange={onLayerChange} />)

    await user.click(screen.getByText('Heatmap'))
    expect(onLayerChange).toHaveBeenCalledWith('heatmap')
  })

  it('calls onLayerChange with h3 when H3 Grid is clicked', async () => {
    const user = userEvent.setup()
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayer="heatmap" onLayerChange={onLayerChange} />)

    await user.click(screen.getByText('H3 Grid'))
    expect(onLayerChange).toHaveBeenCalledWith('h3')
  })

  it('has a group role with accessible label', () => {
    const onLayerChange = vi.fn()
    render(<LayerToggle activeLayer="h3" onLayerChange={onLayerChange} />)

    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Map visualization mode')
  })
})
