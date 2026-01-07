// src/api/level.api.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export type LevelItem = {
  id: number;
  name: string;
  description: string;
  level_order: number;
};

export type CreateLevelBody = {
  name: string;
  description: string;
  level_order: number;
};

export type UpdateLevelBody = Partial<CreateLevelBody>;

export const levelApi = createApi({
  reducerPath: 'levelApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Levels'],
  endpoints: (builder) => ({
    getLevels: builder.query<LevelItem[], void>({
      query: () => ({ url: '/auth/levels/', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((l) => ({ type: 'Levels' as const, id: l.id })),
              { type: 'Levels' as const, id: 'LIST' },
            ]
          : [{ type: 'Levels', id: 'LIST' }],
    }),
    createLevel: builder.mutation<LevelItem, CreateLevelBody>({
      query: (body) => ({ url: '/auth/levels/create/', method: 'POST', body }),
      invalidatesTags: [{ type: 'Levels', id: 'LIST' }],
    }),
    updateLevel: builder.mutation<LevelItem, { pk: number; data: UpdateLevelBody }>({
      query: ({ pk, data }) => ({
        url: `/auth/levels/update/?pk=${pk}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Levels', id: arg.pk },
        { type: 'Levels', id: 'LIST' },
      ],
    }),
    deleteLevel: builder.mutation<{ message?: string }, { pk: number }>({
      query: ({ pk }) => ({
        url: `/auth/levels/delete?pk=${pk}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Levels', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetLevelsQuery,
  useCreateLevelMutation,
  useUpdateLevelMutation,
  useDeleteLevelMutation,
} = levelApi;
