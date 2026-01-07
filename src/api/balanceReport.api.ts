import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface BalanceReportData {
  Cost_Center: string[];
  Account: string[];
  Project: string[];
  total_records: number;
  unique_combinations: number;
}

export interface BalanceReportResponse {
  success: boolean;
  message: string;
  data: BalanceReportData;
}

export interface BalanceReportParams {
  as_of_period: string; // period to be passed from transfer component
}

export interface FinancialDataParams {
  segment1: number; // cost center code
  segment2: number; // account code
  segment3: string; // project code
}

export interface FinancialDataLatestRecord {
  control_budget_name: string;
  ledger_name: string;
  as_of_period: string;
  actual_ytd: number;
  encumbrance_ytd: number;
  funds_available_asof: number;
  other_ytd: number;
  budget_ytd: number;
  last_updated: string;
}

export interface FinancialDataAggregatedTotals {
  total_actual_ytd: number;
  total_encumbrance_ytd: number;
  total_funds_available: number;
  total_other_ytd: number;
  total_budget_ytd: number;
  record_count: number;
}

export interface FinancialDataCalculatedMetrics {
  budget_utilization_percent: number;
  funds_remaining: number;
  total_committed: number;
}

export interface FinancialDataResponse {
  data: {
    segments: {
      segment1: string;
      segment2: string;
      segment3: string;
    };
    latest_record: FinancialDataLatestRecord;
    aggregated_totals: FinancialDataAggregatedTotals;
    calculated_metrics: FinancialDataCalculatedMetrics;
  };
}

export const balanceReportApi = createApi({
  reducerPath: 'balanceReportApi',
  baseQuery: customBaseQuery,
  tagTypes: ['BalanceReport', 'FinancialData'],
  endpoints: (builder) => ({
    getBalanceReport: builder.query<BalanceReportResponse, BalanceReportParams>({
      query: ({ as_of_period }) => ({
        url: `/accounts-entities/balance-report/list/?control_budget_name=MIC_HQ_MONTHLY&as_of_period=${as_of_period}&extract_segments=true`,
        method: 'GET',
      }),
      providesTags: ['BalanceReport'],
    }),
    getFinancialData: builder.query<FinancialDataResponse, FinancialDataParams>({
      query: ({ segment1, segment2, segment3 }) => ({
        url: `/accounts-entities/balance-report/financial-data/?segment1=${segment1}&segment2=${segment2}&segment3=${segment3}`,
        method: 'GET',
      }),
      providesTags: ['FinancialData'],
    }),
  }),
});

export const {
  useGetBalanceReportQuery,
  useGetFinancialDataQuery,
} = balanceReportApi;
