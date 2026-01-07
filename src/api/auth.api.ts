import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './baseQuery';
import type { 
  User, 
  AuthTokens, 
  LoginRequest, 
  LoginResponse,
  RegisterRequest, 
  ResetPasswordRequest, 
  ConfirmResetPasswordRequest 
} from '../types/auth';
import type { LogoutRequest } from '../types/auth';

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export interface UserGroup {
  group_name: string;
  group_id: number;
  roles: string[];
  abilities: string[];
}

export interface UserProfile {
  user_id: number;
  username: string;
  role: string;
  user_level: string;
  groups: UserGroup[];
  is_assigned_to_groups: boolean;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ 
        url: '/auth/login/', 
        method: 'POST', 
        body 
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    requestReset: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({ url: '/auth/request-reset', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<{ message: string }, ConfirmResetPasswordRequest>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    getMe: builder.query<User, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
    }),
    getUserProfile: builder.query<UserProfile, void>({
      query: () => ({ url: '/auth/profile/simple', method: 'GET' }),
    }),
    logout: builder.mutation<{ message: string }, LogoutRequest>({
      query: (body) => ({ 
        url: '/auth/logout/', 
        method: 'POST', 
        body
      }),
    }),
    refreshToken: builder.mutation<{ token: string; refresh: string }, { refresh: string; user_id: number }>({
      query: (body) => ({ url: '/auth/token-refresh/', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRequestResetMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useGetUserProfileQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi;
