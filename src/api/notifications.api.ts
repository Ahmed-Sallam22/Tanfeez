import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "./baseQuery";

export interface NotificationItem {
  id: number;
  message: string;
  eng_message?: string;
  ara_message?: string;
  is_read: boolean;
  created_at: string;
  is_shown: boolean;
  is_system_read: boolean;
  Transaction_id: number;
  type_of_Trasnction: "FAR" | "AFR" | "HFR" | "DFR";
  Type_of_action: "List" | "Approval";
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    // Get all notifications
    getAllNotifications: builder.query<NotificationsResponse, void>({
      query: () => ({
        url: "/auth/Notifications/",
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),

    // Mark one notification as read
    markNotificationAsRead: builder.mutation<void, number>({
      query: (notification_id: number) => ({
        url: `/auth/Notifications/read_one?notification_id=${notification_id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/Notifications/read_all",
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Delete a notification
    deleteNotification: builder.mutation<void, number>({
      query: (notification_id: number) => ({
        url: `/auth/Notifications/delete?notification_id=${notification_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetAllNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

/**
 * Get navigation path based on notification type and action
 */
export const getNotificationPath = (
  type: string,
  action: string,
  transactionId: number
): string => {
  const typeUpper = type.toUpperCase();
  const actionLower = action.toLowerCase();

  switch (typeUpper) {
    case "FAR":
      if (actionLower === "list") {
        return `/app/transfer/${transactionId}`;
      } else {
        return `/app/PendingTransfer/${transactionId}`;
      }

    case "HFR":
      if (actionLower === "list") {
        return `/app/reservations/${transactionId}`;
      } else {
        return `/app/pending-reservations/${transactionId}`;
      }

    case "AFR":
      if (actionLower === "list") {
        return `/app/FundRequests/${transactionId}`;
      } else {
        return `/app/PendingRequests/${transactionId}`;
      }

    case "DFR":
      if (actionLower === "list") {
        return `/app/FundAdjustments/${transactionId}`;
      } else {
        return `/app/PendingAdjustments/${transactionId}`;
      }

    default:
      return "/app";
  }
};
