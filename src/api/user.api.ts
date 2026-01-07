import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export type UserListItem = {
  id: number;
  username: string;
  role:string| 'admin' | 'user';
  can_transfer_budget: boolean;
  user_level: string;
};

export type CreateUserBody = {
  username: string;
  password: string;
  role: 'admin' | 'user';
};

export type UpdateUserBody = {
  username?: string;
  role?: string| 'admin' | 'user';
  password?: string; // if backend allows
};

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    // LIST
    getUsers: builder.query<UserListItem[], void>({
      query: () => ({ url: '/auth/users/', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: 'Users' as const, id: u.id })),
              { type: 'Users' as const, id: 'LIST' },
            ]
          : [{ type: 'Users' as const, id: 'LIST' }],
    }),

    // CREATE (note: endpoint is /auth/register/)
    createUser: builder.mutation<UserListItem, CreateUserBody>({
      query: (body) => ({ url: '/auth/register/', method: 'POST', body }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),

    // UPDATE
    updateUser: builder.mutation<UserListItem, { pk: number; data: UpdateUserBody }>({
      query: ({ pk, data }) => ({
        url: `/auth/users/update/`,
        method: 'PUT',
        params: { pk },
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Users', id: arg.pk },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // DELETE
    deleteUser: builder.mutation<{ message?: string }, { pk: number }>({
      query: ({ pk }) => ({
        url: `/auth/users/delete/`,
        method: 'DELETE',
        params: { pk },
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),

    // ASSIGN USER TO LEVEL
    assignUserLevel: builder.mutation<{ message?: string }, { user_id: number; level_order: number }>({
      query: (body) => ({
        url: `/auth/users/level/update`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAssignUserLevelMutation,
} = userApi;
