import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface PendingTransferData {
  // Core fields from backend
  transaction_id: number;
  transaction_date?: string; // e.g., "Mar"
  request_date?: string;     // ISO string
  requested_by?: string;
  amount?: number | string;
  status: string;            // e.g., "pending"
  status_level?: number;
  code?: string;             // e.g., "FAR-0057"

  // Optional/legacy fields (some endpoints might provide these)
  id?: number;
  date?: string;
  from_center?: string;
  to_center?: string;
  attachments?: string;
  currency?: string;
  user_id?: number;
  gl_posting_status?: string;
  approval_1?: string;
  approval_2?: string;
  approval_3?: string;
  approval_4?: string;
  approval_1_date?: string | null;
  approval_2_date?: string | null;
  approval_3_date?: string | null;
  approval_4_date?: string | null;
  attachment?: string;
  notes?: string;
  fy?: string | null;
  group_id?: number | null;
  interface_id?: number | null;
  reject_group_id?: number | null;
  reject_interface_id?: number | null;
  approve_group_id?: number | null;
  approve_interface_id?: number | null;
  report?: string;
  type?: string;
}

export interface PendingTransferResponse {
  results: PendingTransferData[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface PendingTransferQueryParams {
  page?: number;
  page_size?: number;
  code?: string;
  status?: string;
  search?: string;
}

export interface ApprovePendingTransferRequest {
  transfer_id: number;
  approval_note?: string;
}

export interface RejectPendingTransferRequest {
  transfer_id: number;
  rejection_reason?: string;
}

export interface UpdatePendingTransferRequest {
  amount?: number;
  notes?: string;
  status?: string;
}

export interface PendingTransferActionResponse {
  transaction_id: number;
  message: string;
  success?: boolean;
}

export interface BulkApproveRejectRequest {
  transaction_id: number[];
  decide: string[]; // "approve" or "reject"
  reason?: string[];
  other_user_id?: number[];
}

export interface BulkApproveRejectResponse {
  message: string;
  success: boolean;
  processed_transactions?: number[];
}

export interface UnholdRequest {
  transaction_id: number;
}

export interface UnholdResponse {
  message: string;
  success: boolean;
}

export const pendingTransferApi = createApi({
  reducerPath: 'pendingTransferApi',
  baseQuery: customBaseQuery,
  tagTypes: ['PendingTransfer'],
  endpoints: (builder) => ({
    getPendingTransfers: builder.query<PendingTransferResponse, PendingTransferQueryParams>({
      query: ({ page = 1, page_size = 10, code = 'FAR', status = "pending", search } = {}) => ({
        url: `/budget/transfers/list_underapprovel/?status=${status}`,
        method: 'GET',
        params: {
          page,
          page_size,
          code,
          search
        },
      }),
      providesTags: ['PendingTransfer'],
    }),
  
    updatePendingTransfer: builder.mutation<PendingTransferActionResponse, { id: number; body: UpdatePendingTransferRequest }>({
      query: ({ id, body }) => ({
        url: `/budget/transfers/${id}/update/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PendingTransfer'],
    }),
    deletePendingTransfer: builder.mutation<PendingTransferActionResponse, number>({
      query: (id) => ({
        url: `/budget/transfers/${id}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PendingTransfer'],
    }),
    bulkApproveRejectTransfer: builder.mutation<BulkApproveRejectResponse, BulkApproveRejectRequest>({
      query: (body) => ({
        url: `/budget/transfers/approve-reject/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PendingTransfer'],
    }),
    unholdReservation: builder.mutation<UnholdResponse, UnholdRequest>({
      query: (body) => ({
        url: `/budget/transfers/unhold/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PendingTransfer'],
    }),
  }),
});

export const {
  useGetPendingTransfersQuery,

  useUpdatePendingTransferMutation,
  useDeletePendingTransferMutation,
  useBulkApproveRejectTransferMutation,
  useUnholdReservationMutation,
} = pendingTransferApi;
