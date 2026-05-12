import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse, QueryParams } from '../../../shared/types';
import {
  InventoryItem,
  Warehouse,
  WarehouseStockLine,
  StockMovement,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
  CreateStockMovementPayload,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  StockLevelResponse,
} from '../types/inventory.types';

interface InventoryQueryParams extends QueryParams {
  type?: string;
  lowStockOnly?: boolean;
  isActive?: boolean;
}

interface WarehouseQueryParams extends QueryParams {
  isActive?: boolean;
}

interface WarehouseStockQueryParams extends QueryParams {
  type?: string;
}

interface MovementQueryParams extends QueryParams {
  type?: string;
}

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Inventory Items ──────────────────────────────────────────────────────

    getInventoryItems: builder.query<PaginatedResponse<InventoryItem>, InventoryQueryParams>({
      query: (params = {}) => ({
        url: '/inventory',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'InventoryItem' as const, id })),
              { type: 'InventoryItem', id: 'LIST' },
            ]
          : [{ type: 'InventoryItem', id: 'LIST' }],
    }),

    getLowStockItems: builder.query<ApiResponse<InventoryItem[]>, void>({
      query: () => '/inventory/low-stock',
      providesTags: [{ type: 'InventoryItem', id: 'LOW_STOCK' }],
    }),

    getInventoryItem: builder.query<ApiResponse<InventoryItem>, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (_, __, id) => [{ type: 'InventoryItem', id }],
    }),

    createInventoryItem: builder.mutation<ApiResponse<InventoryItem>, CreateInventoryItemPayload>({
      query: (body) => ({
        url: '/inventory',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'InventoryItem', id: 'LIST' }],
    }),

    updateInventoryItem: builder.mutation<
      ApiResponse<InventoryItem>,
      { id: string; data: UpdateInventoryItemPayload }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'InventoryItem', id },
        { type: 'InventoryItem', id: 'LIST' },
      ],
    }),

    deleteInventoryItem: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'InventoryItem', id },
        { type: 'InventoryItem', id: 'LIST' },
      ],
    }),

    getItemStockLevels: builder.query<StockLevelResponse, string>({
      query: (id) => `/inventory/${id}/stock`,
      providesTags: (_, __, id) => [
        { type: 'WarehouseStock', id },
        { type: 'InventoryItem', id },
      ],
    }),

    recordStockMovement: builder.mutation<
      ApiResponse<StockMovement>,
      { itemId: string; data: CreateStockMovementPayload }
    >({
      query: ({ itemId, data }) => ({
        url: `/inventory/${itemId}/movements`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { itemId }) => [
        { type: 'InventoryItem', id: itemId },
        { type: 'InventoryItem', id: 'LIST' },
        { type: 'InventoryItem', id: 'LOW_STOCK' },
        { type: 'WarehouseStock', id: 'LIST' },
      ],
    }),

    getStockMovements: builder.query<
      PaginatedResponse<StockMovement>,
      { itemId: string; params?: MovementQueryParams }
    >({
      query: ({ itemId, params = {} }) => ({
        url: `/inventory/${itemId}/movements`,
        params,
      }),
      providesTags: (_, __, { itemId }) => [{ type: 'InventoryItem', id: `movements-${itemId}` }],
    }),

    // ── Warehouses ──────────────────────────────────────────────────────────

    getWarehouses: builder.query<PaginatedResponse<Warehouse>, WarehouseQueryParams>({
      query: (params = {}) => ({
        url: '/warehouses',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Warehouse' as const, id })),
              { type: 'Warehouse', id: 'LIST' },
            ]
          : [{ type: 'Warehouse', id: 'LIST' }],
    }),

    getWarehouse: builder.query<ApiResponse<Warehouse>, string>({
      query: (id) => `/warehouses/${id}`,
      providesTags: (_, __, id) => [{ type: 'Warehouse', id }],
    }),

    createWarehouse: builder.mutation<ApiResponse<Warehouse>, CreateWarehousePayload>({
      query: (body) => ({
        url: '/warehouses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),

    updateWarehouse: builder.mutation<
      ApiResponse<Warehouse>,
      { id: string; data: UpdateWarehousePayload }
    >({
      query: ({ id, data }) => ({
        url: `/warehouses/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Warehouse', id },
        { type: 'Warehouse', id: 'LIST' },
      ],
    }),

    deleteWarehouse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Warehouse', id },
        { type: 'Warehouse', id: 'LIST' },
      ],
    }),

    getWarehouseStock: builder.query<
      PaginatedResponse<WarehouseStockLine>,
      { warehouseId: string; params?: WarehouseStockQueryParams }
    >({
      query: ({ warehouseId, params = {} }) => ({
        url: `/warehouses/${warehouseId}/stock`,
        params,
      }),
      providesTags: (_, __, { warehouseId }) => [
        { type: 'WarehouseStock', id: warehouseId },
        { type: 'WarehouseStock', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetInventoryItemsQuery,
  useGetLowStockItemsQuery,
  useGetInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetItemStockLevelsQuery,
  useRecordStockMovementMutation,
  useGetStockMovementsQuery,
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useGetWarehouseStockQuery,
} = inventoryApi;
