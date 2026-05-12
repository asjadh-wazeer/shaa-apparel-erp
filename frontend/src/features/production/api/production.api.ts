import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse, QueryParams } from '../../../shared/types';
import {
  ProductionOrder,
  ProductionBatch,
  StageConfig,
  ProductionStats,
  CreateProductionOrderPayload,
  UpdateProductionOrderPayload,
  CreateProductionBatchPayload,
  AdvanceStagePayload,
} from '../types/production.types';

export interface ProductionOrderQueryParams extends QueryParams {
  status?: string;
  factoryId?: string;
}

export const productionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Stage Configs ──────────────────────────────────────────────────────────

    getStageConfigs: builder.query<ApiResponse<StageConfig[]>, void>({
      query: () => '/production/stage-configs',
      providesTags: [{ type: 'ProductionOrder', id: 'STAGE_CONFIGS' }],
    }),

    getProductionStats: builder.query<ApiResponse<ProductionStats>, void>({
      query: () => '/production/stats',
      providesTags: [{ type: 'ProductionOrder', id: 'STATS' }],
    }),

    getBatchesByStage: builder.query<ApiResponse<ProductionBatch[]>, string>({
      query: (codes) => ({ url: '/production/by-stage', params: { codes } }),
      providesTags: (_, __, codes) => [{ type: 'ProductionOrder', id: `STAGE_${codes}` }],
    }),

    // ── Production Orders ──────────────────────────────────────────────────────

    getProductionOrders: builder.query<
      PaginatedResponse<ProductionOrder>,
      ProductionOrderQueryParams
    >({
      query: (params = {}) => ({ url: '/production', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'ProductionOrder' as const, id })),
              { type: 'ProductionOrder', id: 'LIST' },
            ]
          : [{ type: 'ProductionOrder', id: 'LIST' }],
    }),

    getProductionOrder: builder.query<ApiResponse<ProductionOrder>, string>({
      query: (id) => `/production/${id}`,
      providesTags: (_, __, id) => [{ type: 'ProductionOrder', id }],
    }),

    createProductionOrder: builder.mutation<
      ApiResponse<ProductionOrder>,
      CreateProductionOrderPayload
    >({
      query: (body) => ({ url: '/production', method: 'POST', body }),
      invalidatesTags: [
        { type: 'ProductionOrder', id: 'LIST' },
        { type: 'ProductionOrder', id: 'STATS' },
      ],
    }),

    updateProductionOrder: builder.mutation<
      ApiResponse<ProductionOrder>,
      { id: string; data: UpdateProductionOrderPayload }
    >({
      query: ({ id, data }) => ({ url: `/production/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'ProductionOrder', id },
        { type: 'ProductionOrder', id: 'LIST' },
        { type: 'ProductionOrder', id: 'STATS' },
      ],
    }),

    deleteProductionOrder: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/production/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'ProductionOrder', id },
        { type: 'ProductionOrder', id: 'LIST' },
        { type: 'ProductionOrder', id: 'STATS' },
      ],
    }),

    // ── Batches ────────────────────────────────────────────────────────────────

    createProductionBatch: builder.mutation<
      ApiResponse<ProductionBatch>,
      { orderId: string; data: CreateProductionBatchPayload }
    >({
      query: ({ orderId, data }) => ({
        url: `/production/${orderId}/batches`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { orderId }) => [
        { type: 'ProductionOrder', id: orderId },
        { type: 'ProductionOrder', id: 'LIST' },
        { type: 'ProductionOrder', id: 'STATS' },
      ],
    }),

    getProductionBatch: builder.query<
      ApiResponse<ProductionBatch>,
      { orderId: string; batchId: string }
    >({
      query: ({ orderId, batchId }) => `/production/${orderId}/batches/${batchId}`,
      providesTags: (_, __, { batchId }) => [{ type: 'ProductionOrder', id: `batch-${batchId}` }],
    }),

    advanceStage: builder.mutation<
      ApiResponse<ProductionBatch>,
      { orderId: string; batchId: string; data: AdvanceStagePayload }
    >({
      query: ({ orderId, batchId, data }) => ({
        url: `/production/${orderId}/batches/${batchId}/advance`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { orderId, batchId }) => [
        { type: 'ProductionOrder', id: orderId },
        { type: 'ProductionOrder', id: 'LIST' },
        { type: 'ProductionOrder', id: 'STATS' },
        { type: 'ProductionOrder', id: `batch-${batchId}` },
        { type: 'ProductionOrder', id: 'STAGE_CUTTING' },
        { type: 'ProductionOrder', id: 'STAGE_SEWING' },
        { type: 'ProductionOrder', id: 'STAGE_QC' },
      ],
    }),
  }),
});

export const {
  useGetStageConfigsQuery,
  useGetProductionStatsQuery,
  useGetBatchesByStageQuery,
  useGetProductionOrdersQuery,
  useGetProductionOrderQuery,
  useCreateProductionOrderMutation,
  useUpdateProductionOrderMutation,
  useDeleteProductionOrderMutation,
  useCreateProductionBatchMutation,
  useGetProductionBatchQuery,
  useAdvanceStageMutation,
} = productionApi;
