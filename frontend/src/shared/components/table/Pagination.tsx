import React from 'react';
import { clsx } from 'clsx';
import { PaginationMeta } from '../../types';
import { PAGINATION_DEFAULT } from '../../constants';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}

export function Pagination({
  meta,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}: PaginationProps): React.JSX.Element {
  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = meta;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
        </p>
        {showLimitSelector && onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          >
            {PAGINATION_DEFAULT.LIMITS.map((l) => (
              <option key={l} value={l}>
                {l} / page
              </option>
            ))}
          </select>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:text-gray-400"
          aria-label="Previous page"
        >
          ←
        </button>
        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={clsx(
                'w-8 h-8 rounded text-sm font-medium',
                page === p
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              )}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:text-gray-400"
          aria-label="Next page"
        >
          →
        </button>
      </nav>
    </div>
  );
}
