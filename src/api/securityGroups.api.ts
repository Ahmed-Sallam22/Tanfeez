import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export interface SecurityGroup {
  id: number;
  group_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  total_members: number;
  total_roles: number;
  total_segments: number;
  created_by: string;
}

export interface SecurityGroupRole {
  role_id: number;
  security_group: number;
  role_name: string;
  description: string;
  default_abilities: string[];
  is_active: boolean;
}

export interface UserGroupMembership {
  membership_id: number;
  user_id: number;
  username: string;
  user_role: string;
  assigned_roles: Array<{
    security_group_role_id: number;
    role_id: number;
    role_name: string;
  }>;
  effective_abilities: string[];
  has_custom_abilities: boolean;
  access_mode: string;
  specific_segments_count: number;
  joined_at: string;
  notes?: string;
}

export interface GroupSegmentAccess {
  access_id: number;
  security_group: number;
  segment_type: number;
  segment_type_name?: string;
  segment_value: number;
  segment_code?: string;
  segment_name?: string;
  access_level: string;
  is_active: boolean;
}

export interface MemberAbilityOverride {
  override_id: number;
  membership: number;
  ability_name: string;
  is_granted: boolean;
}

interface CreateGroupRequest {
  group_name: string;
  description: string;
  is_active?: boolean;
}

interface UpdateGroupRequest {
  group_name?: string;
  description?: string;
  is_active?: boolean;
}

interface AddMemberRequest {
  user_id: number;
  role_ids: number[];
  access_mode?: "all_group_segments" | "restricted_segments";
  specific_segment_ids?: number[];
  notes?: string;
}

interface UpdateMemberRequest {
  role_ids?: number[];
  access_mode?: "all_group_segments" | "restricted_segments";
  segment_assignment_ids?: number[];
  notes?: string;
  is_active?: boolean;
}

interface AddSegmentsRequest {
  segment_assignments: Array<{
    segment_type_id: number;
    segment_codes: string[];
  }>;
}

interface AvailableUser {
  id: number;
  username: string;
  role: number;
  role_name: string;
}

interface AvailableSegment {
  id: number;
  segment_type_id: number;
  segment_type_name: string;
  code: string;
  alias: string;
  is_active: boolean;
}

interface SystemRole {
  role_id: number;
  role_name: string;
  description: string;
  default_abilities: string[];
}

interface CreateRoleRequest {
  role_ids: number[];
}

interface UpdateMemberAbilitiesRequest {
  abilities: {
    ability_name: string;
    is_granted: boolean;
  }[];
}

interface TransactionSecurityGroupRequest {
  security_group_id: number;
}

