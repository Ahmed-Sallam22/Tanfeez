import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { toast } from "react-hot-toast";
import i18n from "@/i18n";

export interface NotificationMessage {
  id: string;
  type: string;
  message: string;
  eng_message?: string;
  ara_message?: string;
  Transaction_id?: number;
  type_of_Trasnction?: "FAR" | "AFR" | "HFR" | "DFR";
  Type_of_action?: "List" | "Approval";
  data?: {
    transaction_id?: number;
    code?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  read: boolean;
}

type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface UseNotificationsSocketReturn {
  status: SocketStatus;
  notifications: NotificationMessage[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotificationsSocket(): UseNotificationsSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  // Get token from Redux
  const tokens = useSelector((state: RootState) => state.auth.tokens);
  const accessToken = tokens?.token;

  // Calculate WebSocket URL from API URL
  const getWsUrl = useCallback(() => {
    // Get API base URL and extract host
    const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
    const url = new URL(apiUrl);
    const host = url.host; // e.g., "127.0.0.1:8000" or "lightidea.org:8008"
    const protocol = url.protocol === "https:" ? "wss" : "ws";
    
    return `${protocol}://${host}/ws/notifications/?token=${encodeURIComponent(accessToken || "")}`;
  }, [accessToken]);

  const connect = useCallback(() => {
    if (!accessToken) {
      console.log("[WS] No access token, skipping connection");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected");
      return;
    }

    // Max 5 reconnection attempts
    if (reconnectAttemptsRef.current >= 5) {
      console.log("[WS] Max reconnection attempts reached");
      setStatus("error");
      return;
    }

    try {
      const wsUrl = getWsUrl();
      console.log("[WS] Connecting to:", wsUrl.replace(/token=.*/, "token=***"));
      
      setStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected successfully");
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = (event) => {
        console.log(`[WS] Disconnected (code: ${event.code})`);
        setStatus("disconnected");
        wsRef.current = null;

        // Reconnect if not a normal closure and token exists
        if (event.code !== 1000 && accessToken) {
          reconnectAttemptsRef.current++;
          console.log(`[WS] Reconnecting... attempt ${reconnectAttemptsRef.current}/5`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        console.log("[WS] Connection error");
        setStatus("error");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS] Message received:", data);

          // Handle different message types from backend
          switch (data.type) {
            case "connection_established":
              console.log("[WS] Connection established for user:", data.user_id);
              break;

            case "notification":
            case "oracle_upload_started":
            case "oracle_upload_progress":
            case "oracle_upload_completed":
            case "oracle_upload_failed": {
              const newNotification: NotificationMessage = {
                id: data.id?.toString() || data.data?.transaction_id?.toString() || `notif-${Date.now()}`,
                type: data.type,
                message: data.message || "New notification",
                eng_message: data.eng_message,
                ara_message: data.ara_message,
                Transaction_id: data.Transaction_id || data.data?.transaction_id,
                type_of_Trasnction: data.type_of_Trasnction,
                Type_of_action: data.Type_of_action,
                data: data.data,
                timestamp: data.timestamp || new Date().toISOString(),
                read: false,
              };

              // Add to notifications list
              setNotifications((prev) => [newNotification, ...prev]);

              // Show toast based on type
              // Check current language and display appropriate message
              const currentLang = i18n.language;
              const toastMessage = currentLang === "ar" 
                ? (data.ara_message || data.message || "إشعار جديد")
                : (data.eng_message || data.message || "New notification");
              
              if (data.type === "oracle_upload_failed") {
                toast.error(toastMessage, { duration: 5000 });
              } else if (data.type === "oracle_upload_completed") {
                toast.success(toastMessage, { duration: 5000 });
              } else {
                toast(toastMessage, { 
                  duration: 4000,
                  icon: "🔔",
                });
              }
              break;
            }

            default:
              console.log("[WS] Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("[WS] Error parsing message:", error);
        }
      };
    } catch (error) {
      console.error("[WS] Error creating WebSocket:", error);
      setStatus("error");
    }
  }, [accessToken, getWsUrl]);

  // Connect when token is available
  useEffect(() => {
    if (accessToken) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [accessToken, connect]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!accessToken && wsRef.current) {
      wsRef.current.close(1000, "User logged out");
      wsRef.current = null;
      setNotifications([]);
      reconnectAttemptsRef.current = 0;
    }
  }, [accessToken]);

  // Actions
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    status,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };
}
