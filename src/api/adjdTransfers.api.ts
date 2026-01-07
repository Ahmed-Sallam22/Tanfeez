import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AdjdTransfer {
  transfer_id: number;
  cost_center_code: number;
  account_name: string;
  approved_budget: string;
  available_budget: string;
  from_center: string;
  to_center: string;
  reason: string;
  account_code: number;
  cost_center_name: string;
  done: number;
  encumbrance: string;
  actual: string;
  file: string | null;
  transaction: number;
  project_code?: string;
  project_name?: string;
}

export interface AdjdTransfersResponse {
  data: AdjdTransfer[];
  status: string;
  message?: string;
}

export const adjdTransfersApi = createApi({
  reducerPath: 'adjdTransfersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://lightidea.org:9001/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdjdTransfer'],
  endpoints: (builder) => ({
    getAdjdTransfers: builder.query<AdjdTransfersResponse, { transaction: number }>({
      query: ({ transaction }) => `/transfers/?transaction=${transaction}`,
      providesTags: ['AdjdTransfer'],
    }),
  }),
});

export const { useGetAdjdTransfersQuery } = adjdTransfersApi;
