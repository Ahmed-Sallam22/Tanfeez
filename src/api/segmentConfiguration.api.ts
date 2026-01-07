import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface SegmentType {
  segment_id: number;
  segment_name: string;
  segment_type: string;
  segment_type_oracle_number: number;
  segment_type_is_required: boolean;
  segment_type_has_hierarchy: boolean;
  segment_type_display_order: number;
  segment_type_status: string;
  description: string;
  total_segments: number;
}

export interface CreateSegmentTypeRequest {
  segment_name: string;
  oracle_segment_number: number;
  is_required: string; // "True" or "False"
  has_hierarchy: string; // "True" or "False"
  display_order: number;
  description: string;
}

export interface SegmentTypesResponse {
  message: string;
  total_types: number;
  data: SegmentType[];
}

export interface LoadSegmentsResponse {
  message: string;
  created_count: number;
  skipped_count: number;
  total_records: number;
}

export interface LoadFundsResult {
  control_budget: string;
  success: boolean;
  message: string;
}

export interface LoadFundsResponse {
  message: string;
  total_success: number;
  total_failed: number;
  results: LoadFundsResult[];
}

export interface Segment {
  id: number;
  segment_type: number;
  segment_type_name: string;
  code: string;
  alias: string;
  parent_code: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentsResponse {
  message: string;
  data: Segment[];
  segment_type: string;
  segment_type_id: number;
  filter_applied: string;
  total_count: number;
}

export const segmentConfigurationApi = createApi({
  reducerPath: 'segmentConfigurationApi',
  baseQuery: customBaseQuery,
  tagTypes: ['SegmentTypes', 'Segments'],
  endpoints: (builder) => ({
    // Get all segment types
    getSegmentTypes: builder.query<SegmentTypesResponse, void>({
      query: () => ({
        url: '/accounts-entities/segment-types/',
        method: 'GET',
      }),
      providesTags: ['SegmentTypes'],
    }),

    // Create segment type
    createSegmentType: builder.mutation<SegmentType, CreateSegmentTypeRequest>({
      query: (segmentType) => ({
        url: '/accounts-entities/segment-types/create/',
        method: 'POST',
        body: segmentType,
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Update segment type
    updateSegmentType: builder.mutation<
      SegmentType,
      { id: number; data: CreateSegmentTypeRequest }
    >({
      query: ({ id, data }) => ({
        url: `/accounts-entities/segment-types/${id}/update/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Delete segment type
    deleteSegmentType: builder.mutation<void, number>({
      query: (id) => ({
        url: `/accounts-entities/segment-types/${id}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Toggle required status
    toggleSegmentRequired: builder.mutation<
      SegmentType,
      { id: number; is_required: boolean }
    >({
      query: ({ id, is_required }) => ({
        url: `/accounts-entities/segment-types/${id}/`,
        method: 'PATCH',
        body: { segment_type_is_required: is_required },
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Toggle hierarchy status
    toggleSegmentHierarchy: builder.mutation<
      SegmentType,
      { id: number; has_hierarchy: boolean }
    >({
      query: ({ id, has_hierarchy }) => ({
        url: `/accounts-entities/segment-types/${id}/`,
        method: 'PATCH',
        body: { segment_type_has_hierarchy: has_hierarchy },
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Load segments values from control budgets
    loadSegmentsValues: builder.mutation<LoadSegmentsResponse, void>({
      query: () => ({
        url: '/accounts-entities/segments/load_Segments_oracle/',
        method: 'GET',
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Load funds data for segments
    loadSegmentsFunds: builder.mutation<LoadFundsResponse, { period_name: string }>({
      query: ({ period_name }) => ({
        url: `/accounts-entities/segments/load_Segments_oracle/Funds/?period_name=${period_name}`,
        method: 'GET',
      }),
      invalidatesTags: ['SegmentTypes'],
    }),

    // Get segments by segment type
    getSegmentsByType: builder.query<SegmentsResponse, number>({
      query: (segmentType) => ({
        url: `/accounts-entities/segments/?segment_type=${segmentType}`,
        method: 'GET',
      }),
      providesTags: ['Segments'],
    }),

    // Get segments by segment type filtered by parent code (for internal transfers)
    getSegmentsByTypeAndParent: builder.query<
      SegmentsResponse,
      { segmentType: number; parentCode: string }
    >({
      query: ({ segmentType, parentCode }) => ({
        url: `/accounts-entities/segments/?segment_type=${segmentType}&same_filter_code=${parentCode}`,
        method: 'GET',
      }),
      providesTags: ['Segments'],
    }),
  }),
});

export const {
  useGetSegmentTypesQuery,
  useCreateSegmentTypeMutation,
  useUpdateSegmentTypeMutation,
  useDeleteSegmentTypeMutation,
  useToggleSegmentRequiredMutation,
  useToggleSegmentHierarchyMutation,
  useLoadSegmentsValuesMutation,
  useLoadSegmentsFundsMutation,
  useGetSegmentsByTypeQuery,
  useGetSegmentsByTypeAndParentQuery,
} = segmentConfigurationApi;
