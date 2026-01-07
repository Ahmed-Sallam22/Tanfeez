import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import toast from 'react-hot-toast';
import { clearAuth, setCredentials } from '../features/auth/authSlice';
import type { AuthTokens, User } from '../types/auth';

// Define a minimal type for the auth state to avoid circular dependency with store.ts
interface AuthState {
  user: User | null;
  userLevel: number | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  user_level_name?: string | null;
}

interface AppState {
  auth: AuthState;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as AppState;
    const token = state.auth?.tokens?.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Helper function to handle logout and redirect
const handleUnauthorized = (api: { dispatch: (action: unknown) => void }) => {
  // Clear all auth data from localStorage
  localStorage.removeItem('auth');
  localStorage.clear();
  
  // Clear auth state in Redux
  api.dispatch(clearAuth());
  
  // Redirect to login page
  window.location.href = '/auth/sign-in';
};

// Helper function to handle access denied
const handleAccessDenied = (message?: string) => {
  if (message) {
    sessionStorage.setItem('accessDeniedMessage', message);
  }
  // Use replace() for immediate redirect without loading state
  window.location.replace('/app/access-denied');
};

export const customBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Check for custom ACCESS_DENIED error in response data (can come with various status codes)
  if (result.error && result.error.data) {
    const errorData = result.error.data as { 
      error?: string; 
      message?: string; 
      success?: boolean;
      details?: string;
    };
    
    // If there's a custom ACCESS_DENIED error, redirect to access denied page
    if (errorData.error === 'ACCESS_DENIED') {
      const message = errorData.message || errorData.details || 'You do not have permission to access this resource';
      handleAccessDenied(message);
      return result;
    }
  }
  
  // Also check successful responses that may contain ACCESS_DENIED error
  if (result.data) {
    const responseData = result.data as { 
      error?: string; 
      message?: string; 
      success?: boolean;
      details?: string;
    };
    
    // If success is false and error is ACCESS_DENIED, redirect to access denied page
    if (responseData.success === false && responseData.error === 'ACCESS_DENIED') {
      const message = responseData.message || responseData.details || 'You do not have permission to access this resource';
      handleAccessDenied(message);
      return result;
    }
  }
  
  // Handle 404 Not Found - only redirect for page navigation, not for API calls
  if (result.error && result.error.status === 404) {
    // For API endpoints, just show a toast notification
    const errorData = result.error.data as { message?: string };
    const message = errorData?.message || 'The requested resource was not found';
    toast.error(message);
    return result;
  }
  
  // Handle 403 Forbidden - Access Denied
  if (result.error && result.error.status === 403) {
    const errorData = result.error.data as { message?: string };
    const message = errorData?.message || 'You do not have permission to access this resource';
    handleAccessDenied(message);
    return result;
  }
  
  if (result.error && result.error.status === 401) {
    const state = api.getState() as AppState;
    const refreshToken = state.auth?.tokens?.refresh;
    
    if (refreshToken && state.auth.isAuthenticated) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: '/auth/token-refresh/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        const refreshData = refreshResult.data as { token: string; refresh: string };
        
        // Update tokens in the store
        const currentUser = state.auth.user;
        const currentUserLevel = state.auth.userLevel;
        const currentUserLevelName = state.auth.user_level_name;
        
        if (currentUser && currentUserLevel !== null) {
          api.dispatch(setCredentials({
            data: currentUser,
            user_level: currentUserLevel,
            user_level_name: currentUserLevelName || '',
            message: 'Token refreshed',
            token: refreshData.token,
            refresh: refreshData.refresh,
          }));
          
          // Retry the original request with new token
          result = await baseQuery(args, api, extraOptions);
        }
      } else {
        // Refresh failed - clear auth and redirect to login
        handleUnauthorized(api);
      }
    } else {
      // No refresh token available or not authenticated - redirect to login
      if (state.auth.isAuthenticated) {
        handleUnauthorized(api);
      }
    }
  }
  
  // if (result.error && result.error.status !== 401) {
  //   // Show error toast for other errors
  //   // const message = (result.error.data as { message?: string })?.message || 'An error occurred';
  //   // toast.error(message);
  // }
  
  return result;
};
