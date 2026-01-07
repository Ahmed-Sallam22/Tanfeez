# Protected Routes Implementation

## Overview
The application now includes a comprehensive protected routes system with authentication guards and role-based access control.

## 🔐 Protection Levels

### 1. Authentication Protection
**ProtectedRoute Component**: Ensures only authenticated users can access protected areas.

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Protect entire app section
<Route 
  path="/app" 
  element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }
>
  {/* All nested routes are automatically protected */}
</Route>

// Prevent authenticated users from accessing auth pages
<Route 
  path="/auth/sign-in" 
  element={
    <ProtectedRoute requireAuth={false}>
      <SignIn />
    </ProtectedRoute>
  } 
/>
```

### 2. Role-Based Protection
**RoleProtectedRoute Component**: Restricts access based on user roles and levels.

```tsx
import RoleProtectedRoute from '@/components/RoleProtectedRoute';

// Admin-only route
<Route 
  path="users" 
  element={
    <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <Users />
    </RoleProtectedRoute>
  } 
/>

// Level-based protection
<RoleProtectedRoute allowedLevels={[1, 2]}>
  <HighLevelComponent />
</RoleProtectedRoute>

// Combined role and level protection
<RoleProtectedRoute 
  allowedRoles={['admin']} 
  allowedLevels={[1]}
>
  <SuperAdminComponent />
</RoleProtectedRoute>
```

## 🛡️ Security Features

### Authentication Guards
- **Login Redirect**: Unauthenticated users are redirected to `/auth/sign-in`
- **Return Path**: After login, users are redirected to their intended destination
- **Auth Page Protection**: Authenticated users can't access login/register pages
- **Token Validation**: Routes automatically validate JWT tokens

### Session Management
- **Auto Logout**: Expired tokens trigger automatic logout
- **Session Modal**: Shows "Session Expired" modal for better UX
- **Secure Cleanup**: All auth data is cleared on logout
- **Persistent State**: Auth state persists across browser sessions

### Role-Based Access Control (RBAC)
- **Role Validation**: Check user roles (admin, superadmin, user)
- **Level Validation**: Check user levels (1, 2, 3, 4)
- **Fallback UI**: Custom "Access Denied" message for unauthorized users
- **Granular Control**: Protect individual routes or components

## 📋 Route Structure

### Public Routes (No Auth Required)
```
/auth/sign-in     - Login page
/auth/sign-up     - Registration page  
/auth/reset       - Password reset page
```

### Protected Routes (Auth Required)
```
/app              - Dashboard (all users)
/app/transfer     - Transfer pages (all users)
/app/fund-*       - Fund management (all users)
/app/projects-*   - Project management (all users)
```

### Admin-Only Routes
```
/app/users        - User management (admin/superadmin only)
```

## 🔧 Component Usage

### ProtectedRoute Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactElement` | Required | Component to protect |
| `requireAuth` | `boolean` | `true` | Whether authentication is required |
| `redirectTo` | `string` | `/auth/sign-in` | Where to redirect unauthenticated users |

### RoleProtectedRoute Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactElement` | Required | Component to protect |
| `allowedRoles` | `string[]` | `[]` | Allowed user roles |
| `allowedLevels` | `number[]` | `[]` | Allowed user levels |
| `fallback` | `ReactElement` | Access Denied UI | What to show when access is denied |

## 🚀 Implementation Examples

### Protecting a Component
```tsx
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';

function AdminPanel() {
  return (
    <RoleProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin-only content */}
      </div>
    </RoleProtectedRoute>
  );
}
```

### Conditional Rendering Based on Permissions
```tsx
import { useUserRole, useUserLevel } from '@/features/auth/hooks';

function Dashboard() {
  const role = useUserRole();
  const level = useUserLevel();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show admin features only to admins */}
      {(role === 'admin' || role === 'superadmin') && (
        <AdminTools />
      )}
      
      {/* Show high-level features only to levels 1-2 */}
      {level && level <= 2 && (
        <HighLevelFeatures />
      )}
      
      {/* Regular content for all users */}
      <RegularContent />
    </div>
  );
}
```

### Custom Access Denied Page
```tsx
const CustomAccessDenied = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
      <h2 className="text-xl font-semibold mb-2">Access Forbidden</h2>
      <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
      <Link to="/app" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  </div>
);

<RoleProtectedRoute 
  allowedRoles={['admin']} 
  fallback={CustomAccessDenied}
>
  <AdminPage />
</RoleProtectedRoute>
```

## 🔄 Authentication Flow

1. **Route Access**: User tries to access protected route
2. **Auth Check**: ProtectedRoute checks authentication status
3. **Redirect**: If not authenticated, redirect to login with return path
4. **Login**: User enters credentials
5. **Success**: After successful login, redirect to intended page
6. **Role Check**: RoleProtectedRoute validates user permissions
7. **Access**: Grant or deny access based on role/level

## 🛠 Integration with Auth System

The protected routes work seamlessly with the authentication system:

- **Redux State**: Uses auth slice for user data
- **Token Management**: Automatically handles JWT tokens
- **Session Expiration**: Integrates with session expired modal
- **Logout**: Proper cleanup and redirection on logout

## ⚡ Performance Considerations

- **Lazy Loading**: Route components are lazy-loaded
- **Minimal Re-renders**: Efficient auth state management
- **Memory Cleanup**: Proper cleanup on logout
- **Token Validation**: Efficient token checking

The protected routes system provides enterprise-level security with excellent user experience!
