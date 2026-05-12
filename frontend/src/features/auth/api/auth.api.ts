import { apiSlice } from '../../../api/apiSlice';
import { LoginCredentials, LoginResponse, UserProfile } from '../../../shared/types';
import { ApiResponse } from '../../../shared/types';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    logout: builder.mutation<ApiResponse<null>, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
    }),

    getProfile: builder.query<ApiResponse<UserProfile>, void>({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),

    refreshTokens: builder.mutation<
      ApiResponse<{ accessToken: string; refreshToken: string }>,
      { refreshToken: string }
    >({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useRefreshTokensMutation,
} = authApi;
