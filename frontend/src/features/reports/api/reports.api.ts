import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse } from '../../../shared/types';
import {
  ProductionReportRow,
  InventoryReportRow,
  AttendanceReportRow,
  QualityReportRow,
  KpiReportRow,
  ProductionReportParams,
  AttendanceReportParams,
  QualityReportParams,
  KpiReportParams,
} from '../types/reports.types';

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProductionReport: builder.query<ApiResponse<ProductionReportRow[]>, ProductionReportParams>({
      query: (params = {}) => ({ url: '/reporting/production', params }),
    }),

    getInventoryReport: builder.query<ApiResponse<InventoryReportRow[]>, void>({
      query: () => '/reporting/inventory',
    }),

    getAttendanceReport: builder.query<ApiResponse<AttendanceReportRow[]>, AttendanceReportParams>({
      query: (params = {}) => ({ url: '/reporting/attendance', params }),
    }),

    getQualityReport: builder.query<ApiResponse<QualityReportRow[]>, QualityReportParams>({
      query: (params = {}) => ({ url: '/reporting/quality', params }),
    }),

    getKpiReport: builder.query<ApiResponse<KpiReportRow[]>, KpiReportParams>({
      query: (params = {}) => ({ url: '/reporting/kpi', params }),
    }),
  }),
});

export const {
  useGetProductionReportQuery,
  useGetInventoryReportQuery,
  useGetAttendanceReportQuery,
  useGetQualityReportQuery,
  useGetKpiReportQuery,
} = reportsApi;
