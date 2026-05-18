import { apiSlice } from '../../../api/apiSlice';
import { PaginatedResponse } from '../../../shared/types';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  description?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
}

export interface QueryAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const auditLogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<PaginatedResponse<AuditLogEntry>, QueryAuditLogsParams>({
      query: (params = {}) => ({ url: '/audit-logs', params }),
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
