import React from "react";
import { X, Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  useGetAllNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  getNotificationPath,
  type NotificationItem,
} from "@/api/notifications.api";
import toast from "react-hot-toast";

// Union type for notifications from both sources
type UnifiedNotification =
  | NotificationItem
  | {
      id: string;
      message: string;
      eng_message?: string;
      ara_message?: string;
      Transaction_id?: number;
      type_of_Trasnction?: "FAR" | "AFR" | "HFR" | "DFR";
      Type_of_action?: "List" | "Approval";
      type: string;
      timestamp: string;
      read: boolean;
      data?: {
        code?: string;
      };
    };

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  // WebSocket notifications (real-time)
  const {
    notifications: wsNotifications,
    status,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead,
    clearNotification: wsClearNotification,
    clearAll: wsClearAll,
  } = useNotifications();

  // REST API hooks
  const { data: apiData } = useGetAllNotificationsQuery();
  const [markAsReadMutation] = useMarkNotificationAsReadMutation();
  const [markAllAsReadMutation] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();

  // Merge API and WebSocket notifications
  const apiNotifications = apiData?.notifications || [];

  // Create a map of API notifications by message to avoid duplicates
  const apiNotifMap = new Map(apiNotifications.map((n) => [n.message, n]));

  // Add WebSocket notifications that aren't already in API data
  const mergedNotifications = [
    ...apiNotifications,
    ...wsNotifications.filter((wsN) => !apiNotifMap.has(wsN.message)),
  ].sort((a, b) => {
    const dateA = new Date(
      ("created_at" in a ? a.created_at : a.timestamp) || new Date()
    ).getTime();
    const dateB = new Date(
      ("created_at" in b ? b.created_at : b.timestamp) || new Date()
    ).getTime();
    return dateB - dateA;
  });

  const notifications = mergedNotifications;

  // Calculate unread count from merged notifications
  const unreadCount = notifications.filter((n) => {
    if ("is_read" in n) return !n.is_read;
    if ("read" in n) return !n.read;
    return false;
  }).length;

  const handleNotificationClick = async (notification: UnifiedNotification) => {
    try {
      // Mark as read in both systems
      if ("id" in notification && typeof notification.id === "number") {
        await markAsReadMutation(notification.id).unwrap();
      }
      wsMarkAsRead(String(notification.id));

      // Navigate only if we have the required data and valid values
      if (
        "Transaction_id" in notification &&
        "type_of_Trasnction" in notification &&
        "Type_of_action" in notification &&
        notification.Transaction_id &&
        notification.Transaction_id > 0 && // Ensure valid ID
        notification.type_of_Trasnction &&
        notification.Type_of_action
      ) {
        const path = getNotificationPath(
          notification.type_of_Trasnction,
          notification.Type_of_action,
          notification.Transaction_id
        );

        // Only navigate if path is valid
        if (path) {
          navigate(path);
          onClose();
        }
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
      toast.error(t("notifications.error") || "Failed to mark as read");
    }
  };

  const handleMarkAsRead = async (
    e: React.MouseEvent,
    notification: UnifiedNotification
  ) => {
    e.stopPropagation();
    try {
      if ("id" in notification && typeof notification.id === "number") {
        await markAsReadMutation(notification.id).unwrap();
      }
      wsMarkAsRead(String(notification.id));
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error(t("notifications.error") || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation().unwrap();
      wsMarkAllAsRead();
      toast.success(t("notifications.allMarkedRead") || "All marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error(t("notifications.error") || "Failed to mark all as read");
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    notification: UnifiedNotification
  ) => {
    e.stopPropagation();
    try {
      if ("id" in notification && typeof notification.id === "number") {
        await deleteNotificationMutation(notification.id).unwrap();
      }
      wsClearNotification(String(notification.id));
      toast.success(t("notifications.deleted") || "Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(t("notifications.error") || "Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    try {
      // Delete all notifications via API
      await Promise.all(
        apiNotifications.map((n) => deleteNotificationMutation(n.id).unwrap())
      );
      wsClearAll();
      toast.success(
        t("notifications.allCleared") || "All notifications cleared"
      );
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast.error(
        t("notifications.error") || "Failed to clear all notifications"
      );
    }
  };

  if (!isOpen) return null;

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("notifications.justNow");
    if (diffMins < 60) return `${diffMins} ${t("notifications.minutesAgo")}`;
    if (diffHours < 24) return `${diffHours} ${t("notifications.hoursAgo")}`;
    return `${diffDays} ${t("notifications.daysAgo")}`;
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "oracle_upload_completed":
        return {
          bg: "bg-green-50",
          border: "border-green-300",
          icon: "✅",
          dotColor: "bg-green-500",
        };
      case "oracle_upload_failed":
        return {
          bg: "bg-red-50",
          border: "border-red-300",
          icon: "❌",
          dotColor: "bg-red-500",
        };
      case "oracle_upload_started":
      case "oracle_upload_progress":
        return {
          bg: "bg-blue-50",
          border: "border-blue-300",
          icon: "⏳",
          dotColor: "bg-blue-500",
        };
      default:
        return {
          bg: "bg-purple-50",
          border: "border-purple-300",
          icon: "🔔",
          dotColor: "bg-purple-500",
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-[9998]" onClick={onClose} />

      {/* Modal */}
      <div
        className={`fixed top-20 ${
          isRTL ? "left-4 sm:left-8" : "right-4 sm:right-8"
        } w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] bg-white rounded-2xl shadow-2xl z-[9999] max-h-[calc(100vh-10rem)] flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("navbar.notifications")}
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                ({notifications.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === "connected"
                  ? "bg-green-500"
                  : status === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
              title={status}
            />

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("notifications.clearAll")}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto overscroll-contain notifications-scroll"
             style={{
               scrollbarWidth: 'thin',
               scrollbarColor: '#CBD5E0 #F7FAFC'
             }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm text-center font-medium">
                {t("notifications.noNotifications")}
              </p>
              <p className="text-gray-400 text-xs text-center mt-1">
                {isRTL ? "سيظهر هنا جميع الإشعارات الجديدة" : "All new notifications will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">{notifications.map((notification) => {
                const notifType =
                  "type" in notification ? notification.type : "general";
                const notifId = notification.id;
                const notifTimestamp =
                  "timestamp" in notification
                    ? notification.timestamp
                    : notification.created_at;
                const isRead =
                  "is_read" in notification
                    ? notification.is_read
                    : "read" in notification
                    ? notification.read
                    : false;
                const notifData =
                  "data" in notification ? notification.data : undefined;

                const style = getNotificationStyle(notifType);
                return (
                  <div
                    key={notifId}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-5 py-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                      !isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base ${style.bg} border-2 ${style.border} shadow-sm`}
                      >
                        {style.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-relaxed ${
                            !isRead
                              ? "font-semibold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {/* Display message based on language */}
                          {isRTL
                            ? "ara_message" in notification
                              ? notification.ara_message
                              : notification.message
                            : "eng_message" in notification
                            ? notification.eng_message
                            : notification.message}
                        </p>

                        {notifData?.code && (
                          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md">
                            <span className="text-xs font-mono font-medium text-blue-700">
                              {notifData.code}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                          {getTimeAgo(notifTimestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {!isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification)}
                            className="p-1.5 hover:bg-green-50 rounded-lg transition-colors group"
                            title={t("notifications.markRead")}
                          >
                            <Check className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                          title={t("notifications.delete")}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
