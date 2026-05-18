import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse } from '../../../shared/types';

export interface DesignSubmission {
  id: string;
  tenantId: string;
  productionOrderId: string;
  reviewNumber: string;
  sizes?: string;
  assigneeId?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  notes?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectedReason?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  productionOrder: { id: string; orderNumber: string; description?: string };
}

export interface CreateDesignSubmissionPayload {
  productionOrderId: string;
  sizes?: string;
  notes?: string;
}

export interface QueryDesignSubmissionsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const designApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDesignSubmissions: builder.query<PaginatedResponse<DesignSubmission>, QueryDesignSubmissionsParams>({
      query: (params = {}) => ({ url: '/design-submissions', params }),
      providesTags: (result) =>
        Array.isArray(result?.data)
          ? [
              ...result!.data.map(({ id }) => ({ type: 'DesignSubmission' as const, id })),
              { type: 'DesignSubmission', id: 'LIST' },
            ]
          : [{ type: 'DesignSubmission', id: 'LIST' }],
    }),

    createDesignSubmission: builder.mutation<ApiResponse<DesignSubmission>, CreateDesignSubmissionPayload>({
      query: (body) => ({ url: '/design-submissions', method: 'POST', body }),
      invalidatesTags: [{ type: 'DesignSubmission', id: 'LIST' }],
    }),

    approveDesignSubmission: builder.mutation<ApiResponse<DesignSubmission>, string>({
      query: (id) => ({ url: `/design-submissions/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'DesignSubmission', id },
        { type: 'DesignSubmission', id: 'LIST' },
      ],
    }),

    rejectDesignSubmission: builder.mutation<ApiResponse<DesignSubmission>, { id: string; rejectedReason: string }>({
      query: ({ id, rejectedReason }) => ({
        url: `/design-submissions/${id}/reject`,
        method: 'POST',
        body: { rejectedReason },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'DesignSubmission', id },
        { type: 'DesignSubmission', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDesignSubmissionsQuery,
  useCreateDesignSubmissionMutation,
  useApproveDesignSubmissionMutation,
  useRejectDesignSubmissionMutation,
} = designApi;
