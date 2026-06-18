import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Pagination, { getPageItems, getTotalPages } from '../../components/shared/Pagination'

describe('Pagination Component', () => {
  it('renders page numbers, previous and next buttons', () => {
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={1} onPageChange={onPageChange} />)

    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument()
  })

  it('disables Previous button on first page', () => {
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={1} onPageChange={onPageChange} />)

    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).not.toBeDisabled()
  })

  it('disables Next button on last page', () => {
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={3} onPageChange={onPageChange} />)

    expect(screen.getByLabelText('Next page')).toBeDisabled()
    expect(screen.getByLabelText('Previous page')).not.toBeDisabled()
  })

  it('calls onPageChange with next page when Next is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={1} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with previous page when Previous is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={2} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText('Previous page'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange with the correct page number when a page button is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={1} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText('Page 3'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('renders nothing when total items fit in a single page', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination totalItems={15} currentPage={1} onPageChange={onPageChange} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when totalItems is 0', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination totalItems={0} currentPage={1} onPageChange={onPageChange} />
    )

    expect(container.innerHTML).toBe('')
  })

  it('highlights the current page', () => {
    const onPageChange = vi.fn()
    render(<Pagination totalItems={60} currentPage={2} onPageChange={onPageChange} />)

    const currentPageButton = screen.getByLabelText('Page 2')
    expect(currentPageButton).toHaveAttribute('aria-current', 'page')
  })

  it('uses default pageSize of 20', () => {
    const onPageChange = vi.fn()
    render(<Pagination totalItems={41} currentPage={1} onPageChange={onPageChange} />)

    // 41 items / 20 per page = 3 pages
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument()
    expect(screen.queryByLabelText('Page 4')).not.toBeInTheDocument()
  })

  it('supports custom pageSize', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination totalItems={30} currentPage={1} onPageChange={onPageChange} pageSize={10} />
    )

    // 30 items / 10 per page = 3 pages
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument()
    expect(screen.queryByLabelText('Page 4')).not.toBeInTheDocument()
  })
})

describe('getPageItems', () => {
  const items = Array.from({ length: 50 }, (_, i) => i + 1)

  it('returns first 20 items for page 1', () => {
    const result = getPageItems(items, 1)
    expect(result).toHaveLength(20)
    expect(result[0]).toBe(1)
    expect(result[19]).toBe(20)
  })

  it('returns next 20 items for page 2', () => {
    const result = getPageItems(items, 2)
    expect(result).toHaveLength(20)
    expect(result[0]).toBe(21)
    expect(result[19]).toBe(40)
  })

  it('returns remaining items for the last page', () => {
    const result = getPageItems(items, 3)
    expect(result).toHaveLength(10)
    expect(result[0]).toBe(41)
    expect(result[9]).toBe(50)
  })

  it('returns empty array for page beyond total', () => {
    const result = getPageItems(items, 4)
    expect(result).toHaveLength(0)
  })

  it('returns at most pageSize items', () => {
    const largeItems = Array.from({ length: 100 }, (_, i) => i)
    const result = getPageItems(largeItems, 1, 20)
    expect(result).toHaveLength(20)
  })

  it('handles empty array', () => {
    const result = getPageItems([], 1)
    expect(result).toHaveLength(0)
  })

  it('all items across all pages equal original array (no duplicates/omissions)', () => {
    const allPages: number[] = []
    const totalPages = getTotalPages(items.length)
    for (let p = 1; p <= totalPages; p++) {
      allPages.push(...getPageItems(items, p))
    }
    expect(allPages).toEqual(items)
  })
})

describe('getTotalPages', () => {
  it('returns 1 for items less than or equal to pageSize', () => {
    expect(getTotalPages(20)).toBe(1)
    expect(getTotalPages(1)).toBe(1)
  })

  it('returns correct page count for exact multiples', () => {
    expect(getTotalPages(40)).toBe(2)
    expect(getTotalPages(60)).toBe(3)
  })

  it('returns ceil for non-exact multiples', () => {
    expect(getTotalPages(21)).toBe(2)
    expect(getTotalPages(41)).toBe(3)
  })

  it('returns 0 for 0 items', () => {
    expect(getTotalPages(0)).toBe(0)
  })
})
