import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse } from '../../../shared/types';
import {
  SaleRecord,
  SalesStats,
  CatalogItem,
  PosConfig,
  CreateSalePayload,
  UpdateSalePayload,
  UpsertPosConfigPayload,
  SalesQueryParams,
  PosSyncLog,
  SyncStatusResponse,
} from '../types/pos.types';

export const posApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesStats: builder.query<ApiResponse<SalesStats>, void>({
      query: () => '/pos-integration/stats',
      providesTags: [{ type: 'SaleRecord', id: 'STATS' }],
    }),

    getCatalog: builder.query<ApiResponse<CatalogItem[]>, void>({
      query: () => '/pos-integration/catalog',
      providesTags: [{ type: 'FinishedGood', id: 'CATALOG' }],
    }),

    getPosConfig: builder.query<ApiResponse<PosConfig | null>, void>({
      query: () => '/pos-integration/config',
      providesTags: [{ type: 'PosConfig', id: 'CONFIG' }],
    }),

    upsertPosConfig: builder.mutation<ApiResponse<PosConfig>, UpsertPosConfigPayload>({
      query: (body) => ({ url: '/pos-integration/config', method: 'POST', body }),
      invalidatesTags: [{ type: 'PosConfig', id: 'CONFIG' }],
    }),

    getSales: builder.query<PaginatedResponse<SaleRecord>, SalesQueryParams>({
      query: (params = {}) => ({ url: '/pos-integration/sales', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'SaleRecord' as const, id })),
              { type: 'SaleRecord', id: 'LIST' },
            ]
          : [{ type: 'SaleRecord', id: 'LIST' }],
    }),

    createSale: builder.mutation<ApiResponse<SaleRecord>, CreateSalePayload>({
      query: (body) => ({ url: '/pos-integration/sales', method: 'POST', body }),
      invalidatesTags: [
        { type: 'SaleRecord', id: 'LIST' },
        { type: 'SaleRecord', id: 'STATS' },
        { type: 'FinishedGood', id: 'CATALOG' },
        { type: 'FinishedGood', id: 'LIST' },
        { type: 'FinishedGood', id: 'STATS' },
      ],
    }),

    updateSale: builder.mutation<ApiResponse<SaleRecord>, { id: string; data: UpdateSalePayload }>({
      query: ({ id, data }) => ({ url: `/pos-integration/sales/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'SaleRecord', id },
        { type: 'SaleRecord', id: 'LIST' },
        { type: 'SaleRecord', id: 'STATS' },
      ],
    }),

    deleteSale: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/pos-integration/sales/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'SaleRecord', id: 'LIST' },
        { type: 'SaleRecord', id: 'STATS' },
        { type: 'FinishedGood', id: 'CATALOG' },
      ],
    }),

    // ── Website Sync ────────────────────────────────────────────────────────

    triggerSync: builder.mutation<ApiResponse<{ jobId: string | number }>, void>({
      query: () => ({ url: '/pos-integration/sync/trigger', method: 'POST' }),
      invalidatesTags: [{ type: 'PosConfig', id: 'SYNC_STATUS' }],
    }),

    getSyncStatus: builder.query<ApiResponse<SyncStatusResponse>, void>({
      query: () => '/pos-integration/sync/status',
      providesTags: [{ type: 'PosConfig', id: 'SYNC_STATUS' }],
    }),

    getSyncLogs: builder.query<ApiResponse<PosSyncLog[]>, void>({
      query: () => '/pos-integration/sync/logs',
      providesTags: [{ type: 'PosConfig', id: 'SYNC_LOGS' }],
    }),
  }),
});

export const {
  useGetSalesStatsQuery,
  useGetCatalogQuery,
  useGetPosConfigQuery,
  useUpsertPosConfigMutation,
  useGetSalesQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useTriggerSyncMutation,
  useGetSyncStatusQuery,
  useGetSyncLogsQuery,
} = posApi;
