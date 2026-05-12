import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse } from '../../../shared/types';
import {
  FinishedGood,
  FinishedGoodStats,
  CreateFinishedGoodPayload,
  UpdateFinishedGoodPayload,
  AdjustStockPayload,
  FinishedGoodsQueryParams,
} from '../types/finished-goods.types';

export const finishedGoodsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFinishedGoodsStats: builder.query<ApiResponse<FinishedGoodStats>, void>({
      query: () => '/finished-goods/stats',
      providesTags: [{ type: 'FinishedGood', id: 'STATS' }],
    }),

    getFinishedGoods: builder.query<PaginatedResponse<FinishedGood>, FinishedGoodsQueryParams>({
      query: (params = {}) => ({ url: '/finished-goods', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'FinishedGood' as const, id })),
              { type: 'FinishedGood', id: 'LIST' },
            ]
          : [{ type: 'FinishedGood', id: 'LIST' }],
    }),

    getFinishedGoodById: builder.query<ApiResponse<FinishedGood>, string>({
      query: (id) => `/finished-goods/${id}`,
      providesTags: (_, __, id) => [{ type: 'FinishedGood', id }],
    }),

    createFinishedGood: builder.mutation<ApiResponse<FinishedGood>, CreateFinishedGoodPayload>({
      query: (body) => ({ url: '/finished-goods', method: 'POST', body }),
      invalidatesTags: [
        { type: 'FinishedGood', id: 'LIST' },
        { type: 'FinishedGood', id: 'STATS' },
      ],
    }),

    updateFinishedGood: builder.mutation<ApiResponse<FinishedGood>, { id: string; data: UpdateFinishedGoodPayload }>({
      query: ({ id, data }) => ({ url: `/finished-goods/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'FinishedGood', id },
        { type: 'FinishedGood', id: 'LIST' },
        { type: 'FinishedGood', id: 'STATS' },
      ],
    }),

    deleteFinishedGood: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/finished-goods/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'FinishedGood', id: 'LIST' },
        { type: 'FinishedGood', id: 'STATS' },
      ],
    }),

    adjustFinishedGoodStock: builder.mutation<ApiResponse<FinishedGood>, { id: string; data: AdjustStockPayload }>({
      query: ({ id, data }) => ({ url: `/finished-goods/${id}/adjust-stock`, method: 'POST', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'FinishedGood', id },
        { type: 'FinishedGood', id: 'LIST' },
        { type: 'FinishedGood', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useGetFinishedGoodsStatsQuery,
  useGetFinishedGoodsQuery,
  useGetFinishedGoodByIdQuery,
  useCreateFinishedGoodMutation,
  useUpdateFinishedGoodMutation,
  useDeleteFinishedGoodMutation,
  useAdjustFinishedGoodStockMutation,
} = finishedGoodsApi;
