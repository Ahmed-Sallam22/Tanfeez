import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/hooks";
import { TanfeezLoader } from "../components/ui";

interface ProtectedRouteProps {
  children: ReactElement;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = "/auth/sign-in",
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  // Show loader while auth state is being determined
  if (!isInitialized) {
    return <TanfeezLoader />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access auth pages, redirect to app
  if (!requireAuth && isAuthenticated) {
    // Check if there's a stored redirect location or a previous location
    const storedRedirect = localStorage.getItem("postLoginRedirect");

    // If there's a stored redirect from logout, always prioritize it
    let target;
    if (storedRedirect) {
      target = storedRedirect; // This will be '/app' from logout
      localStorage.removeItem("postLoginRedirect");
    } else {
      target = "/app";
    }

    return <Navigate to={target} replace />;
  }

  // Show loader if authentication status is being determined
  if (requireAuth && isAuthenticated && !user) {
    return <TanfeezLoader />;
  }

  return children;
}