export const securityGroupsApi = createApi({
  reducerPath: "securityGroupsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["SecurityGroups", "GroupMembers", "GroupSegments", "GroupRoles", "TransactionGroup"],
  endpoints: (builder) => ({
    // Security Groups CRUD
    getSecurityGroups: builder.query<{ total_groups: number; groups: SecurityGroup[] }, void>({
      query: () => "/auth/security-groups/",
      providesTags: ["SecurityGroups"],
    }),

    getSecurityGroup: builder.query<SecurityGroup, number>({
      query: (groupId) => `/auth/security-groups/${groupId}/`,
      providesTags: ["SecurityGroups"],
    }),

    createSecurityGroup: builder.mutation<SecurityGroup, CreateGroupRequest>({
      query: (data) => ({
        url: "/auth/security-groups/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SecurityGroups"],
    }),

    updateSecurityGroup: builder.mutation<
      SecurityGroup,
      { groupId: number; data: UpdateGroupRequest }
    >({
      query: ({ groupId, data }) => ({
        url: `/auth/security-groups/${groupId}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SecurityGroups"],
    }),

    deleteSecurityGroup: builder.mutation<void, number>({
      query: (groupId) => ({
        url: `/auth/security-groups/${groupId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["SecurityGroups"],
    }),

    // Group Members Management
    getGroupMembers: builder.query<{ group_id: number; group_name: string; total_members: number; members: UserGroupMembership[] }, number>({
      query: (groupId) => `/auth/security-groups/${groupId}/members/`,
      providesTags: ["GroupMembers"],
    }),

    addGroupMember: builder.mutation<
      UserGroupMembership,
      { groupId: number; data: AddMemberRequest }
    >({
      query: ({ groupId, data }) => ({
        url: `/auth/security-groups/${groupId}/members/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["GroupMembers", "SecurityGroups"],
    }),

    removeGroupMember: builder.mutation<void, { groupId: number; membershipId: number }>({
      query: ({ groupId, membershipId }) => ({
        url: `/auth/security-groups/${groupId}/members/${membershipId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["GroupMembers", "SecurityGroups"],
    }),

    updateGroupMember: builder.mutation<
      UserGroupMembership,
      { groupId: number; membershipId: number; data: UpdateMemberRequest }
    >({
      query: ({ groupId, membershipId, data }) => ({
        url: `/auth/security-groups/${groupId}/members/${membershipId}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["GroupMembers"],
    }),

    // Get available users not in group
    getAvailableUsers: builder.query<
      { users: AvailableUser[] },
      { groupId: number; search?: string }
    >({
      query: ({ groupId, search }) => ({
        url: `/auth/security-groups/${groupId}/available-users/`,
        params: search ? { search } : undefined,
      }),
    }),

    // Group Segments Management
    getGroupSegments: builder.query<{ 
      group_id: number;
      group_name: string;
      total_segments: number;
      segments: Array<{
        id: number;
        segment_type_id: number;
        segment_type_name: string;
        segment_code: string;
        segment_name: string;
        is_active: boolean;
        added_at: string;
      }>;
    }, number>({
      query: (groupId) => `/auth/security-groups/${groupId}/segments/`,
      providesTags: ["GroupSegments"],
    }),

    addGroupSegments: builder.mutation<
      { added_count: number },
      { groupId: number; data: AddSegmentsRequest }
    >({
      query: ({ groupId, data }) => ({
        url: `/auth/security-groups/${groupId}/segments/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["GroupSegments", "SecurityGroups"],
    }),

    toggleGroupSegment: builder.mutation<{ is_active: boolean }, { groupId: number; accessId: number }>({
      query: ({ groupId, accessId }) => ({
        url: `/auth/security-groups/${groupId}/segments/${accessId}/`,
        method: "PATCH",
      }),
      invalidatesTags: ["GroupSegments", "SecurityGroups"],
    }),

    removeGroupSegment: builder.mutation<void, { groupId: number; accessId: number }>({
      query: ({ groupId, accessId }) => ({
        url: `/auth/security-groups/${groupId}/segments/${accessId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["GroupSegments", "SecurityGroups"],
    }),

    // Get available segments for group
    getAvailableSegments: builder.query<
      {
        segment_types: Array<{
          segment_type_id: number;
          segment_type_name: string;
          segments: AvailableSegment[];
        }>;
      },
      { groupId: number; segmentTypeId?: number }
    >({
      query: ({ groupId, segmentTypeId }) => ({
        url: `/auth/security-groups/${groupId}/available-segments/`,
        params: segmentTypeId ? { segment_type_id: segmentTypeId } : undefined,
      }),
    }),

    // Group Roles Management
    getGroupRoles: builder.query<{ group_id: number; group_name: string; total_roles: number; roles: Array<{ id: number; role_id: number; role_name: string; is_active: boolean; added_at: string }>; note?: string }, number>({
      query: (groupId) => `/auth/security-groups/${groupId}/roles/`,
      providesTags: ["GroupRoles"],
    }),

    createGroupRole: builder.mutation<
      SecurityGroupRole,
      { groupId: number; data: CreateRoleRequest }
    >({
      query: ({ groupId, data }) => ({
        url: `/auth/security-groups/${groupId}/roles/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["GroupRoles"],
    }),

    updateGroupRole: builder.mutation<
      SecurityGroupRole,
      { groupId: number; roleId: number; data: Partial<SecurityGroupRole> }
    >({
      query: ({ groupId, roleId, data }) => ({
        url: `/auth/security-groups/${groupId}/roles/${roleId}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["GroupRoles"],
    }),

    deleteGroupRole: builder.mutation<void, { groupId: number; roleId: number }>({
      query: ({ groupId, roleId }) => ({
        url: `/auth/security-groups/${groupId}/roles/${roleId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["GroupRoles", "GroupMembers"],
    }),

    activateGroupRole: builder.mutation<
      {
        success: boolean;
        message: string;
        role: {
          id: number;
          role_id: number;
          role_name: string;
          is_active: boolean;
          group_name: string;
        };
      },
      { groupId: number; roleId: number }
    >({
      query: ({ groupId, roleId }) => ({
        url: `/auth/security-groups/${groupId}/roles/${roleId}/activate/`,
        method: "PATCH",
      }),
      invalidatesTags: ["GroupRoles", "GroupMembers"],
    }),

    deleteGroupRolePermanent: builder.mutation<
      {
        success: boolean;
        message: string;
        deleted_role: {
          role_name: string;
          group_name: string;
        };
      },
      { groupId: number; roleId: number }
    >({
      query: ({ groupId, roleId }) => ({
        url: `/auth/security-groups/${groupId}/roles/${roleId}/delete-permanent/`,
        method: "DELETE",
      }),
      invalidatesTags: ["GroupRoles", "GroupMembers"],
    }),

    deleteSecurityGroupPermanent: builder.mutation<
      {
        success: boolean;
        message: string;
        deleted_group: {
          group_name: string;
        };
      },
      number
    >({
      query: (groupId) => ({
        url: `/auth/security-groups/${groupId}/delete-permanent/`,
        method: "DELETE",
      }),
      invalidatesTags: ["SecurityGroups"],
    }),

    // Get available system roles
    getSystemRoles: builder.query<{ roles: SystemRole[] }, void>({
      query: () => "/auth/roles/",
    }),

    // Role Abilities Management
    getRoleAbilities: builder.query<
      {
        role_id: number;
        role_name: string;
        group_name: string;
        default_abilities: string[];
        available_abilities: string[];
      },
      { groupId: number; roleId: number }
    >({
      query: ({ groupId, roleId }) =>
        `/auth/security-groups/${groupId}/roles/${roleId}/abilities/`,
      providesTags: ["GroupRoles"],
    }),

    updateRoleAbilities: builder.mutation<
      {
        message: string;
        role_id: number;
        default_abilities: string[];
      },
      { groupId: number; roleId: number; abilities: string[] }
    >({
      query: ({ groupId, roleId, abilities }) => ({
        url: `/auth/security-groups/${groupId}/roles/${roleId}/abilities/`,
        method: "PUT",
        body: { abilities },
      }),
      invalidatesTags: ["GroupRoles"],
    }),

    // Member Ability Overrides
    getMemberAbilities: builder.query<
      { results: MemberAbilityOverride[] },
      { groupId: number; membershipId: number }
    >({
      query: ({ groupId, membershipId }) =>
        `/auth/security-groups/${groupId}/members/${membershipId}/abilities/`,
      providesTags: ["GroupMembers"],
    }),

    updateMemberAbilities: builder.mutation<
      { updated_count: number },
      { groupId: number; membershipId: number; data: UpdateMemberAbilitiesRequest }
    >({
      query: ({ groupId, membershipId, data }) => ({
        url: `/auth/security-groups/${groupId}/members/${membershipId}/abilities/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["GroupMembers"],
    }),

    removeMemberAbilities: builder.mutation<
      void,
      { groupId: number; membershipId: number }
    >({
      query: ({ groupId, membershipId }) => ({
        url: `/auth/security-groups/${groupId}/members/${membershipId}/abilities/`,
        method: "DELETE",
      }),
      invalidatesTags: ["GroupMembers"],
    }),

    // Transaction Security Group Assignment
    getTransactionSecurityGroup: builder.query<
      {
        transaction_id: number;
        security_group: SecurityGroup | null;
        is_restricted: boolean;
        message?: string;
      },
      number
    >({
      query: (transactionId) => `/budget-management/transfers/${transactionId}/security-group/`,
      providesTags: ["TransactionGroup"],
    }),

    assignTransactionToGroup: builder.mutation<
      {
        message: string;
        transaction_id: number;
        security_group: SecurityGroup;
      },
      { transactionId: number; data: TransactionSecurityGroupRequest }
    >({
      query: ({ transactionId, data }) => ({
        url: `/budget-management/transfers/${transactionId}/security-group/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["TransactionGroup"],
    }),

    removeTransactionFromGroup: builder.mutation<
      {
        message: string;
        transaction_id: number;
        previous_group: string;
      },
      number
    >({
      query: (transactionId) => ({
        url: `/budget-management/transfers/${transactionId}/security-group/`,
        method: "DELETE",
      }),
      invalidatesTags: ["TransactionGroup"],
    }),
  }),
});

export const {
  useGetSecurityGroupsQuery,
  useGetSecurityGroupQuery,
  useCreateSecurityGroupMutation,
  useUpdateSecurityGroupMutation,
  useDeleteSecurityGroupMutation,
  useDeleteSecurityGroupPermanentMutation,
  useGetGroupMembersQuery,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useUpdateGroupMemberMutation,
  useGetAvailableUsersQuery,
  useGetGroupSegmentsQuery,
  useAddGroupSegmentsMutation,
  useToggleGroupSegmentMutation,
  useRemoveGroupSegmentMutation,
  useGetAvailableSegmentsQuery,
  useGetGroupRolesQuery,
  useCreateGroupRoleMutation,
  useUpdateGroupRoleMutation,
  useDeleteGroupRoleMutation,
  useActivateGroupRoleMutation,
  useDeleteGroupRolePermanentMutation,
  useGetSystemRolesQuery,
  useGetRoleAbilitiesQuery,
  useUpdateRoleAbilitiesMutation,
  useGetMemberAbilitiesQuery,
  useUpdateMemberAbilitiesMutation,
  useRemoveMemberAbilitiesMutation,
  useGetTransactionSecurityGroupQuery,
  useAssignTransactionToGroupMutation,
  useRemoveTransactionFromGroupMutation,
} = securityGroupsApi;
