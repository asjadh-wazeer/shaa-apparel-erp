import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse } from '../../../shared/types';
import { DashboardOverview } from '../types/dashboard.types';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<ApiResponse<DashboardOverview>, void>({
      query: () => '/dashboards/overview',
      providesTags: [{ type: 'Dashboard', id: 'OVERVIEW' }],
    }),
  }),
});

export const { useGetDashboardOverviewQuery } = dashboardApi;
