import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface SegmentTransferData {
  mapping_code: string;
  mapping_code_alias: string;
  segment_code: string;
  segment_alias: string;
  initial_budget: number;
  total_decrease_fund: number;
  total_from: number;
  total_to: number;
  total_additional_fund: number;
  total_budget: number;
  encumbrance: number;
  Futures_column: number;
  actual: number;
  total_actual: number;
  funds_available: number;
  exchange_rate: number;
}

export interface AnalyticalReportSummary {
  total_segments: number;
  grand_initial_budget: number;
  grand_total_decrease_fund: number;
  grand_total_from: number;
  grand_total_to: number;
  grand_total_additional_fund: number;
  grand_total_budget: number;
  grand_encumbrance: number;
  grand_Futures_column: number;
  grand_actual: number;
  grand_total_actual: number;
  grand_funds_available: number;
  grand_exchange_rate: number;
}

export interface AnalyticalReportPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface AnalyticalReportResponse {
  segment_type_id: number;
  segment_column: string;
  control_budget_name: string;
  pagination: AnalyticalReportPagination;
  summary: AnalyticalReportSummary;
  segments: SegmentTransferData[];
}

export interface AnalyticalReportParams {
  segment_type_id: number;
  segment_code?: number | null;
  control_budget_name: string;
  segment_filter?: 'all' | 'with_transfers' | 'with_funds' | 'with_both' | 'with_either';
  transaction_status?: string;
  page?: number;
  page_size?: number;
}

export const analyticalReportApi = createApi({
  reducerPath: 'analyticalReportApi',
  baseQuery: customBaseQuery,
  tagTypes: ['AnalyticalReport'],
  endpoints: (builder) => ({
    getAnalyticalReport: builder.query<AnalyticalReportResponse, AnalyticalReportParams>({
      query: (params: AnalyticalReportParams) => ({
        url: '/accounts-entities/segment_transfer_aggregation/',
        params: {
          segment_type_id: params.segment_type_id,
          ...(params.segment_code && { segment_code: params.segment_code }),
          control_budget_name: params.control_budget_name,
          segment_filter: params.segment_filter || 'all',
          transaction_status: params.transaction_status || 'approved',
          page: params.page || 1,
          page_size: params.page_size || 20,
        },
      }),
      providesTags: ['AnalyticalReport'],
    }),
  }),
});

export const { useGetAnalyticalReportQuery } = analyticalReportApi;
