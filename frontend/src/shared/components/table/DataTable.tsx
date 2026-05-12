import React from 'react';
import { LoadingState } from '../feedback/LoadingState/LoadingState';
import { EmptyState } from '../feedback/EmptyState/EmptyState';
import { ErrorState } from '../feedback/ErrorState/ErrorState';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  error,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription,
  onSort,
  sortBy,
  sortOrder,
  stickyHeader = false,
}: DataTableProps<T>): React.JSX.Element {
  const handleSort = (col: Column<T>): void => {
    if (!col.sortable || !onSort) return;
    const newOrder = sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(col.key, newOrder);
  };

  const getCellValue = (col: Column<T>, row: T, index: number): React.ReactNode => {
    if (col.render && col.accessor) {
      const rawValue =
        typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
      return col.render(rawValue, row, index);
    }
    if (col.render) return col.render(undefined, row, index);
    if (col.accessor) {
      return typeof col.accessor === 'function'
        ? col.accessor(row)
        : String(row[col.accessor] ?? '');
    }
    return null;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="table-container">
      <table className="erp-table">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : undefined}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                onClick={() => handleSort(col)}
              >
                <div
                  className={`flex items-center gap-1 ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                >
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                      {sortOrder === 'asc' ? (
                        <path d="M6 2l4 4H2l4-4z" />
                      ) : (
                        <path d="M6 10L2 6h8l-4 4z" />
                      )}
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={keyExtractor(row, index)}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : ''
                  }
                >
                  {getCellValue(col, row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
