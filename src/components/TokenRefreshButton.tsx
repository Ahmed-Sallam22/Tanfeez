import { useTokenRefresh } from "../hooks/useTokenRefresh";
import { useAppSelector } from "../features/auth/hooks";

interface TokenRefreshButtonProps {
  variant?: "primary" | "secondary" | "minimal";
  showTokenInfo?: boolean;
}

export default function TokenRefreshButton({
  variant = "minimal",
  showTokenInfo = false,
}: TokenRefreshButtonProps) {
  const { tokens, isAuthenticated } = useAppSelector((state) => state.auth);
  const { refreshToken, isTokenExpired, isTokenExpiringSoon, isRefreshing } =
    useTokenRefresh();

  if (!isAuthenticated || !tokens?.token) {
    return null;
  }

  const handleRefresh = async () => {
    const success = await refreshToken();
    if (success) {
      console.log("Token refreshed successfully");
    }
  };

  const getTokenStatus = () => {
    if (isTokenExpired(tokens.token)) return "expired";
    if (isTokenExpiringSoon(tokens.token, 5)) return "expiring";
    return "valid";
  };

  const getButtonClass = () => {
    const base =
      "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors";

    switch (variant) {
      case "primary":
        return `${base} bg-[#4E8476] text-white hover:bg-[#4E8476] disabled:bg-gray-400`;
      case "secondary":
        return `${base} bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100`;
      case "minimal":
      default:
        return `${base} text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400`;
    }
  };

  const getStatusColor = () => {
    const status = getTokenStatus();
    switch (status) {
      case "expired":
        return "text-red-600";
      case "expiring":
        return "text-yellow-600";
      case "valid":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={getButtonClass()}
        title="Refresh authentication token"
      >
        {isRefreshing ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
        {isRefreshing ? "Refreshing..." : "Refresh Token"}
      </button>

      {showTokenInfo && (
        <div className="text-xs">
          <span className={`font-medium ${getStatusColor()}`}>
            Status: {getTokenStatus()}
          </span>
        </div>
      )}
    </div>
  );
}
