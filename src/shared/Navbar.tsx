import ProfileDropdown from "@/components/ui/ProfileDropdown";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { Search, Bell } from "lucide-react";
import img from "../assets/Avatar/32px.png";
import { useLogout } from "@/hooks/useLogout";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useGetAllNotificationsQuery } from "@/api/notifications.api";
import { useMemo } from "react";
// import { useGetUserProfileQuery } from "../api/auth.api";

type NavbarProps = {
  onSearchClick?: () => void;
  onBellClick?: () => void;
};

export default function Navbar({ onSearchClick, onBellClick }: NavbarProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { notifications: wsNotifications } = useNotifications();

  // Get API notifications
  const { data: apiData } = useGetAllNotificationsQuery();

  // Calculate unread count from API data (prioritize API over WebSocket)
  const unreadCount = useMemo(() => {
    if (apiData?.notifications) {
      // Count notifications where is_read is false
      const apiUnreadCount = apiData.notifications.filter(
        (n) => !n.is_read
      ).length;

      // Add WebSocket notifications that might not be in API yet
      const wsUnreadCount = wsNotifications.filter((wsN) => {
        const isInApi = apiData.notifications.some(
          (apiN) => apiN.message === wsN.message
        );
        return !wsN.read && !isInApi;
      }).length;

      return apiUnreadCount + wsUnreadCount;
    }

    // Fallback to WebSocket only if API data is not available
    return wsNotifications.filter((n) => !n.read).length;
  }, [apiData, wsNotifications]);

  // Get user data from Redux store (which is synced with localStorage)
  const user = useSelector((state: RootState) => state.auth.user);
  const userLevelNameFromState = useSelector(
    (state: RootState) => state.auth.user_level_name
  );

  // Fallback user data from localStorage if Redux state is not available
  const getUserFromStorage = () => {
    try {
      const authData = localStorage.getItem("auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user;
      }
    } catch (error) {
      console.error("Error parsing auth data from localStorage:", error);
    }
    return null;
  };

  const currentUser = user || getUserFromStorage();
  const logout = useLogout();
  // Capitalize the first letter of each word in the username
  const capitalizeWords = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const userName = currentUser?.username
    ? capitalizeWords(currentUser.username)
    : "User";

  // Default values if no user data is available
  const userRole = currentUser?.role
    ? capitalizeWords(currentUser.role)
    : "Guest";
  const canTransferBudget = currentUser?.can_transfer_budget || false;
  // const { data: userProfile } = useGetUserProfileQuery(undefined, {
  //   skip: !userRole, // Only fetch if user has a role (is authenticated)
  // });

  // Extract role from user's first group
  const userGroupRole =
    // userProfile?.groups?.[0]?.roles?.[0] ||
    userLevelNameFromState || "";

  return (
    <div className="inline-flex items-center gap-2 sm:gap-3 bg-white rounded-full shadow-sm border border-gray-100 px-2 py-2 sm:py-3 max-w-full">
      {/* Language pill - Hidden on mobile, visible on tablet+ */}
      <div className="hidden sm:block relative">
        <div className="flex items-center bg-gray-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => setLocale("EN")}
            className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full transition ${
              locale === "EN"
                ? "bg-white shadow  text-gray-900"
                : "text-[#AFAFAF]  hover:text-gray-700"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("AR")}
            className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full transition ${
              locale === "AR"
                ? "bg-white shadow text-gray-900"
                : "text-[#AFAFAF]  hover:text-gray-700"
            }`}
          >
            AR
          </button>
        </div>
      </div>

      {/* Icon buttons */}
      <button
        type="button"
        aria-label={t("navbar.search")}
        onClick={onSearchClick}
        className="relative h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-full border border-gray-200 hover:bg-gray-50 flex-shrink-0"
      >
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
      </button>

      <button
        type="button"
        aria-label={t("navbar.notifications")}
        onClick={onBellClick}
        className="relative h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-full border border-gray-200 hover:bg-gray-50 flex-shrink-0"
      >
        <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
        {/* Notification badge - only show when there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Divider - Hidden on mobile */}
      <span className="hidden sm:block h-6 w-px bg-gray-200 mx-1" />

      {/* User */}
      <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2 min-w-0">
        {/* Budget Transfer Permission Indicator */}
        {canTransferBudget && (
          <div
            className="hidden sm:flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"
            title="Budget Transfer Authorized"
          ></div>
        )}

        <ProfileDropdown
          user_level={userGroupRole}
          userName={userName}
          userRole={userRole}
          avatarUrl={img}
          onLogout={() => logout()}
        />
      </div>
    </div>
  );
}
