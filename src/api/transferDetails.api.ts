import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface SegmentData {
  segment_name: string;
  segment_type: string;
  from_code: string | null;
  from_alias: string | null;
  to_code: string | null;
  to_alias: string | null;
}

export interface ControlBudget {
  id: number;
  Control_budget_name: string;
  Period_name: string;
  Budget: number;
  Encumbrance: number;
  Funds_available: number;
  Commitments: number;
  Obligation: number;
  Actual: number;
  Other: number;
  Created_at: string;
  segment5: string;
  segment9: string;
  segment11: string;
  // New budget tracking fields
  Total_budget?: number;
  Initial_budget?: number;
  Budget_adjustments?: number;
}

export interface TransferDetail {
  transfer_id: number;
  approved_budget: string;
  available_budget: string;
  from_center: string;
  to_center: string;
  reason: string | null;
  account_code: number | null;
  account_name: string | null;
  project_code: string | null;
  project_name: string | null;
  cost_center_code: number | null;
  cost_center_name: string | null;
  done: number;
  encumbrance: string;
  actual: string;
  file: string | null;
  transaction: number;
  validation_errors?: string[];
  segment_summary?: string;
  is_valid?: boolean;
  // New financial fields
  budget_adjustments?: string;
  commitments?: string;
  expenditures?: string;
  initial_budget?: string;
  obligations?: string;
  other_consumption?: string;
  // New segments structure
  segments?: Record<string, SegmentData>; // e.g., { "5": { segment_name: "...", from_code: "...", ... } }
  // Control budgets array
  control_budgets?: ControlBudget[];
  control_budgets_count?: number;
}

export interface HistorySegmentBreakdown {
  transfer_line_id: number;
  segments: Record<string, SegmentData>;
  original_hold: number;
  total_used: number;
  remaining: number;
  percentage_used: number;
  far_usage: any[];
  can_unhold: boolean;
}

export interface TransferHistory {
  original_hold: number;
  total_used: number;
  remaining_in_hold: number;
  can_unhold_remaining: boolean;
  segment_breakdown: HistorySegmentBreakdown[];
  total_segments: number;
  suggestion: string;
}

export interface TransferDetailsSummary {
  transaction_id: string;
  code?: string;
  request_date?: string;
  transfer_type?: string;
  control_budget?: string;
  notes?: string;
  total_transfers: number;
  total_from: number;
  total_to: number;
  balanced: boolean;
  status: string;
  period: string;
  History?: TransferHistory;
}

export interface TransferDetailsStatus {
  status: string;
}

export interface TransferDetailsResponse {
  summary: TransferDetailsSummary;
  transfers: TransferDetail[];
  status: TransferDetailsStatus;
  validation_errors?: Array<{
    scope?: string;
    transaction_id?: string;
    transfer_id?: number;
    workflow?: string;
    step?: string;
    message?: string;
    execution_id?: string | null;
  }>;
}

export interface UpdateTransferDetailRequest {
  transfer_id: number;
  from_center?: string;
  to_center?: string;
  cost_center_code?: number;
}

export interface UpdateTransferDetailResponse {
  success: boolean;
  message?: string;
}

export interface CreateTransferData {
  transaction: number;
  from_center: string;
  to_center: string;
  reason?: string;
  segments: Record<string, { code: string }>; // e.g., { "5": { "code": "2760000" }, "9": { "code": "013800000000" } }
}

export interface CreateTransferRequest {
  transfers: CreateTransferData[];
}

export interface CreateTransferResponse {
  summary: TransferDetailsSummary;
  transfers: TransferDetail[];
  status: TransferDetailsStatus;
}

export interface SubmitTransferRequest {
  transaction: number;
}

export interface SubmitTransferResponse {
  success: boolean;
  message?: string;
}

export interface ExcelUploadRequest {
  file: File;
  transaction: number;
}

export interface ExcelUploadResponse {
  success: boolean;
  message?: string;
  created_transfers?: number[];
}

