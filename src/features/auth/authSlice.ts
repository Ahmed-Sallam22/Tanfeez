import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthTokens, LoginResponse } from '../../types/auth';

interface AuthState {
  user: User | null;
  userLevel: number | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  showSessionExpiredModal: boolean;
  user_level_name?: string | null;
  isInitialized: boolean; // Add this to track if auth has been hydrated
}

const initialState: AuthState = {
  user: null,
  userLevel: null,
  tokens: null,
  isAuthenticated: false,
  showSessionExpiredModal: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<LoginResponse>) {
      const { data, user_level, token, refresh,user_level_name } = action.payload;
      state.user = data;
      state.userLevel = user_level;
      state.user_level_name = user_level_name;
      state.tokens = { token, refresh };
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.showSessionExpiredModal = false;
      
      // Persist to localStorage
      localStorage.setItem('auth', JSON.stringify({
        user: data,
        userLevel: user_level,
          user_level_name,
        tokens: { token, refresh }
      }));
    },
    clearAuth(state) {
      state.user = null;
      state.userLevel = null;
      state.tokens = null;
      state.user_level_name = null; 
      state.isAuthenticated = false;
      state.isInitialized = true; // Keep initialized true after logout
      state.showSessionExpiredModal = false;
      localStorage.removeItem('auth');
    },
    showSessionExpired(state) {
      state.showSessionExpiredModal = true;
      state.isAuthenticated = false;
    },
    hideSessionExpired(state) {
      state.showSessionExpiredModal = false;
    },
    hydrate(state) {
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.user && parsed.tokens) {
            state.user = parsed.user;
            state.userLevel = parsed.userLevel;
            state.user_level_name = parsed.user_level_name;
            state.tokens = parsed.tokens;
            state.isAuthenticated = true;
          }
        } catch {
          localStorage.removeItem('auth');
        }
      }
      state.isInitialized = true; // Always set initialized after hydration attempt
    },
  },
});

export const { setCredentials, clearAuth, showSessionExpired, hideSessionExpired, hydrate } = authSlice.actions;
export const authReducer = authSlice.reducer;
