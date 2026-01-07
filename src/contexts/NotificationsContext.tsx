import React, { createContext, useContext } from "react";
import {
  useNotificationsSocket,
  type NotificationMessage,
} from "@/hooks/useNotificationsSocket";

type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface NotificationsContextType {
  status: SocketStatus;
  notifications: NotificationMessage[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(
  null
);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  // Return default values if used outside provider (safe fallback)
  if (!context) {
    return {
      status: "disconnected" as SocketStatus,
      notifications: [],
      unreadCount: 0,
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotification: () => {},
      clearAll: () => {},
    };
  }

  return context;
};

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
}) => {
  const socket = useNotificationsSocket();

  return (
    <NotificationsContext.Provider value={socket}>
      {children}
    </NotificationsContext.Provider>
  );
};