export interface ReopenTransferRequest {
  transaction: number;
  action: string;
}

export interface ReopenTransferResponse {
  success: boolean;
  message?: string;
}

export interface ExcelTemplateResponse {
  message: string;
  download_url: string;
  filename: string;
}

export interface FinancialDataParams {
  segments: Record<string, string | number>; // Dynamic segments (e.g., { Segment5: "100", Segment9: "200" })
}

export interface FinancialDataRecord {
  id: number;
  segment5?: string;
  segment9?: string;
  segment11?: string;
  Budget: number; // Capitalized in API response
  Encumbrance: number; // Capitalized in API response
  Funds_available: number; // Capitalized in API response
  Commitment: number; // Capitalized in API response
  Obligation: number; // Capitalized in API response
  Actual: number; // Capitalized in API response
  Other: number; // Capitalized in API response
  Period_name: string; // Capitalized in API response
  Control_budget_name: string; // Capitalized in API response
  Created_at?: string; // Capitalized in API response
  Total_budget?: number; // New budget tracking field
  Initial_budget?: number; // New budget tracking field
  Budget_adjustments?: number; // New budget tracking field
}

export interface FinancialDataResponse {
  message: string;
  count: number;
  total_records_in_db?: number;
  filters_applied?: Record<string, string>;
  data: FinancialDataRecord[]; // Direct array, not nested
}

export const transferDetailsApi = createApi({
  reducerPath: 'transferDetailsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['TransferDetails'],
  endpoints: (builder) => ({
    getTransferDetails: builder.query<TransferDetailsResponse, string>({
      query: (transactionId) => ({
        url: `/transfers/`,
        method: 'GET',
        params: {
          transaction: transactionId,
        },
      }),
      providesTags: (_result, _error, transactionId) => [
        { type: 'TransferDetails', id: transactionId }
      ],
    }),
    updateTransferDetail: builder.mutation<UpdateTransferDetailResponse, UpdateTransferDetailRequest>({
      query: ({ transfer_id, ...body }) => ({
        url: `/transfers/${transfer_id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { transfer_id }) => [
        { type: 'TransferDetails', id: 'LIST' },
        { type: 'TransferDetails', id: transfer_id.toString() }
      ],
    }),
    createTransfer: builder.mutation<CreateTransferResponse, CreateTransferData[]>({
      query: (transfers) => ({
        url: `/transfers/create/`,
        method: 'POST',
        body: transfers,
      }),
      invalidatesTags: ['TransferDetails'],
    }),
    submitTransfer: builder.mutation<SubmitTransferResponse, SubmitTransferRequest>({
      query: (body) => ({
        url: `/transfers/submit/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TransferDetails'],
    }),
    getFinancialData: builder.query<FinancialDataResponse, FinancialDataParams>({
      query: ({ segments }) => {
        // Build query params from dynamic segments
        const params = new URLSearchParams();
        Object.entries(segments).forEach(([key, value]) => {
          params.append(key, value.toString());
        });
        
        return {
          url: `/accounts-entities/segments/get_segment_fund/?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['TransferDetails'],
    }),
    uploadExcel: builder.mutation<ExcelUploadResponse, ExcelUploadRequest>({
      query: ({ file, transaction }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('transaction', transaction.toString());
        
        return {
          url: `/transfers/excel-upload/`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['TransferDetails'],
    }),
    reopenTransfer: builder.mutation<ReopenTransferResponse, ReopenTransferRequest>({
      query: (body) => ({
        url: `/transfers/reopen/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TransferDetails'],
    }),
    getExcelTemplate: builder.query<ExcelTemplateResponse, void>({
      query: () => ({
        url: `/transfers/excel-template/`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetTransferDetailsQuery,
  useUpdateTransferDetailMutation,
  useCreateTransferMutation,
  useSubmitTransferMutation,
  useGetFinancialDataQuery,
  useUploadExcelMutation,
  useReopenTransferMutation,
  useLazyGetExcelTemplateQuery,
} = transferDetailsApi;
