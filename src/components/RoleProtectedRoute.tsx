import type { ReactElement } from "react";
import { useUserRole } from "../features/auth/hooks";
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery } from "@/api/auth.api";

interface RoleProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: string[];
  allowedAbilities?: string[];
  fallback?: ReactElement;
}

export default function RoleProtectedRoute({
  children,
  allowedRoles = [],
  allowedAbilities = [],
  fallback,
}: RoleProtectedRouteProps) {
  const { t } = useTranslation();
  const userRole = useUserRole();

  // Fetch user profile to get abilities
  const { data: userProfile } = useGetUserProfileQuery(undefined, {
    skip: !userRole, // Only fetch if user has a role (is authenticated)
  });

  const fallbackContent = fallback ?? (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {t("messages.accessDeniedTitle")}
        </h2>
        <p className="text-gray-600">{t("messages.accessDeniedDescription")}</p>
      </div>
    </div>
  );

  // Check role-based access
  const hasRoleAccess =
    allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole));

  // Extract all abilities from user groups
  const userAbilities: string[] = userProfile?.groups
    ? userProfile.groups.flatMap((group) => group.abilities)
    : [];

  // Check ability-based access - user needs at least one of the allowed abilities
  const hasAbilityAccess =
    allowedAbilities.length === 0 ||
    allowedAbilities.some((ability) => userAbilities.includes(ability));

  // Grant access if user meets either role OR ability requirements
  // Super admin has access to everything
  const hasAccess = hasRoleAccess || hasAbilityAccess;

  if (!hasAccess) {
    return fallbackContent;
  }

  return children;
}
