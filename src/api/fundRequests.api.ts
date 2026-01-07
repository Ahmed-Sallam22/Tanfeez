import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface FundRequestItem {
  transaction_id: number;
  transaction_date: string;
  amount: number;
  status: string;
  requested_by: string;
  budget_control: string;
  control_budget: string;
  user_id: number;
  request_date: string;
  code: string;
  gl_posting_status: string;
  approvel_1: string;
  approvel_2: string;
  approvel_3: string;
  approvel_4: string;
  approvel_1_date: string | null;
  approvel_2_date: string | null;
  approvel_3_date: string | null;
  approvel_4_date: string | null;
  status_level: number;
  attachment: string;
  notes:string;
  fy: string | null;
  group_id: number | null;
  interface_id: number | null;
  reject_group_id: number | null;
  reject_interface_id: number | null;
  approve_group_id: number | null;
  approve_interface_id: number | null;
  report: string;
  type: string;
  transfer_type?: string;
}

export interface FundRequestListResponse {
  results: FundRequestItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface FundRequestListParams {
  page?: number;
  page_size?: number;
  code?: string;
  search?: string;
}

export interface CreateFundRequestRequest {
  transaction_date: string;
  notes: string;
  type: string;
  budget_control?: string;
  transfer_type?: string;
}

export interface UpdateFundRequestRequest {
  transaction_date: string;
  notes: string;
  type: string;
  budget_control?: string;
  transfer_type?: string;
}

export interface FundRequestResponse {
  transaction_id: number;
  message: string;
}

export const fundRequestApi = createApi({
  reducerPath: 'fundRequestApi',
  baseQuery: customBaseQuery,
  tagTypes: ['FundRequest'],
  endpoints: (builder) => ({
    getFundRequestList: builder.query<FundRequestListResponse, FundRequestListParams>({
      query: ({ page = 1, page_size = 10, code = 'AFR' } = {}) => ({
        url: `/budget/transfers/list/`,
        method: 'GET',
        params: {
          page,
          page_size,
          code,
        },
      }),
      providesTags: ['FundRequest'],
    }),
    createFundRequest: builder.mutation<FundRequestResponse, CreateFundRequestRequest>({
      query: (body) => ({
        url: `/budget/transfers/create/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FundRequest'],
    }),
    updateFundRequest: builder.mutation<FundRequestResponse, { id: number; body: UpdateFundRequestRequest }>({
      query: ({ id, body }) => ({
        url: `/budget/transfers/${id}/update/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['FundRequest'],
    }),
    deleteFundRequest: builder.mutation<FundRequestResponse, number>({
      query: (id) => ({
        url: `/budget/transfers/${id}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FundRequest'],
    }),
  }),
});

export const { 
  useGetFundRequestListQuery,
  useCreateFundRequestMutation,
  useUpdateFundRequestMutation,
  useDeleteFundRequestMutation,
} = fundRequestApi;
