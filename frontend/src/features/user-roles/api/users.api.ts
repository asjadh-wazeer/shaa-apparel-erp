import { apiSlice } from '../../../api/apiSlice';
import { ApiResponse, PaginatedResponse } from '../../../shared/types';

export interface SystemUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
}

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  rolePermissions?: Array<{ permission: { module: string; action: string } }>;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
  roleIds?: string[];
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<SystemUser>, QueryUsersParams>({
      query: (params = {}) => ({ url: '/users', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'SystemUser' as const, id })),
              { type: 'SystemUser', id: 'LIST' },
            ]
          : [{ type: 'SystemUser', id: 'LIST' }],
    }),

    createUser: builder.mutation<ApiResponse<SystemUser>, CreateUserPayload>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'SystemUser', id: 'LIST' }],
    }),

    updateUser: builder.mutation<ApiResponse<SystemUser>, { id: string; data: UpdateUserPayload }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'SystemUser', id },
        { type: 'SystemUser', id: 'LIST' },
      ],
    }),

    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'SystemUser', id },
        { type: 'SystemUser', id: 'LIST' },
      ],
    }),

    getRoles: builder.query<ApiResponse<SystemRole[]>, void>({
      query: () => '/roles',
      providesTags: [{ type: 'SystemRole', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
} = usersApi;
