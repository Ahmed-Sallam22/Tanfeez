import { useEffect } from 'react';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { useAppSelector } from '../features/auth/hooks';

export default function TokenRefreshManager() {
  const { tokens, isAuthenticated } = useAppSelector(state => state.auth);
  const { refreshToken, isTokenExpiringSoon } = useTokenRefresh();

  useEffect(() => {
    if (!isAuthenticated || !tokens?.token) {
      return;
    }

    // Check if token is expiring soon and refresh if needed
    const checkAndRefreshToken = () => {
      if (isTokenExpiringSoon(tokens.token, 5)) { // 5 minutes threshold
        console.log('Token expiring soon, refreshing...');
        refreshToken();
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Set up interval to check every 2 minutes
    const interval = setInterval(checkAndRefreshToken, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tokens?.token, isAuthenticated, isTokenExpiringSoon, refreshToken]);

  // This component doesn't render anything
  return null;
}
