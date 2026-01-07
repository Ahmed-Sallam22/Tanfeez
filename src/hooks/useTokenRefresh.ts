import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../features/auth/hooks';
import { useRefreshTokenMutation } from '../api/auth.api';
import { setCredentials, showSessionExpired } from '../features/auth/authSlice';

export const useTokenRefresh = () => {
  const dispatch = useAppDispatch();
  const { tokens, user, userLevel, user_level_name } = useAppSelector(state => state.auth);
  const [refreshTokenMutation, { isLoading }] = useRefreshTokenMutation();

  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh) {
      dispatch(showSessionExpired());
      return false;
    }

    try {
      const result = await refreshTokenMutation({ 
        refresh: tokens.refresh,
        user_id: user?.id || 0
      }).unwrap();
      
      if (user && userLevel !== null) {
        dispatch(setCredentials({
          data: user,
          user_level: userLevel,
          user_level_name: user_level_name || '',
          message: 'Token refreshed successfully',
          token: result.token,
          refresh: result.refresh,
        }));
        
        return true;
      } else {
        dispatch(showSessionExpired());
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch(showSessionExpired());
      return false;
    }
  }, [tokens?.refresh, user, userLevel, user_level_name, refreshTokenMutation, dispatch]);

  const isTokenExpired = useCallback((token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }, []);

  const isTokenExpiringSoon = useCallback((token: string, minutesThreshold = 5) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const thresholdTime = currentTime + (minutesThreshold * 60);
      return payload.exp < thresholdTime;
    } catch {
      return true;
    }
  }, []);

  return {
    refreshToken,
    isTokenExpired,
    isTokenExpiringSoon,
    isRefreshing: isLoading,
  };
};
