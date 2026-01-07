import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';

export interface WorkflowTemplate {
  id: number;
  code: string;
  transfer_type: string;
  name: string;
  description: string;
  is_active: boolean;
  affect_active_instances?: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStage {
  id?: number;
  order_index: number;
  name: string;
  decision_policy: 'ALL' | 'ANY' | 'QUORUM';
  quorum_count?: number | null;
  required_role?: number | null; // FK to XX_SecurityGroupRole ID
  required_role_name?: string; // Display name from backend
  dynamic_filter_json?: Record<string, unknown> | null;
  allow_reject: boolean;
  allow_delegate?: boolean;
  sla_hours: number;
  parallel_group?: string | null;
  /** @deprecated Use required_role instead */
  required_user_level?: number;
  required_user_level_name?: string;
  /** @deprecated Phase 6: Security groups are now assigned to entire workflows, not individual stages */
  security_group?: number | null;
  /** @deprecated Phase 6: Security groups are now assigned to entire workflows, not individual stages */
  security_group_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowTemplateWithStages extends WorkflowTemplate {
  stages: WorkflowStage[];
}

export interface CreateWorkflowRequest {
  code: string;
  transfer_type: string;
  name: string;
  description: string;
  version: number;
  is_active: boolean;
  affect_active_instances: boolean;
  stages: WorkflowStage[];
}

export interface UserLevel {
  id: number;
  name: string;
  description: string;
  level_order: number;
}

export type UserLevelResponse = UserLevel[];

export interface SecurityGroupRole {
  id: number; // XX_SecurityGroupRole ID (this is what required_role needs)
  security_group_id: number;
  security_group_name: string;
  role_id: number; // xx_UserLevel ID
  role_name: string;
  role_description: string;
  level_order: number;
  is_active: boolean;
  default_abilities: string[];
  display_name: string; // "Group Name - Role Name"
}

export interface SecurityGroupRolesResponse {
  success: boolean;
  count: number;
  roles: SecurityGroupRole[];
}

export interface WorkflowTemplateListResponse {
  results: WorkflowTemplate[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const workflowApi = createApi({
  reducerPath: 'workflowApi',
  baseQuery: customBaseQuery,
  tagTypes: ['WorkflowTemplate', 'UserLevel'],
  endpoints: (builder) => ({
    getWorkflowTemplates: builder.query<WorkflowTemplateListResponse, void>({
      query: () => ({
        url: '/approvals/workflow-templates/',
        method: 'GET',
      }),
      providesTags: ['WorkflowTemplate'],
    }),
    getUserLevels: builder.query<UserLevelResponse, void>({
      query: () => ({
        url: '/auth/levels/',
        method: 'GET',
      }),
      providesTags: ['UserLevel'],
    }),
    getSecurityGroupRoles: builder.query<SecurityGroupRolesResponse, { securityGroupId?: number; isActive?: boolean } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.securityGroupId) searchParams.append('security_group_id', params.securityGroupId.toString());
        if (params?.isActive !== undefined) searchParams.append('is_active', params.isActive.toString());
        
        const queryString = searchParams.toString();
        return {
          url: `/auth/security-group-roles/all/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['UserLevel'], // Reuse UserLevel tag for cache invalidation
    }),
    createWorkflowTemplate: builder.mutation<WorkflowTemplate, CreateWorkflowRequest>({
      query: (body) => ({
        url: '/approvals/workflow-templates/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkflowTemplate'],
    }),
    updateWorkflowTemplate: builder.mutation<WorkflowTemplate, { id: number; body: Partial<CreateWorkflowRequest> }>({
      query: ({ id, body }) => ({
        url: `/approvals/workflow-templates/${id}/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['WorkflowTemplate'],
    }),
    deleteWorkflowTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/approvals/workflow-templates/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkflowTemplate'],
    }),
    getWorkflowTemplate: builder.query<WorkflowTemplateWithStages, number>({
      query: (id) => ({
        url: `/approvals/workflow-templates/${id}/`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'WorkflowTemplate', id }],
    }),
  }),
});

export const {
  useGetWorkflowTemplatesQuery,
  useGetUserLevelsQuery,
  useGetSecurityGroupRolesQuery,
  useCreateWorkflowTemplateMutation,
  useUpdateWorkflowTemplateMutation,
  useDeleteWorkflowTemplateMutation,
  useGetWorkflowTemplateQuery,
} = workflowApi;