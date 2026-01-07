import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface WorkflowAssignment {
  id: number;
  security_group: number;
  security_group_name: string;
  workflow_template: number;
  workflow_template_name: string;
  workflow_template_code: string;
  transfer_type: string;
  execution_order: number;
  transaction_code_filter?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: number;
}

export interface BulkAssignWorkflowRequest {
  security_group_id: number;
  workflow_assignments: {
    workflow_template_id: number;
    execution_order: number;
    transaction_code_filter?: string | null;
  }[];
}

export interface BulkAssignWorkflowResponse {
  success: boolean;
  message: string;
  deleted_count: number;
  created_count: number;
  assignments: WorkflowAssignment[];
}

export interface WorkflowAssignmentListResponse {
  success: boolean;
  count: number;
  assignments: WorkflowAssignment[];
}

export const workflowAssignmentApi = createApi({
  reducerPath: 'workflowAssignmentApi',
  baseQuery: customBaseQuery,
  tagTypes: ['WorkflowAssignment'],
  endpoints: (builder) => ({
    getWorkflowAssignments: builder.query<WorkflowAssignmentListResponse, number | void>({
      query: (securityGroupId) => ({
        url: securityGroupId 
          ? `/approvals/workflow-assignments/?security_group=${securityGroupId}`
          : '/approvals/workflow-assignments/',
        method: 'GET',
      }),
      providesTags: ['WorkflowAssignment'],
    }),

    createWorkflowAssignment: builder.mutation<WorkflowAssignment, Partial<WorkflowAssignment>>({
      query: (assignment) => ({
        url: '/approvals/workflow-assignments/',
        method: 'POST',
        body: assignment,
      }),
      invalidatesTags: ['WorkflowAssignment'],
    }),

    bulkAssignWorkflows: builder.mutation<BulkAssignWorkflowResponse, BulkAssignWorkflowRequest>({
      query: (data) => ({
        url: '/approvals/workflow-assignments/bulk-assign/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkflowAssignment'],
    }),

    deleteWorkflowAssignment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/approvals/workflow-assignments/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkflowAssignment'],
    }),

    reorderWorkflowAssignments: builder.mutation<
      WorkflowAssignmentListResponse,
      {
        security_group_id: number;
        assignment_orders: { assignment_id: number; execution_order: number }[];
      }
    >({
      query: (data) => ({
        url: '/approvals/workflow-assignments/reorder/',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['WorkflowAssignment'],
    }),
  }),
});

export const {
  useGetWorkflowAssignmentsQuery,
  useCreateWorkflowAssignmentMutation,
  useBulkAssignWorkflowsMutation,
  useDeleteWorkflowAssignmentMutation,
  useReorderWorkflowAssignmentsMutation,
} = workflowAssignmentApi;
