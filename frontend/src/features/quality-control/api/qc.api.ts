import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse } from '../../../shared/types';
import {
  QualityCheck,
  QcStats,
  CreateQualityCheckPayload,
  UpdateQualityCheckPayload,
  AddReworkPayload,
  UpdateReworkPayload,
  ReworkRecord,
  QcQueryParams,
} from '../types/qc.types';

export const qcApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQcStats: builder.query<ApiResponse<QcStats>, void>({
      query: () => '/quality-control/stats',
      providesTags: [{ type: 'QualityCheck', id: 'STATS' }],
    }),

    getQualityChecks: builder.query<PaginatedResponse<QualityCheck>, QcQueryParams>({
      query: (params = {}) => ({ url: '/quality-control', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'QualityCheck' as const, id })),
              { type: 'QualityCheck', id: 'LIST' },
            ]
          : [{ type: 'QualityCheck', id: 'LIST' }],
    }),

    getQualityCheckById: builder.query<ApiResponse<QualityCheck>, string>({
      query: (id) => `/quality-control/${id}`,
      providesTags: (_, __, id) => [{ type: 'QualityCheck', id }],
    }),

    createQualityCheck: builder.mutation<ApiResponse<QualityCheck>, CreateQualityCheckPayload>({
      query: (body) => ({ url: '/quality-control', method: 'POST', body }),
      invalidatesTags: [
        { type: 'QualityCheck', id: 'LIST' },
        { type: 'QualityCheck', id: 'STATS' },
      ],
    }),

    updateQualityCheck: builder.mutation<ApiResponse<QualityCheck>, { id: string; data: UpdateQualityCheckPayload }>({
      query: ({ id, data }) => ({ url: `/quality-control/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'QualityCheck', id },
        { type: 'QualityCheck', id: 'LIST' },
        { type: 'QualityCheck', id: 'STATS' },
      ],
    }),

    approveQualityCheck: builder.mutation<ApiResponse<QualityCheck>, string>({
      query: (id) => ({ url: `/quality-control/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'QualityCheck', id },
        { type: 'QualityCheck', id: 'LIST' },
        { type: 'QualityCheck', id: 'STATS' },
      ],
    }),

    deleteQualityCheck: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/quality-control/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'QualityCheck', id: 'LIST' },
        { type: 'QualityCheck', id: 'STATS' },
      ],
    }),

    addRework: builder.mutation<ApiResponse<ReworkRecord>, { checkId: string; data: AddReworkPayload }>({
      query: ({ checkId, data }) => ({ url: `/quality-control/${checkId}/reworks`, method: 'POST', body: data }),
      invalidatesTags: (_, __, { checkId }) => [{ type: 'QualityCheck', id: checkId }],
    }),

    updateRework: builder.mutation<ApiResponse<ReworkRecord>, { checkId: string; reworkId: string; data: UpdateReworkPayload }>({
      query: ({ checkId, reworkId, data }) => ({
        url: `/quality-control/${checkId}/reworks/${reworkId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { checkId }) => [{ type: 'QualityCheck', id: checkId }],
    }),
  }),
});

export const {
  useGetQcStatsQuery,
  useGetQualityChecksQuery,
  useGetQualityCheckByIdQuery,
  useCreateQualityCheckMutation,
  useUpdateQualityCheckMutation,
  useApproveQualityCheckMutation,
  useDeleteQualityCheckMutation,
  useAddReworkMutation,
  useUpdateReworkMutation,
} = qcApi;
