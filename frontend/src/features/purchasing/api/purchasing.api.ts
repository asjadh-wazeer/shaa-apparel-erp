import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse, QueryParams } from '../../../shared/types';
import {
  Supplier,
  SupplierOption,
  PurchaseOrder,
  GoodsReceivedNote,
  PoStats,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  CreateGrnPayload,
} from '../types/purchasing.types';

interface SupplierQueryParams extends QueryParams {
  isActive?: boolean;
}

interface PoQueryParams extends QueryParams {
  status?: string;
  supplierId?: string;
}

export const purchasingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Suppliers ─────────────────────────────────────────────────────────────

    getSuppliers: builder.query<PaginatedResponse<Supplier>, SupplierQueryParams>({
      query: (params = {}) => ({ url: '/suppliers', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Supplier' as const, id })),
              { type: 'Supplier', id: 'LIST' },
            ]
          : [{ type: 'Supplier', id: 'LIST' }],
    }),

    getAllSuppliers: builder.query<ApiResponse<SupplierOption[]>, void>({
      query: () => '/suppliers/all',
      providesTags: [{ type: 'Supplier', id: 'ALL' }],
    }),

    getSupplier: builder.query<ApiResponse<Supplier>, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_, __, id) => [{ type: 'Supplier', id }],
    }),

    createSupplier: builder.mutation<ApiResponse<Supplier>, CreateSupplierPayload>({
      query: (body) => ({ url: '/suppliers', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Supplier', id: 'LIST' },
        { type: 'Supplier', id: 'ALL' },
      ],
    }),

    updateSupplier: builder.mutation<
      ApiResponse<Supplier>,
      { id: string; data: UpdateSupplierPayload }
    >({
      query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
        { type: 'Supplier', id: 'ALL' },
      ],
    }),

    deleteSupplier: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'Supplier', id },
        { type: 'Supplier', id: 'LIST' },
        { type: 'Supplier', id: 'ALL' },
      ],
    }),

    // ── Purchase Orders ────────────────────────────────────────────────────────

    getPoStats: builder.query<ApiResponse<PoStats>, void>({
      query: () => '/purchase-orders/stats',
      providesTags: [{ type: 'PurchaseOrder', id: 'STATS' }],
    }),

    getPurchaseOrders: builder.query<PaginatedResponse<PurchaseOrder>, PoQueryParams>({
      query: (params = {}) => ({ url: '/purchase-orders', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'PurchaseOrder' as const, id })),
              { type: 'PurchaseOrder', id: 'LIST' },
            ]
          : [{ type: 'PurchaseOrder', id: 'LIST' }],
    }),

    getPurchaseOrder: builder.query<ApiResponse<PurchaseOrder>, string>({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_, __, id) => [{ type: 'PurchaseOrder', id }],
    }),

    createPurchaseOrder: builder.mutation<ApiResponse<PurchaseOrder>, CreatePurchaseOrderPayload>({
      query: (body) => ({ url: '/purchase-orders', method: 'POST', body }),
      invalidatesTags: [
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'STATS' },
      ],
    }),

    updatePurchaseOrder: builder.mutation<
      ApiResponse<PurchaseOrder>,
      { id: string; data: UpdatePurchaseOrderPayload }
    >({
      query: ({ id, data }) => ({ url: `/purchase-orders/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
      ],
    }),

    submitPurchaseOrder: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/purchase-orders/${id}/submit`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'STATS' },
      ],
    }),

    approvePurchaseOrder: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/purchase-orders/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'STATS' },
      ],
    }),

    cancelPurchaseOrder: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'PurchaseOrder', id },
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'STATS' },
      ],
    }),

    // ── GRN ───────────────────────────────────────────────────────────────────

    createGrn: builder.mutation<
      ApiResponse<GoodsReceivedNote>,
      { poId: string; data: CreateGrnPayload }
    >({
      query: ({ poId, data }) => ({
        url: `/purchase-orders/${poId}/grns`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { poId }) => [
        { type: 'PurchaseOrder', id: poId },
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'STATS' },
      ],
    }),

    confirmGrn: builder.mutation<ApiResponse<null>, { poId: string; grnId: string }>({
      query: ({ poId, grnId }) => ({
        url: `/purchase-orders/${poId}/grns/${grnId}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, { poId }) => [
        { type: 'PurchaseOrder', id: poId },
        { type: 'PurchaseOrder', id: 'LIST' },
        { type: 'PurchaseOrder', id: 'STATS' },
        { type: 'InventoryItem', id: 'LIST' },
        { type: 'InventoryItem', id: 'LOW_STOCK' },
        { type: 'WarehouseStock', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetAllSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetPoStatsQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCreateGrnMutation,
  useConfirmGrnMutation,
} = purchasingApi;
