import type { MouseEvent } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

type TodoPaginationProps = {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  onPageChange: (page: number) => void
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const start = Math.max(2, Math.min(current - 1, total - 4))
  const end = Math.min(total - 1, Math.max(current + 1, 5))
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index)

  return [
    1,
    ...(start > 2 ? (['ellipsis-start'] as const) : []),
    ...middle,
    ...(end < total - 1 ? (['ellipsis-end'] as const) : []),
    total,
  ]
}

const disabledLink = 'pointer-events-none opacity-50'

export function TodoPagination({ page, totalPages, hrefFor, onPageChange }: TodoPaginationProps) {
  const isFirst = page <= 1
  const isLast = page >= totalPages

  function go(target: number) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (target !== page) onPageChange(target)
    }
  }

  return (
    <Pagination aria-label="Paginação das tarefas" className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={isFirst ? undefined : hrefFor(page - 1)}
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={cn(isFirst && disabledLink)}
            onClick={go(page - 1)}
          />
        </PaginationItem>

        {pageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <PaginationItem key={item}>
              <PaginationLink
                href={hrefFor(item)}
                isActive={item === page}
                aria-label={`Página ${item}`}
                onClick={go(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={isLast ? undefined : hrefFor(page + 1)}
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={cn(isLast && disabledLink)}
            onClick={go(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
