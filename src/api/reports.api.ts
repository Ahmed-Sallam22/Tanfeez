import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface BalanceReportItem {
  control_budget_name: string;
  ledger_name: string | null;
  as_of_period: string;
  segment1: string;
  segment2: string;
  segment3: string;
  encumbrance_ytd: number;
  other_ytd: number;
  actual_ytd: number;
  funds_available_asof: number;
  budget_ytd: number;
  budget_adjustments: number;
  commitments: number;
  expenditures: number;
  initial_budget: number;
  obligations: number;
  other_consumption: number;
  total_budget: number;
  total_consumption: number;
}

export interface BalanceReportResponse {
  message: string;
  data: {
    success: boolean;
    data: BalanceReportItem[];
    message: string;
    total_records: number;
    count?: number;
    next?: string;
    previous?: string;
    current_page?: number;
    total_pages?: number;
  };
}

export interface BalanceReportParams {
  control_budget_name: string;
  as_of_period: string;
  page?: number;
  page_size?: number;
}

// New segment fund item structure
export interface SegmentFundItem {
  id: number;
  Control_budget_name: string;
  Period_name: string;
  Budget: number;
  Encumbrance: number;
  Funds_available: number;
  Commitment: number;
  Obligation: number;
  Actual: number;
  Other: number;
  Created_at: string;
  control_budget_name: string;
  period_name: string;
  segment5?: string;
  segment9?: string;
  segment11?: string;
}

// New segment fund response structure
export interface SegmentFundResponse {
  message: string;
  count: number;
  total_records_in_db: number;
  filters_applied: {
    CONTROL_BUDGET_NAME: string;
    PERIOD_NAME: string;
  };
  next: string | null;
  previous: string | null;
  page: number;
  page_size: number;
  data: SegmentFundItem[];
}

// New segment fund params
export interface SegmentFundParams {
  control_budget_name?: string;
  period_name: string;
  page?: number;
  page_size?: number;
  // Column filters
  segment5?: string;
  segment9?: string;
  segment11?: string;
  budget?: string;
  encumbrance?: string;
  funds_available?: string;
  commitment?: string;
  obligation?: string;
  actual?: string;
  other?: string;
}

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    getBalanceReport: builder.query<BalanceReportResponse, BalanceReportParams>({
      query: ({ control_budget_name, as_of_period, page = 1, page_size = 10 }) => ({
        url: `/accounts-entities/balance-report/single_balance/`,
        method: 'GET',
        params: {
          control_budget_name,
          as_of_period,
          page,
          page_size,
        },
      }),
      providesTags: ['Report'],
    }),
    // New endpoint for segment funds
    getSegmentsFund: builder.query<SegmentFundResponse, SegmentFundParams>({
      query: ({ 
        control_budget_name = 'MOFA_CASH', 
        period_name, 
        page = 1, 
        page_size = 10,
        // Column filters
        segment5,
        segment9,
        segment11,
        budget,
        encumbrance,
        funds_available,
        commitment,
        obligation,
        actual,
        other,
      }) => {
        const params: Record<string, string | number> = {
          control_budget_name,
          period_name,
          page,
          page_size,
        };

        // Add column filters to params if they exist
        if (segment5) params.segment5 = segment5;
        if (segment9) params.segment9 = segment9;
        if (segment11) params.segment11 = segment11;
        if (budget) params.budget = budget;
        if (encumbrance) params.encumbrance = encumbrance;
        if (funds_available) params.funds_available = funds_available;
        if (commitment) params.commitment = commitment;
        if (obligation) params.obligation = obligation;
        if (actual) params.actual = actual;
        if (other) params.other = other;

        return {
          url: `/accounts-entities/segments/get_segments_fund/`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['Report'],
    }),
  }),
});

export const { 
  useGetBalanceReportQuery,
  useGetSegmentsFundQuery,
} = reportsApi;
