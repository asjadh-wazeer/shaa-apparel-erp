import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query';
import { RootState } from '../store';
import { logout, setCredentials } from '../features/auth/store/auth.slice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { data: { accessToken: string; refreshToken: string } };
        api.dispatch(
          setCredentials({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          }),
        );
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Role',
    'Permission',
    'Tenant',
    'Factory',
    'InventoryItem',
    'Warehouse',
    'WarehouseStock',
    'Supplier',
    'PurchaseOrder',
    'ProductionOrder',
    'ProductionBatch',
    'ProductionStageConfig',
    'GarmentType',
    'CostingConfig',
    'CostingCalc',
    'WastageRecord',
    'CostingCalculation',
    'Employee',
    'Attendance',
    'AttendanceSummary',
    'KpiRecord',
    'QualityCheck',
    'FinishedGood',
    'Notification',
    'AuditLog',
    'DesignSubmission',
    'Dashboard',
    'SaleRecord',
    'PosConfig',
    'SystemUser',
    'SystemRole',
  ],
  endpoints: () => ({}),
});
