/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

// Normal dashboard data types
export interface TransferTypeData {
  total_transfers: number;
  pending_transfers: number;
  approved_transfers: number;
  rejected_transfers: number;
  transaction_ids: {
    all: number[];
    pending: number[];
    approved: number[];
    rejected: number[];
  };
}

export interface NormalDashboardData {
  total_transfers: number;
  total_transfers_far: number;
  total_transfers_afr: number;
  total_transfers_fad: number;
  approved_transfers: number;
  rejected_transfers: number;
  pending_transfers: number;
  by_transfer_type?: {
    FAR?: TransferTypeData;
    AFR?: TransferTypeData;
    DFR?: TransferTypeData;
    HFR?: TransferTypeData;
  };
  pending_transfers_by_level: {
    Level1: number;
    Level2: number;
    Level3: number;
    Level4: number;
  };
  request_dates: string[];
  approval_rate_analysis: {
    PM_rate: number;
    CM_rate: number;
    relative_change_percent: number;
    percentage_points_change: number;
  };
  performance_metrics: {
    total_processing_time: number;
    counting_time: number;
    total_records_processed: number;
    request_dates_retrieved: number;
  };
}

// Smart dashboard data types
export interface SmartDashboardData {
  filtered_combinations: Array<{
    cost_center_code: number;
    account_code: number;
    total_from_center: number;
    total_to_center: number;
  }>;
  cost_center_totals: Array<{
    cost_center_code: number;
    total_from_center: number;
    total_to_center: number;
  }>;
  account_code_totals: Array<{
    account_code: number;
    total_from_center: number;
    total_to_center: number;
  }>;
  all_combinations: Array<{
    cost_center_code: number;
    account_code: number;
    total_from_center: number;
    total_to_center: number;
  }>;
  applied_filters: {
    cost_center_code: number | null;
  };
  performance_metrics: {
    total_processing_time: number;
    aggregation_time: number;
    cost_center_groups: number;
    account_code_groups: number;
    total_combinations: number;
  };
}

// Combined response for 'all' type
export interface DashboardResponse {
  normal?: NormalDashboardData;
  smart?: SmartDashboardData;
}

export interface DashboardParams {
  type: 'normal' | 'smart' | 'all';
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardData: builder.query<DashboardResponse, DashboardParams>({
      query: ({ type }) => ({
        url: '/budget/dashboard/',
        params: { type }
      }),
      providesTags: ['Dashboard'],
    }),
    getProjectWiseDashboard: builder.query<
  {
    message: string;
    data: {
      project_code: string;
      project_name: string;
      FY24_budget: number;
      FY25_budget_current: number;
      variances: number;
    }[];
  },
  { entity_code: string }
>({
  query: ({ entity_code }) => ({
    url: `/accounts-entities/project-wise-dashboard/?entity_code=${entity_code}`,
    method: "GET",
  }),
}),
getAccountWiseDashboard: builder.query<any, { project_code: string }>({
  query: ({ project_code }) => ({
    url: `/accounts-entities/account-wise-dashboard?project_code=${project_code}`,
    method: "GET",
  }),
}),
 getEntitiesMapping: builder.query<any, void>({
      query: () => `/accounts-entities/entities/mapping/list/`,
    }),
  }),
});

export const {
  useGetDashboardDataQuery,
  useGetProjectWiseDashboardQuery,
  useGetAccountWiseDashboardQuery,
  useGetEntitiesMappingQuery
} = dashboardApi;
