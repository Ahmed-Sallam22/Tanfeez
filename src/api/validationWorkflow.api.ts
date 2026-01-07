import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

// Validation Step Detail Types (for workflow response)
export interface ValidationStepDetail {
  id: number;
  name: string;
  description: string;
  order: number;
  left_expression: string;
  operation: string;
  right_expression: string;
  if_true_action: string;
  if_true_action_data: Record<string, unknown>;
  if_false_action: string;
  if_false_action_data: Record<string, unknown>;
  failure_message: string | null;
  is_active: boolean;
  referenced_datasources_left: string[];
  referenced_datasources_right: string[];
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
  x?: number;
  y?: number;
}

// Types for Validation Workflow
export interface ValidationWorkflow {
  id: number;
  name: string;
  description: string;
  execution_point: string;
  status: 'draft' | 'active' | 'inactive';
  is_default: boolean;
  initial_step: number | null;
  initial_step_detail: ValidationStepDetail | null;
  steps: ValidationStepDetail[];
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
  new_step_id: number;
}

export interface ValidationWorkflowListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ValidationWorkflow[];
}

export interface CreateValidationWorkflowRequest {
  name: string;
  description: string;
  execution_point: string;
  status: 'draft' | 'active' | 'inactive';
  step_ids?: number[];
}

export interface UpdateValidationWorkflowRequest {
  name?: string;
  description?: string;
  execution_point?: string;
  status?: 'draft' | 'active' | 'inactive';
  step_ids?: number[];
}

// Execution Point Types
export interface ExecutionPoint {
  code: string;
  name: string;
  description: string;
  category: string;
  allowed_datasources: string[];
}

export interface ExecutionPointsResponse {
  execution_points: ExecutionPoint[];
  total_count: number;
}

// Validation Step Types
export interface ValidationStep {
  id?: number;
  step_id?: number;
  name: string;
  description?: string;
  order: number;
  left_expression: string;
  operation: string;
  right_expression: string;
  if_true_action: string;
  if_true_action_data?: Record<string, unknown>;
  if_false_action: string;
  if_false_action_data?: Record<string, unknown>;
  failure_message?: string;
  is_active?: boolean;
  workflow_id?: number;
  x?: number;
  y?: number;
}

export interface BulkCreateStepsRequest {
  workflow_id: number;
  new_step_id: number;
  steps: ValidationStep[];
}

export interface BulkCreateStepsResponse {
  success?: boolean;
  message?: string;
  created_steps?: ValidationStep[];
  steps?: ValidationStep[];
  workflow_id?: number;
  created_count?: number;
}

export interface BulkUpdateStepsRequest {
  new_step_id: number;
  updates: Partial<ValidationStep>[];
}

export interface BulkUpdateStepsResponse {
  success: boolean;
  updated_count: number;
  steps: ValidationStep[];
}

// Datasource Types
export interface Datasource {
  name: string;
  parameters: string[];
  return_type: string;
  description: string;
  function_name: string;
}

export interface DatasourcesResponse {
  execution_point: {
    code: string;
    name: string;
    description: string;
    category: string;
  };
  datasources: Datasource[];
  total_datasources: number;
  usage_example: string;
  message: string;
}

// Export/Import Types
export interface ExportWorkflowsRequest {
  workflow_ids: number[];
  ignore_missing?: boolean;
  as_file?: boolean;
}

export interface ImportWorkflowsRequest {
  file: File;
}

// Status options for the select dropdown
export const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const validationWorkflowApi = createApi({
  reducerPath: 'validationWorkflowApi',
  baseQuery: customBaseQuery,
  tagTypes: ['ValidationWorkflow', 'ExecutionPoints', 'Datasources'],
  endpoints: (builder) => ({
    // Get execution points
    getExecutionPoints: builder.query<ExecutionPointsResponse, void>({
      query: () => ({
        url: '/validations/execution-points/',
        method: 'GET',
      }),
      providesTags: ['ExecutionPoints'],
    }),

    // Get datasources for a specific execution point
    getDatasources: builder.query<DatasourcesResponse, string>({
      query: (executionPointCode) => ({
        url: `/validations/execution-points/${executionPointCode}/datasources/`,
        method: 'GET',
      }),
      providesTags: ['Datasources'],
    }),

    // Get all validation workflows
    getValidationWorkflows: builder.query<ValidationWorkflowListResponse, void>({
      query: () => ({
        url: '/validations/workflows/',
        method: 'GET',
      }),
      providesTags: ['ValidationWorkflow'],
    }),

    // Get single validation workflow by ID
    getValidationWorkflow: builder.query<ValidationWorkflow, number>({
      query: (id) => ({
        url: `/validations/workflows/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'ValidationWorkflow', id }],
    }),

    // Create new validation workflow
    createValidationWorkflow: builder.mutation<ValidationWorkflow, CreateValidationWorkflowRequest>({
      query: (body) => ({
        url: '/validations/workflows/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),

    // Update validation workflow
    updateValidationWorkflow: builder.mutation<ValidationWorkflow, { id: number; body: UpdateValidationWorkflowRequest }>({
      query: ({ id, body }) => ({
        url: `/validations/workflows/${id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),

    // Delete validation workflow
    deleteValidationWorkflow: builder.mutation<void, number>({
      query: (id) => ({
        url: `/validations/workflows/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),

    // Bulk create validation steps
    bulkCreateSteps: builder.mutation<BulkCreateStepsResponse, BulkCreateStepsRequest>({
      query: (body) => ({
        url: '/validations/steps/bulk_create/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),

    // Bulk update validation steps
    bulkUpdateSteps: builder.mutation<BulkUpdateStepsResponse, BulkUpdateStepsRequest>({
      query: (body) => ({
        url: '/validations/steps/bulk_update/',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),

    // Delete validation step
    deleteValidationStep: builder.mutation<void, number>({
      query: (stepId) => ({
        url: `/validations/steps/${stepId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),

    // Export validation workflows
    exportWorkflows: builder.mutation<Blob, ExportWorkflowsRequest>({
      query: (body) => ({
        url: '/validations/workflows/export/',
        method: 'POST',
        body,
        responseHandler: async (response) => {
          return response.blob();
        },
      }),
    }),

    // Import validation workflows
    importWorkflows: builder.mutation<void, FormData>({
      query: (formData) => ({
        url: '/validations/workflows/import/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ValidationWorkflow'],
    }),
  }),
});

export const {
  useGetExecutionPointsQuery,
  useGetDatasourcesQuery,
  useGetValidationWorkflowsQuery,
  useGetValidationWorkflowQuery,
  useCreateValidationWorkflowMutation,
  useUpdateValidationWorkflowMutation,
  useDeleteValidationWorkflowMutation,
  useBulkCreateStepsMutation,
  useBulkUpdateStepsMutation,
  useDeleteValidationStepMutation,
  useExportWorkflowsMutation,
  useImportWorkflowsMutation,
} = validationWorkflowApi;
