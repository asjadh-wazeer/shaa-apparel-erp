import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse, QueryParams } from '../../../shared/types';
import {
  Employee,
  EmployeeOption,
  AttendanceRecord,
  AttendanceSummary,
  KpiRecord,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  MarkAttendancePayload,
  BulkAttendancePayload,
  UpsertKpiPayload,
} from '../types/hr.types';

interface EmployeeQueryParams extends QueryParams {
  isActive?: boolean;
  department?: string;
  factoryId?: string;
}

interface AttendanceQueryParams {
  date?: string;
  employeeId?: string;
  month?: string;
}

interface KpiQueryParams {
  employeeId?: string;
  month?: number;
  year?: number;
}

export const hrApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Employees ────────────────────────────────────────────────────────────

    getAllEmployees: builder.query<ApiResponse<EmployeeOption[]>, void>({
      query: () => '/hr/employees/all',
      providesTags: [{ type: 'Employee', id: 'ALL' }],
    }),

    getEmployees: builder.query<PaginatedResponse<Employee>, EmployeeQueryParams>({
      query: (params = {}) => ({ url: '/hr/employees', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Employee' as const, id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    createEmployee: builder.mutation<ApiResponse<Employee>, CreateEmployeePayload>({
      query: (body) => ({ url: '/hr/employees', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'ALL' },
      ],
    }),

    updateEmployee: builder.mutation<ApiResponse<Employee>, { id: string; data: UpdateEmployeePayload }>({
      query: ({ id, data }) => ({ url: `/hr/employees/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'ALL' },
      ],
    }),

    deleteEmployee: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/hr/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'ALL' },
      ],
    }),

    // ── Attendance ───────────────────────────────────────────────────────────

    getAttendance: builder.query<ApiResponse<AttendanceRecord[]>, AttendanceQueryParams>({
      query: (params) => ({ url: '/hr/attendance', params }),
      providesTags: (_, __, params) => [
        { type: 'Attendance', id: params.date ?? params.month ?? 'LIST' },
      ],
    }),

    markAttendance: builder.mutation<ApiResponse<AttendanceRecord>, MarkAttendancePayload>({
      query: (body) => ({ url: '/hr/attendance', method: 'POST', body }),
      invalidatesTags: (_, __, { date }) => [
        { type: 'Attendance', id: date },
        { type: 'Attendance', id: 'LIST' },
        { type: 'AttendanceSummary', id: 'LIST' },
      ],
    }),

    bulkMarkAttendance: builder.mutation<ApiResponse<AttendanceRecord[]>, BulkAttendancePayload>({
      query: (body) => ({ url: '/hr/attendance/bulk', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'AttendanceSummary', id: 'LIST' },
      ],
    }),

    getAttendanceSummary: builder.query<ApiResponse<AttendanceSummary>, string>({
      query: (month) => ({ url: '/hr/attendance/summary', params: { month } }),
      providesTags: [{ type: 'AttendanceSummary', id: 'LIST' }],
    }),

    // ── KPI ──────────────────────────────────────────────────────────────────

    getKpiRecords: builder.query<ApiResponse<KpiRecord[]>, KpiQueryParams>({
      query: (params) => ({ url: '/hr/kpi', params }),
      providesTags: [{ type: 'KpiRecord', id: 'LIST' }],
    }),

    upsertKpi: builder.mutation<ApiResponse<KpiRecord>, UpsertKpiPayload>({
      query: (body) => ({ url: '/hr/kpi', method: 'POST', body }),
      invalidatesTags: [{ type: 'KpiRecord', id: 'LIST' }],
    }),

    deleteKpi: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/hr/kpi/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'KpiRecord', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllEmployeesQuery,
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useBulkMarkAttendanceMutation,
  useGetAttendanceSummaryQuery,
  useGetKpiRecordsQuery,
  useUpsertKpiMutation,
  useDeleteKpiMutation,
} = hrApi;
