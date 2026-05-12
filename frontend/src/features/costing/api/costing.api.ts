import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse, QueryParams } from '../../../shared/types';
import {
  GarmentType,
  GarmentTypeOption,
  GarmentAccessory,
  CostingConfig,
  CostingCalculation,
  WastageRecord,
  CreateGarmentTypePayload,
  UpdateGarmentTypePayload,
  CreateAccessoryPayload,
  UpdateAccessoryPayload,
  CreateCostingConfigPayload,
  UpdateCostingConfigPayload,
  CreateCalculationPayload,
  UpdateCalculationPayload,
  RecordWastagePayload,
} from '../types/costing.types';

interface GarmentTypeQueryParams extends QueryParams {
  isActive?: boolean;
}

interface CalcQueryParams extends QueryParams {
  productionOrderId?: string;
  isApproved?: boolean;
}

export const costingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Garment Types ────────────────────────────────────────────────────────

    getGarmentTypes: builder.query<PaginatedResponse<GarmentType>, GarmentTypeQueryParams>({
      query: (params = {}) => ({ url: '/garment-types', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'GarmentType' as const, id })),
              { type: 'GarmentType', id: 'LIST' },
            ]
          : [{ type: 'GarmentType', id: 'LIST' }],
    }),

    getAllGarmentTypes: builder.query<ApiResponse<GarmentTypeOption[]>, void>({
      query: () => '/garment-types/all',
      providesTags: [{ type: 'GarmentType', id: 'ALL' }],
    }),

    getGarmentType: builder.query<ApiResponse<GarmentType>, string>({
      query: (id) => `/garment-types/${id}`,
      providesTags: (_, __, id) => [{ type: 'GarmentType', id }],
    }),

    createGarmentType: builder.mutation<ApiResponse<GarmentType>, CreateGarmentTypePayload>({
      query: (body) => ({ url: '/garment-types', method: 'POST', body }),
      invalidatesTags: [
        { type: 'GarmentType', id: 'LIST' },
        { type: 'GarmentType', id: 'ALL' },
      ],
    }),

    updateGarmentType: builder.mutation<
      ApiResponse<GarmentType>,
      { id: string; data: UpdateGarmentTypePayload }
    >({
      query: ({ id, data }) => ({ url: `/garment-types/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'GarmentType', id },
        { type: 'GarmentType', id: 'LIST' },
        { type: 'GarmentType', id: 'ALL' },
      ],
    }),

    deleteGarmentType: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/garment-types/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'GarmentType', id },
        { type: 'GarmentType', id: 'LIST' },
        { type: 'GarmentType', id: 'ALL' },
      ],
    }),

    // ── BOM Accessories ──────────────────────────────────────────────────────

    addAccessory: builder.mutation<
      ApiResponse<GarmentAccessory>,
      { garmentTypeId: string; data: CreateAccessoryPayload }
    >({
      query: ({ garmentTypeId, data }) => ({
        url: `/garment-types/${garmentTypeId}/accessories`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { garmentTypeId }) => [
        { type: 'GarmentType', id: garmentTypeId },
        { type: 'GarmentType', id: 'LIST' },
      ],
    }),

    updateAccessory: builder.mutation<
      ApiResponse<GarmentAccessory>,
      { garmentTypeId: string; accessoryId: string; data: UpdateAccessoryPayload }
    >({
      query: ({ garmentTypeId, accessoryId, data }) => ({
        url: `/garment-types/${garmentTypeId}/accessories/${accessoryId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { garmentTypeId }) => [{ type: 'GarmentType', id: garmentTypeId }],
    }),

    removeAccessory: builder.mutation<
      ApiResponse<null>,
      { garmentTypeId: string; accessoryId: string }
    >({
      query: ({ garmentTypeId, accessoryId }) => ({
        url: `/garment-types/${garmentTypeId}/accessories/${accessoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { garmentTypeId }) => [
        { type: 'GarmentType', id: garmentTypeId },
        { type: 'GarmentType', id: 'LIST' },
      ],
    }),

    // ── Costing Configs ──────────────────────────────────────────────────────

    getCostingConfigs: builder.query<ApiResponse<CostingConfig[]>, void>({
      query: () => '/costing/configs',
      providesTags: [{ type: 'CostingConfig', id: 'LIST' }],
    }),

    createCostingConfig: builder.mutation<ApiResponse<CostingConfig>, CreateCostingConfigPayload>({
      query: (body) => ({ url: '/costing/configs', method: 'POST', body }),
      invalidatesTags: [{ type: 'CostingConfig', id: 'LIST' }],
    }),

    updateCostingConfig: builder.mutation<
      ApiResponse<CostingConfig>,
      { id: string; data: UpdateCostingConfigPayload }
    >({
      query: ({ id, data }) => ({ url: `/costing/configs/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: [{ type: 'CostingConfig', id: 'LIST' }],
    }),

    deleteCostingConfig: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/costing/configs/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'CostingConfig', id: 'LIST' }],
    }),

    // ── Calculations ─────────────────────────────────────────────────────────

    getCalculations: builder.query<PaginatedResponse<CostingCalculation>, CalcQueryParams>({
      query: (params = {}) => ({ url: '/costing/calculations', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'CostingCalc' as const, id })),
              { type: 'CostingCalc', id: 'LIST' },
            ]
          : [{ type: 'CostingCalc', id: 'LIST' }],
    }),

    getCalculation: builder.query<ApiResponse<CostingCalculation>, string>({
      query: (id) => `/costing/calculations/${id}`,
      providesTags: (_, __, id) => [{ type: 'CostingCalc', id }],
    }),

    createCalculation: builder.mutation<ApiResponse<CostingCalculation>, CreateCalculationPayload>({
      query: (body) => ({ url: '/costing/calculations', method: 'POST', body }),
      invalidatesTags: [{ type: 'CostingCalc', id: 'LIST' }],
    }),

    updateCalculation: builder.mutation<
      ApiResponse<CostingCalculation>,
      { id: string; data: UpdateCalculationPayload }
    >({
      query: ({ id, data }) => ({ url: `/costing/calculations/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'CostingCalc', id },
        { type: 'CostingCalc', id: 'LIST' },
      ],
    }),

    approveCalculation: builder.mutation<ApiResponse<CostingCalculation>, string>({
      query: (id) => ({ url: `/costing/calculations/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'CostingCalc', id },
        { type: 'CostingCalc', id: 'LIST' },
      ],
    }),

    // ── Wastage ──────────────────────────────────────────────────────────────

    getWastage: builder.query<ApiResponse<WastageRecord[]>, string>({
      query: (batchId) => ({ url: '/costing/wastage', params: { batchId } }),
      providesTags: (_, __, batchId) => [{ type: 'WastageRecord', id: batchId }],
    }),

    recordWastage: builder.mutation<ApiResponse<WastageRecord>, RecordWastagePayload>({
      query: (body) => ({ url: '/costing/wastage', method: 'POST', body }),
      invalidatesTags: (_, __, { batchId }) => [{ type: 'WastageRecord', id: batchId }],
    }),
  }),
});

export const {
  useGetGarmentTypesQuery,
  useGetAllGarmentTypesQuery,
  useGetGarmentTypeQuery,
  useCreateGarmentTypeMutation,
  useUpdateGarmentTypeMutation,
  useDeleteGarmentTypeMutation,
  useAddAccessoryMutation,
  useUpdateAccessoryMutation,
  useRemoveAccessoryMutation,
  useGetCostingConfigsQuery,
  useCreateCostingConfigMutation,
  useUpdateCostingConfigMutation,
  useDeleteCostingConfigMutation,
  useGetCalculationsQuery,
  useGetCalculationQuery,
  useCreateCalculationMutation,
  useUpdateCalculationMutation,
  useApproveCalculationMutation,
  useGetWastageQuery,
  useRecordWastageMutation,
} = costingApi;
