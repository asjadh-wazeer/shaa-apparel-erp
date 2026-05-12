import { PaginationMeta } from '../interfaces';

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function buildApiResponse<T>(data: T, message?: string): { success: true; data: T; message?: string } {
  return { success: true, data, ...(message ? { message } : {}) };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): { success: true; data: T[]; meta: PaginationMeta } {
  return {
    success: true,
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}
