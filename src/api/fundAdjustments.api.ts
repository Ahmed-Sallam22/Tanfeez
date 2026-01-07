import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';
export interface FundAdjustmentItem {
  transaction_id: number;
  transaction_date: string;
  amount: number;
  status: string;
  requested_by: string;
  user_id: number;
  request_date: string;
  code: string;
  budget_control: string;
  control_budget: string;
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

export interface FundAdjustmentListResponse {
  results: FundAdjustmentItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface FundAdjustmentListParams {
  page?: number;
  page_size?: number;
  code?: string;
  search?: string;
}

export interface CreateFundAdjustmentRequest {
  transaction_date: string;
  notes: string;
  type: string;
  budget_control?: string;
  transfer_type?: string;
}

export interface UpdateFundAdjustmentRequest {
  transaction_date: string;
  notes: string;
  type: string;
  budget_control?: string;
  transfer_type?: string;
}

export interface FundAdjustmentResponse {
  transaction_id: number;
  message: string;
}

export const FundAdjustmentsApi = createApi({
  reducerPath: 'FundAdjustmentsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['FundAdjustments'],
  endpoints: (builder) => ({
    getFundAdjustmentList: builder.query<FundAdjustmentListResponse, FundAdjustmentListParams>({
      query: ({ page = 1, page_size = 10, code = 'FAD' } = {}) => ({
        url: `/budget/transfers/list/`,
        method: 'GET',
        params: {
          page,
          page_size,
          code,
        },
      }),
      providesTags: ['FundAdjustments'],
    }),
    createFundAdjustment: builder.mutation<FundAdjustmentResponse, CreateFundAdjustmentRequest>({
      query: (body) => ({
        url: `/budget/transfers/create/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FundAdjustments'],
    }),
    updateFundAdjustment: builder.mutation<FundAdjustmentResponse, { id: number; body: UpdateFundAdjustmentRequest }>({
      query: ({ id, body }) => ({
        url: `/budget/transfers/${id}/update/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['FundAdjustments'],
    }),
    deleteFundAdjustment: builder.mutation<FundAdjustmentResponse, number>({
      query: (id) => ({
        url: `/budget/transfers/${id}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FundAdjustments'],
    }),
  }),
});

export const { 
  useGetFundAdjustmentListQuery,
  useCreateFundAdjustmentMutation,
  useUpdateFundAdjustmentMutation,
  useDeleteFundAdjustmentMutation,
} = FundAdjustmentsApi;
