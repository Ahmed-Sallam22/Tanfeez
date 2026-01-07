import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface TransferItem {
  transaction_id: number;
  transaction_date: string;
  amount: number;
  status: string;
  requested_by: string;
  user_id: number;
  request_date: string;
  code: string;
  notes:string;
  budget_control: string;
  control_budget: string; // Alternative field name used in some API responses
  transfer_type: string; // Type of transfer: داخلية, خارجية, مخصصات
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
  fy: string | null;
  group_id: number | null;
  interface_id: number | null;
  reject_group_id: number | null;
  reject_interface_id: number | null;
  approve_group_id: number | null;
  approve_interface_id: number | null;
  report: string;
  type: string;
  // HFR (Hold Fund Reservation) specific fields
  hfr_original_hold?: number;
  hfr_total_used?: number;
  hfr_remaining?: number;
  hfr_has_remaining?: boolean;
  hfr_is_fully_used?: boolean;
  hfr_linked_far_count?: number;
}

export interface TransferListResponse {
  results: TransferItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface TransferListParams {
  page?: number;
  page_size?: number;
  code?: string;
  search?: string;
}

export interface AllTransfersListParams {
  page?: number;
  page_size?: number;
  search?: string;
  user_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  code?: string; // Transaction type: FAR, AFR, HFR, DFR
}

export interface CreateTransferRequest {
  transaction_date: string;
  budget_control: string;
  notes: string;
  type: string;
}

export interface UpdateTransferRequest {
  transaction_date: string;
  notes: string;
  type: string;
}

export interface TransferResponse {
  transaction_id: number;
  message: string;
}

export interface TransferStatusResponse {
  transaction_id: number;
  transfer_status: string;
  workflows: {
    execution_order: number;
    workflow_code: string;
    workflow_name: string;
    workflow_status: string;
    stages: {
      order_index: number;
      name: string;
      decision_policy: string;
      status: string;
      acted_by?: {
        id: number;
        username: string;
        action_at: string;
      };
      comment?: string;
    }[];
  }[];
}

export interface OracleStatusStep {
  step_number: number;
  step_name: string;
  status: string;
  message: string;
  request_id: string | null;
  document_id: string | null;
  group_id: string | null;
  created_at: string;
  completed_at: string;
}

export interface OracleActionGroup {
  action_type: string;
  steps: OracleStatusStep[];
}

export interface OracleStatusResponse {
  transaction_id: string;
  total_records: number;
  action_groups: OracleActionGroup[];
}

export interface ExportPdfRequest {
  transaction_ids: number[];
}

// Segment data structure for PDF export
export interface PdfSegment {
  segment_name: string;
  segment_id: number;
  from_code: string;
  from_name: string;
  to_code: string;
  to_name: string;
}

// Budget control data for PDF export
export interface PdfBudgetControl {
  control_budget_name: string;
  period_name: string;
  budget: number;
  encumbrance: number;
  funds_available: number;
  actual: number;
  other: number;
  created_at: string | null;
}

// Transfer item in PDF export
export interface PdfTransfer {
  transfer_id: number;
  segments: {
    [key: string]: PdfSegment;
  };
  gfs_code?: number;
  from_center: number;
  to_center: number;
  reason: string;
  budget_control: PdfBudgetControl;
}

// Summary data for PDF export
export interface PdfSummary {
  total_transfers: number;
  total_from_center: number;
  total_to_center: number;
  balanced: boolean;
  balance_difference: number;
}

// Single transaction report data
export interface TransactionReportData {
  transaction_id: number;
  code: string;
  budget_type: string;
  requested_by: string;
  request_date: string;
  transaction_date: string;
  transfer_type: string;
  type: string;
  control_budget: string;
  status: string;
  status_level: number;
  notes: string;
  linked_transfer_id: number | null;
  summary: PdfSummary;
  transfers: PdfTransfer[];
}

// Response can be a single transaction or array of transactions
export type ExportPdfResponse = TransactionReportData | TransactionReportData[];

export const transferApi = createApi({
  reducerPath: 'transferApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Transfer'],
  endpoints: (builder) => ({
    getTransferList: builder.query<TransferListResponse, TransferListParams>({
      query: ({ page = 1, page_size = 10, code = 'FAR', search } = {}) => ({
        url: `/budget/transfers/list/`,
        method: 'GET',
        params: {
          page,
          page_size,
          code,
          search
        },
      }),
      providesTags: ['Transfer'],
    }),
    getAllTransfersList: builder.query<TransferListResponse, AllTransfersListParams>({
      query: ({ page = 1, page_size = 10, search, user_id, status, start_date, end_date, code } = {}) => ({
        url: `/budget/transfers/list/`,
        method: 'GET',
        params: {
          page,
          page_size,
          search,
          user_id,
          status,
          start_date,
          end_date,
          code
        },
      }),
      providesTags: ['Transfer'],
    }),
    createTransfer: builder.mutation<TransferResponse, CreateTransferRequest>({
      query: (body) => ({
        url: `/budget/transfers/create/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Transfer'],
    }),
    updateTransfer: builder.mutation<TransferResponse, { id: number; body: UpdateTransferRequest }>({
      query: ({ id, body }) => ({
        url: `/budget/transfers/${id}/update/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Transfer'],
    }),
    deleteTransfer: builder.mutation<TransferResponse, number>({
      query: (id) => ({
        url: `/budget/transfers/${id}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transfer'],
    }),
    getTransferStatus: builder.query<TransferStatusResponse, number>({
      query: (transactionId) => ({
        url: `/budget/transfers/status/?transaction_id=${transactionId}`,
        method: 'GET',
      }),
      providesTags: ['Transfer'],
    }),
    getOracleStatus: builder.query<OracleStatusResponse, number>({
      query: (transactionId) => ({
        url: `/budget/transfers/Oracle/Status/?transaction_id=${transactionId}`,
        method: 'GET',
      }),
    }),
    exportToPdf: builder.mutation<ExportPdfResponse, ExportPdfRequest>({
      query: (body) => ({
        url: `/transfers/report/`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { 
  useGetTransferListQuery,
  useGetAllTransfersListQuery,
  useCreateTransferMutation,
  useUpdateTransferMutation,
  useDeleteTransferMutation,
  useGetTransferStatusQuery,
  useGetOracleStatusQuery,
  useExportToPdfMutation,
} = transferApi;
