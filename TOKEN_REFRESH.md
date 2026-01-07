# Token Refresh Implementation

## Overview
The application now includes automatic and manual JWT token refresh functionality using the `/auth/token-refresh/` endpoint to maintain seamless user sessions.

## 🔄 Token Refresh Features

### 1. Automatic Token Refresh
**TokenRefreshManager Component**: Automatically monitors and refreshes tokens before expiration.

```tsx
import TokenRefreshManager from '@/components/TokenRefreshManager';

// Already integrated in App.tsx
function App() {
  return (
    <>
      <AppRoutes />
      <SessionExpiredModal />
      <TokenRefreshManager />  {/* Automatic refresh */}
    </>
  );
}
```

### 2. Enhanced Base Query
**Smart Token Management**: The API base query automatically handles token refresh on 401 errors.

```typescript
// Automatic flow:
// 1. API call returns 401 (token expired)
// 2. System automatically calls /auth/token-refresh/
// 3. Updates tokens in Redux store
// 4. Retries original API call with new token
// 5. If refresh fails, shows session expired modal
```

### 3. Manual Token Refresh
**useTokenRefresh Hook**: Programmatic token refresh with utility functions.

```tsx
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

function MyComponent() {
  const { 
    refreshToken, 
    isTokenExpired, 
    isTokenExpiringSoon, 
    isRefreshing 
  } = useTokenRefresh();

  const handleManualRefresh = async () => {
    const success = await refreshToken();
    if (success) {
      console.log('Token refreshed successfully');
    }
  };

  // Check token status
  const tokenStatus = isTokenExpired(token) ? 'expired' : 
                     isTokenExpiringSoon(token, 5) ? 'expiring' : 'valid';

  return (
    <div>
      <button onClick={handleManualRefresh} disabled={isRefreshing}>
        {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
      </button>
      <span>Token Status: {tokenStatus}</span>
    </div>
  );
}
```

## 🔧 API Integration

### Token Refresh Endpoint
```
URL: /auth/token-refresh/
Method: POST
Content-Type: application/json
```

### Request Body
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Format
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## ⚙️ Configuration

### Refresh Timing
```typescript
// TokenRefreshManager settings
const EXPIRY_THRESHOLD = 5; // Minutes before expiry to refresh
const CHECK_INTERVAL = 2;   // Minutes between checks

// Automatic checks every 2 minutes
// Refreshes when token expires within 5 minutes
```

### JWT Token Structure
The system expects JWT tokens with standard `exp` (expiration) claims:
```json
{
  "token_type": "access",
  "exp": 1757586851,
  "iat": 1757585051,
  "jti": "44fd991e1710413baf0082c5dfb5d0fa",
  "user_id": "25"
}
```

## 🛠 Implementation Components

### Core Files
- **`api/baseQuery.ts`**: Enhanced with automatic token refresh
- **`hooks/useTokenRefresh.ts`**: Manual refresh utilities
- **`components/TokenRefreshManager.tsx`**: Automatic monitoring
- **`components/TokenRefreshButton.tsx`**: UI component for manual refresh

### Integration Points
- **Redux Store**: Token updates automatically saved
- **API Calls**: All requests use refreshed tokens
- **Session Management**: Integrates with session expired modal
- **Error Handling**: Graceful fallback to login on refresh failure

## 📱 User Experience

### Seamless Operation
- **Background Refresh**: Users never see token expiration
- **Uninterrupted Workflow**: API calls continue without interruption
- **Smart Retry**: Failed requests automatically retry with fresh tokens
- **Graceful Degradation**: Clear session expired message if refresh fails

### Visual Indicators (Optional)
```tsx
import TokenRefreshButton from '@/components/TokenRefreshButton';

// For development/admin interfaces
<TokenRefreshButton 
  variant="primary" 
  showTokenInfo={true} 
/>
```

## 🔒 Security Benefits

### Enhanced Security
- **Short Token Lifespan**: Access tokens can have shorter expiry times
- **Automatic Renewal**: Reduces manual re-authentication
- **Secure Storage**: Refresh tokens handled securely
- **Session Validation**: Continuous session validation

### Error Recovery
- **Network Failures**: Automatic retry on network issues
- **Token Corruption**: Falls back to re-authentication
- **API Downtime**: Graceful handling of refresh endpoint failures

## 🚀 Usage Examples

### Development Testing
```tsx
// Add to any component for testing
import TokenRefreshButton from '@/components/TokenRefreshButton';

function DevTools() {
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded">
      <TokenRefreshButton variant="primary" showTokenInfo={true} />
    </div>
  );
}
```

### Programmatic Usage
```tsx
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

function ApiManager() {
  const { refreshToken, isTokenExpiringSoon } = useTokenRefresh();
  
  useEffect(() => {
    // Check before making important API calls
    const makeImportantCall = async () => {
      if (isTokenExpiringSoon(token, 2)) {
        await refreshToken();
      }
      // Proceed with API call
    };
  }, []);
}
```

### Custom Refresh Trigger
```tsx
// Trigger refresh based on user activity
const handleUserAction = async () => {
  const { refreshToken } = useTokenRefresh();
  
  // Refresh token before important operations
  await refreshToken();
  
  // Proceed with sensitive operation
  await performSensitiveOperation();
};
```

## 📊 Monitoring

### Token Status Checking
```typescript
const { isTokenExpired, isTokenExpiringSoon } = useTokenRefresh();

// Check if immediate action needed
if (isTokenExpired(token)) {
  // Token already expired
  handleExpiredToken();
} else if (isTokenExpiringSoon(token, 1)) {
  // Token expires within 1 minute
  handleExpiringToken();
}
```

### Refresh Success Tracking
```typescript
const success = await refreshToken();
if (success) {
  // Token refresh successful
  analytics.track('token_refresh_success');
} else {
  // Token refresh failed
  analytics.track('token_refresh_failure');
}
```

## 🔄 Flow Diagram

```
User Action → API Call → Token Check
                ↓
           Token Valid? → Continue
                ↓ (No)
           Auto Refresh → Success? → Retry API Call
                ↓ (No)     ↓ (No)
        Session Expired Modal → Redirect to Login
```

The token refresh system ensures uninterrupted user experience while maintaining security through automatic token renewal!
