# Authentication Setup

## Overview
This project now includes a complete authentication system using Redux Toolkit with the following features:

## 🔧 Configuration

### Environment Variables
```env
VITE_API_BASE_URL=https://lightidea.org:9000/api
```

## 📡 API Integration

### Login Endpoint
- **URL**: `/auth/login/`
- **Method**: `POST`
- **Request Body**:
```json
{
  "username": "George",
  "password": "George@123"
}
```

### Response Format
```json
{
  "data": {
    "id": 25,
    "username": "george",
    "role": "superadmin",
    "can_transfer_budget": true
  },
  "user_level": 1,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔒 Features

### 1. Redux Toolkit Integration
- **Auth Slice**: Complete state management for user data
- **RTK Query**: API integration with automatic error handling
- **Persistent Storage**: Auth state persists in localStorage

### 2. User Data Access
Access user information anywhere in the app:

```tsx
import { useUser, useUserRole, useUserLevel, useUserId, useCanTransferBudget } from '@/features/auth/hooks';

function MyComponent() {
  const user = useUser();           // Complete user object
  const role = useUserRole();       // User role (admin, user, etc.)
  const level = useUserLevel();     // User level (1, 2, 3, etc.)
  const userId = useUserId();       // User ID
  const canTransfer = useCanTransferBudget(); // Transfer permission
  
  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <p>Role: {role}</p>
      <p>Level: {level}</p>
      {canTransfer && <button>Transfer Budget</button>}
    </div>
  );
}
```

### 3. Session Management
- **Automatic Token Handling**: Bearer token added to all API requests
- **Session Expiration**: Shows modal when token expires
- **Secure Logout**: Clears all auth data

### 4. Session Expired Modal
When a user's session expires (401 response), the system:
1. Shows a modal: "Your session has expired"
2. Prevents further API calls
3. Provides a "Login" button to redirect to sign-in
4. Automatically clears all auth state

## 🚀 Usage Examples

### Login Form
```tsx
import { useLoginMutation } from '@/api/auth.api';
import { useAppDispatch } from '@/features/auth/hooks';
import { setCredentials } from '@/features/auth/authSlice';

const [login, { isLoading }] = useLoginMutation();
const dispatch = useAppDispatch();

const handleLogin = async (credentials) => {
  try {
    const result = await login(credentials).unwrap();
    dispatch(setCredentials(result));
    // User is now logged in and redirected
  } catch (error) {
    // Error handled automatically
  }
};
```

### Protected Component
```tsx
import { useAuth } from '@/features/auth/hooks';

function ProtectedComponent() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Hello {user?.username}!</div>;
}
```

### Role-Based Access
```tsx
import { useUserRole } from '@/features/auth/hooks';

function AdminPanel() {
  const role = useUserRole();
  
  if (role !== 'superadmin' && role !== 'admin') {
    return <div>Access denied</div>;
  }
  
  return <div>Admin controls here</div>;
}
```

## 🛠 Technical Implementation

### Auth Slice Structure
```typescript
interface AuthState {
  user: User | null;           // User data from API
  userLevel: number | null;    // User level (1, 2, 3, etc.)
  tokens: AuthTokens | null;   // JWT tokens
  isAuthenticated: boolean;    // Authentication status
  showSessionExpiredModal: boolean; // Modal visibility
}
```

### API Configuration
- **Base URL**: Configured via environment variable
- **Authentication**: Bearer token automatically added
- **Error Handling**: 401 errors trigger session expiration
- **Refresh Token**: Supported for future implementation

### Security Features
- Tokens stored securely in Redux + localStorage
- Automatic token cleanup on logout
- Session expiration detection
- Secure API communication

## 📝 Available Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAuth()` | Complete auth state | `{ user, tokens, isAuthenticated, ... }` |
| `useUser()` | Current user data | `User \| null` |
| `useUserRole()` | User role | `string \| undefined` |
| `useUserLevel()` | User level | `number \| null` |
| `useUserId()` | User ID | `number \| undefined` |
| `useCanTransferBudget()` | Transfer permission | `boolean \| undefined` |

## 🔄 State Flow

1. **Login**: User submits credentials → API call → Store tokens & user data
2. **API Requests**: Auto-attach Bearer token to all requests
3. **Token Expiry**: 401 response → Show session expired modal
4. **Logout**: Clear tokens & user data → Redirect to login

The authentication system is now fully integrated and ready for production use!
