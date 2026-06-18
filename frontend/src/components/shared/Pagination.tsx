interface PaginationProps {
  totalItems: number
  currentPage: number
  onPageChange: (page: number) => void
  pageSize?: number
}

export default function Pagination({
  totalItems,
  currentPage,
  onPageChange,
  pageSize = 20,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) {
    return null
  }

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <nav className="flex items-center justify-center gap-1 py-4" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        className="rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
          className={`rounded px-3 py-1 text-sm font-medium ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className="rounded px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  )
}

/**
 * Utility function to slice items for a given page.
 * Returns items for the requested page using pageSize (default 20).
 */
export function getPageItems<T>(items: T[], page: number, pageSize: number = 20): T[] {
  const startIndex = (page - 1) * pageSize
  return items.slice(startIndex, startIndex + pageSize)
}

/**
 * Computes total number of pages for a given item count and page size.
 */
export function getTotalPages(totalItems: number, pageSize: number = 20): number {
  return Math.ceil(totalItems / pageSize)
}
