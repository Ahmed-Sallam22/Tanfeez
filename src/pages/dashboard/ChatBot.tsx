

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useSendMessageMutation,
  type ChatbotRequest,
  type ChatbotResponse,
} from "@/api/chatbot.api";

// If you have Vite alias '@' for assets, this import will work.
// Otherwise, pass iconUrl as a prop instead of importing.
import chatIcon from "@/assets/chatbot image.png";

const API_KEY_SERVICE_BASE_URL = "https://lightidea.org:8004";
const API_KEY_PREVIEW_ENDPOINT = `${API_KEY_SERVICE_BASE_URL}/api-key/preview`;
const API_KEY_UPDATE_ENDPOINT = `${API_KEY_SERVICE_BASE_URL}/api-key/update`;
const AVAILABLE_API_KEYS = [
  "AIzaSyDDqStmGRAuMDktCXGz7br-VLf0X_DCXcE",
  "AIzaSyC9nt1TDrXevbKCVNdHTIlUsoHdPpe5dY0",
  "AIzaSyB33PBwcjDf47uXtFwy2Szvz607TJSEkZY",
  "AIzaSyCOH5doSg_YSyAr8V5RSHAp0R5YbsNRP6g",
] as const;
const MAX_SEND_ATTEMPTS = AVAILABLE_API_KEYS.length + 1;
const SMART_CHATBOT_ENDPOINT =
  "https://lightidea.org:9001/api/transfers/budget-qa/";

type ParsedTable = {
  headers: string[];
  rows: string[][];
  caption?: string | null;
};

const compactText = (value: string | null | undefined) =>
  value ? value.replace(/\s+/g, " ").trim() : "";

const parseHtmlTable = (html: string): ParsedTable | null => {
  if (!html) return null;

  let table: HTMLTableElement | null = null;

  if (
    typeof window !== "undefined" &&
    typeof window.DOMParser !== "undefined"
  ) {
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      table = doc.querySelector("table");
    } catch (error) {
      console.error("Failed to parse HTML table via DOMParser:", error);
    }
  }

  if (!table && typeof document !== "undefined") {
    const template = document.createElement("template");
    template.innerHTML = html;
    table = template.content.querySelector("table");
  }

  if (!table) return null;

  const caption =
    compactText(table.querySelector("caption")?.textContent) || null;

  const meaningfulRows = Array.from(table.querySelectorAll("tr")).filter(
    (row) =>
      Array.from(row.children).some(
        (cell) => compactText(cell.textContent).length > 0
      )
  );

  if (!meaningfulRows.length) return null;

  let headerRow: Element | null = table.querySelector("thead tr") || null;

  if (!headerRow && meaningfulRows.length) {
    const firstRow = meaningfulRows[0];
    if (firstRow.querySelector("th")) {
      headerRow = firstRow;
    }
  }

  const headerCells = headerRow
    ? Array.from(headerRow.querySelectorAll("th, td"))
    : [];

  let headers = headerCells.map((cell) => compactText(cell.textContent));
  let dataRows = meaningfulRows.filter((row) => row !== headerRow);

  if (!headers.length && meaningfulRows.length) {
    const fallbackHeaderCells = Array.from(
      meaningfulRows[0].querySelectorAll("td, th")
    );
    headers = fallbackHeaderCells.map((cell) => compactText(cell.textContent));
    dataRows = meaningfulRows.slice(1);
  }

  const columnCount =
    headers.length ||
    dataRows.reduce(
      (max, row) => Math.max(max, row.querySelectorAll("td, th").length),
      0
    );

  if (!headers.length && columnCount > 0) {
    headers = Array.from(
      { length: columnCount },
      (_, idx) => `Column ${idx + 1}`
    );
  }

  const rows = dataRows
    .map((row) =>
      Array.from(row.querySelectorAll("td, th")).map((cell) =>
        compactText(cell.textContent)
      )
    )
    .filter((cells) => cells.length > 0);

  if (!rows.length) return null;

  return {
    headers,
    rows,
    caption,
  };
};

const isLikelyNumeric = (value: string) =>
  /^-?\d+(?:[.,]\d+)?(?:%|\s*(?:USD|SAR|AED|EGP|QAR|KWD|OMR))?$/.test(
    value.replace(/\s+/g, "")
  );

type AdvancedTableProps = {
  table: ParsedTable;
  isDarkMode: boolean;
  isArabic: boolean;
  onClick?: () => void;
  size?: "compact" | "dialog";
  t: (key: string) => string;
};

const AdvancedTable: React.FC<AdvancedTableProps> = ({
  table,
  isDarkMode,
  isArabic,
  onClick,
  size = "compact",
  t,
}) => {
  const maxColumns = Math.max(
    table.headers.length,
    ...table.rows.map((row) => row.length)
  );

  const headers = Array.from(
    { length: maxColumns || table.headers.length || 0 },
    (_, idx) => {
      const value = table.headers[idx] || "";
      if (value) return value;
      return `${t("chatbot.column")} ${idx + 1}`;
    }
  );

  const normalizedRows = table.rows.map((row) =>
    Array.from({ length: headers.length }, (_, idx) => row[idx] ?? "")
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const containerClasses = [
    "group relative rounded-2xl border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2",
    isDarkMode
      ? "border-slate-600 bg-slate-800/80 focus:ring-[#4E8476]/50 focus:ring-offset-slate-900"
      : "border-slate-200 bg-white focus:ring-[#4E8476]/40 focus:ring-offset-white",
    onClick ? "cursor-pointer hover:shadow-lg hover:border-[#4E8476]/50" : "",
  ].join(" ");

  const headerClasses = [
    "sticky top-0 z-[1]",
    isDarkMode
      ? "bg-slate-900/80 text-teal-200 border-b border-slate-700"
      : "bg-gradient-to-r from-[#4E8476] to-[#3d6b5f] text-white border-b border-[#3d6b5f]",
  ].join(" ");

  const scrollAreaClasses = size === "compact" ? "max-h-60" : "max-h-[65vh]";

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={
        onClick
          ? isArabic
            ? "عرض الجدول بالتفاصيل الكاملة"
            : "Open full table details"
          : undefined
      }
      dir={isArabic ? "rtl" : "ltr"}
    >
      {table.caption && (
        <div
          className={[
            "px-4 py-2 text-xs font-medium border-b",
            isDarkMode
              ? "border-slate-700 text-slate-200"
              : "border-slate-200 text-slate-600",
          ].join(" ")}
        >
          {table.caption}
        </div>
      )}
      <div
        className={["overflow-auto rounded-2xl", scrollAreaClasses].join(" ")}
      >
        <table className="min-w-full border-collapse text-[13px]">
          <thead className={headerClasses}>
            <tr>
              {headers.map((cell, idx) => (
                <th
                  key={`header-${idx}`}
                  className={[
                    "px-4 py-3 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap",
                    isArabic ? "text-right" : "text-left",
                    size === "dialog" ? "text-sm" : "",
                  ].join(" ")}
                >
                  {cell || `${t("chatbot.column")} ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedRows.map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                className={[
                  rowIndex % 2 === 0
                    ? isDarkMode
                      ? "bg-slate-800/60"
                      : "bg-white"
                    : isDarkMode
                    ? "bg-slate-800/30"
                    : "bg-slate-50/70",
                  "transition hover:bg-[#4E8476]/10",
                ].join(" ")}
              >
                {row.map((value, colIndex) => {
                  const numeric = isLikelyNumeric(value);
                  const alignClass = numeric
                    ? isArabic
                      ? "text-left"
                      : "text-right"
                    : isArabic
                    ? "text-right"
                    : "text-left";
                  return (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={[
                        "px-4 py-2 text-[12px] sm:text-sm whitespace-nowrap border-t",
                        isDarkMode
                          ? "border-slate-700 text-slate-100"
                          : "border-slate-200 text-slate-700",
                        alignClass,
                      ].join(" ")}
                    >
                      {value || "--"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onClick && (
        <div
          className={[
            "pointer-events-none absolute",
            isArabic ? "top-3 left-4" : "top-3 right-4",
            "text-[11px] font-medium uppercase tracking-wide opacity-70 transition",
            isDarkMode
              ? "text-teal-200/70 group-hover:text-teal-200"
              : "text-[#3d6b5f]/70 group-hover:text-[#3d6b5f]",
          ].join(" ")}
        >
          {t("chatbot.tapToExpand")}
        </div>
      )}
    </div>
  );
};

const matchesPreview = (key: string, preview?: string) => {
  if (!preview) return false;
  const normalized = preview.trim();
  const prefix = key.slice(0, Math.min(10, key.length));
  const suffix = key.slice(-4);
  return normalized.startsWith(prefix) && normalized.endsWith(suffix);
};

const extractAgentText = (agent: unknown): string | undefined => {
  if (typeof agent === "string") return agent;
  if (agent && typeof agent === "object") {
    const candidateKeys = ["response", "answer", "message", "question", "text"];
    for (const key of candidateKeys) {
      const value = (agent as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }
  return undefined;
};

const isMeaningfulText = (value: string | undefined) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() !== "success";
};

const extractStatusCode = (error: unknown): number | null => {
  if (error && typeof error === "object" && "status" in error) {
    const { status } = error as FetchBaseQueryError;
    return typeof status === "number" ? status : null;
  }

  return null;
};

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sqlData?: string; // HTML table or structured data snippet
  parsedTable?: ParsedTable; // Parsed representation for advanced rendering
  filePreview?: string; // base64 or URL for image preview
  fileName?: string; // original file name
  isError?: boolean; // if message failed to send
  isLoading?: boolean; // if message is being sent
};

type ChatBotProps = {
  isDarkMode?: boolean;
  isArabic?: boolean;
  showToggle?: boolean; // show floating button
  iconUrl?: string; // optional override for the icon
};

const ChatBot: React.FC<ChatBotProps> = ({
  isDarkMode = false,
  isArabic = false,
  showToggle = true,
  iconUrl,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lastRotatedIndexRef = useRef<number>(-1);
  const rotationPromiseRef = useRef<Promise<boolean> | null>(null);

  const rotateApiKey = useCallback(async () => {
    if (rotationPromiseRef.current) {
      return rotationPromiseRef.current;
    }

    const performRotation = async () => {
      try {
        let matchedIndex = -1;

        try {
          const previewResponse = await fetch(API_KEY_PREVIEW_ENDPOINT);
          if (previewResponse.ok) {
            const previewJson = (await previewResponse.json()) as {
              api_key_preview?: string;
            };
            const previewKey = previewJson?.api_key_preview;
            matchedIndex = AVAILABLE_API_KEYS.findIndex((key) =>
              matchesPreview(key, previewKey)
            );
          }
        } catch (previewError) {
          console.error("API key preview failed:", previewError);
        }

        const nextIndex =
          matchedIndex >= 0
            ? (matchedIndex + 1) % AVAILABLE_API_KEYS.length
            : (lastRotatedIndexRef.current + 1 + AVAILABLE_API_KEYS.length) %
              AVAILABLE_API_KEYS.length;

        const nextKey = AVAILABLE_API_KEYS[nextIndex];

        const updateResponse = await fetch(API_KEY_UPDATE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ api_key: nextKey }),
        });

        if (!updateResponse.ok) {
          console.error(
            "API key update failed with status",
            updateResponse.status
          );
          return false;
        }

        lastRotatedIndexRef.current = nextIndex;
        return true;
      } catch (error) {
        console.error("API key rotation failed:", error);
        return false;
      }
    };

    const rotationPromise = performRotation().finally(() => {
      rotationPromiseRef.current = null;
    });

    rotationPromiseRef.current = rotationPromise;
    return rotationPromise;
  }, []);

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isSmartMode, setIsSmartMode] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>(() =>
    isArabic ? { x: 40, y: 25 } : { x: 10, y: 10 }
  );
  const [bounds, setBounds] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Messages
  const initialBotMessage = useMemo(() => t("chatbot.howCanIHelp"), [t]);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: initialBotMessage, isUser: false, timestamp: new Date() },
  ]);

  // SQL modal
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [currentSqlData, setCurrentSqlData] = useState<string>("");
  const [currentParsedTable, setCurrentParsedTable] =
    useState<ParsedTable | null>(null);

  // Input
  const [newMessage, setNewMessage] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RTK Query
  const [sendMessageMutation] = useSendMessageMutation();

  // Re-apply initial message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].id !== 1) return prev;
      const next = [...prev];
      next[0] = { ...next[0], text: initialBotMessage };
      return next;
    });
  }, [initialBotMessage]);

  // Update container bounds on resize
  useEffect(() => {
    const onResize = () =>
      setBounds({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Simulate a "new message" badge, like your demo
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isOpen) setHasNewMessage(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [isOpen]);

  const toggleChat = useCallback(() => {
    setIsOpen((o) => {
      const nowOpen = !o;
      if (nowOpen) setHasNewMessage(false);
      return nowOpen;
    });
  }, []);

  const toggleSmartMode = useCallback(() => {
    setIsSmartMode((prev) => !prev);
  }, []);

  const smartModeButtonLabel = isSmartMode
    ? t("chatbot.smartMode")
    : t("chatbot.agentMode");

  const smartModeButtonHint = isSmartMode
    ? t("chatbot.switchToStandard")
    : t("chatbot.switchToSmart");

  // Drag handlers
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isOpen) return; // don't drag while open

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    // Convert stored position (RTL uses left; LTR uses right) to screen coords
    const currentScreenX = isArabic
      ? position.x
      : bounds.width - position.x - 80;
    const currentScreenY = bounds.height - position.y - 80;

    dragStart.current = {
      x: clientX - currentScreenX,
      y: clientY - currentScreenY,
    };

    const move = (ev: MouseEvent | TouchEvent) => {
      const x =
        "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const y =
        "touches" in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;

      const moved =
        Math.abs(x - (dragStart.current.x + currentScreenX)) > 5 ||
        Math.abs(y - (dragStart.current.y + currentScreenY)) > 5;

      if (moved) setIsDragging(true);
      if (!isDragging && !moved) return;

      let newScreenX = x - dragStart.current.x;
      let newScreenY = y - dragStart.current.y;

      const maxX = bounds.width - 80;
      const maxY = bounds.height - 80;

      newScreenX = Math.max(0, Math.min(newScreenX, maxX));
      newScreenY = Math.max(0, Math.min(newScreenY, maxY));

      if (isArabic) {
        // RTL store as left/bottom
        const newX = newScreenX;
        const newY = bounds.height - newScreenY - 80;
        setPosition({ x: newX, y: newY });
      } else {
        // LTR store as right/bottom
        const newX = bounds.width - newScreenX - 80;
        const newY = bounds.height - newScreenY - 80;
        setPosition({ x: newX, y: newY });
      }

      ev.preventDefault();
    };

    const end = () => {
      const threshold = 50;
      const { x, y } = position;
      const { width, height } = bounds;

      // Snap logic similar to your Vue version
      if (isArabic) {
        const screenX = x;
        const screenY = height - y - 60;
        let newX = x;
        let newY = y;

        if (screenX < threshold) newX = 21;
        else if (screenX > width - 80 - threshold) newX = width - 80 - 24;

        if (screenY < threshold) newY = height - 24 - 80;
        else if (screenY > height - 80 - threshold) newY = 24;

        setPosition({ x: newX, y: newY });
      } else {
        const screenX = width - x - 60;
        const screenY = height - y - 60;
        let newX = x;
        let newY = y;

        if (screenX < threshold) newX = width - 24 - 80;
        else if (screenX > width - 80 - threshold) newX = 24;

        if (screenY < threshold) newY = height - 24 - 80;
        else if (screenY > height - 80 - threshold) newY = 24;

        setPosition({ x: newX, y: newY });
      }

      setTimeout(() => setIsDragging(false), 10);

      document.removeEventListener("mousemove", move as any);
      document.removeEventListener("mouseup", end);
      document.removeEventListener("touchmove", move as any);
      document.removeEventListener("touchend", end);
    };

    document.addEventListener("mousemove", move as any);
    document.addEventListener("mouseup", end);
    document.addEventListener("touchmove", move as any, { passive: false });
    document.addEventListener("touchend", end);

    e.preventDefault();
  };

  const handleToggleClick = () => {
    if (!isDragging) toggleChat();
  };

  const stylePos = useMemo<React.CSSProperties>(() => {
    const side = isArabic
      ? { left: `${position.x}px` }
      : { right: `${position.x}px` };
    return {
      ...side,
      bottom: `${position.y}px`,
      transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "fixed",
      zIndex: 1000,
    };
  }, [isArabic, isDragging, position.x, position.y]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, messages.length]);

  // Format time
  const timeOf = (d: Date) =>
    d.toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // SQL modal helpers
  const openSqlModal = (html: string) => {
    setCurrentSqlData(html);
    setCurrentParsedTable(parseHtmlTable(html));
    setShowSqlModal(true);
  };
  const closeSqlModal = () => {
    setShowSqlModal(false);
    setCurrentSqlData("");
    setCurrentParsedTable(null);
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type (PDF or images)
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      alert(
        isArabic
          ? "يرجى اختيار ملف PDF أو صورة (JPG, PNG, GIF, WebP)"
          : "Please select a PDF or image file (JPG, PNG, GIF, WebP)"
      );
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(
        isArabic
          ? "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت"
          : "File size too large. Maximum 10MB"
      );
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const sendMessage = async (retryMessageId?: number) => {
    // Get the message to send (either new or retry)
    let messageToSend: Message | undefined;
    let inputText = newMessage.trim();
    const fileToSend = selectedFile;
    const previewToSend = filePreview;

    if (retryMessageId) {
      // Find the message to retry
      messageToSend = messages.find((m) => m.id === retryMessageId);
      if (!messageToSend) return;

      inputText = messageToSend.text;
      // Note: We can't re-upload the file on retry since we don't store the File object
      // The user will need to select the file again if retry is needed
    }

    if ((!inputText && !fileToSend) || isTyping) return;

    const messageId = retryMessageId || Date.now();

    // If retrying, update the message to loading state
    if (retryMessageId) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === retryMessageId
            ? { ...msg, isError: false, isLoading: true }
            : msg
        )
      );
    } else {
      // Create new user message
      const userMsg: Message = {
        id: messageId,
        text: inputText || (isArabic ? "تم إرفاق ملف" : ""),
        isUser: true,
        timestamp: new Date(),
        filePreview: fileToSend && previewToSend ? previewToSend : undefined,
        fileName: fileToSend?.name,
        isLoading: true,
      };

      setMessages((m) => [...m, userMsg]);
      setNewMessage("");
      // Clear file immediately when adding to chat
      if (fileToSend) {
        removeFile();
      }
    }

    setIsTyping(true);

    const payload: ChatbotRequest = {
      user_input: inputText || t("chatbot.analyzeFile"),
    };

    if (fileToSend && !retryMessageId) {
      const base64 = await convertFileToBase64(fileToSend);
      payload.file_base64 = base64;
      payload.file_name = fileToSend.name;
    }

    const attemptSend = async (): Promise<ChatbotResponse> => {
      if (isSmartMode) {
        const smartRequestBody = {
          question: payload.user_input,
        };

        const response = await fetch(SMART_CHATBOT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(smartRequestBody),
        });

        const rawBody = await response.text();

        if (!response.ok) {
          let parsedError: unknown = rawBody;
          if (rawBody) {
            try {
              parsedError = JSON.parse(rawBody);
            } catch {
              parsedError = { message: rawBody };
            }
          }

          const error = new Error(
            `Smart chatbot request failed with status ${response.status}`
          ) as Error & { status?: number; data?: unknown };
          error.status = response.status;
          error.data = parsedError;
          throw error;
        }

        if (!rawBody) {
          return { status: "success" };
        }

        try {
          const parsed = JSON.parse(rawBody);
          if (parsed && typeof parsed === "object" && "status" in parsed) {
            return parsed as ChatbotResponse;
          }

          return {
            status: "success",
            response: parsed as ChatbotResponse["response"],
          };
        } catch {
          return {
            status: "success",
            response: rawBody,
          };
        }
      }

      let lastError: unknown = null;

      for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt += 1) {
        try {
          return await sendMessageMutation(payload).unwrap();
        } catch (error) {
          lastError = error;
          const status = extractStatusCode(error);

          if (status === 500 && attempt < MAX_SEND_ATTEMPTS - 1) {
            const rotated = await rotateApiKey();
            if (rotated) {
              continue;
            }
          }

          throw error;
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error("Failed to send message");
    };

    try {
      const data = await attemptSend();

      // Mark message as successfully sent
      setMessages((m) =>
        m.map((msg) =>
          msg.id === messageId
            ? { ...msg, isLoading: false, isError: false }
            : msg
        )
      );

      let botText = "";
      let pageToNavigate: string | null = null;
      let tableHtml: string | undefined;

      const trySetBotText = (value: unknown) => {
        if (!botText && typeof value === "string" && isMeaningfulText(value)) {
          botText = value;
        }
      };

      const parseResponseObject = (resp: Record<string, unknown>) => {
        if ("GeneralQAAgent" in resp) {
          trySetBotText(extractAgentText(resp["GeneralQAAgent"]));
        }
        if (!botText && "ExpenseCreatorAgent" in resp) {
          trySetBotText(extractAgentText(resp["ExpenseCreatorAgent"]));
        }
        const navigatorValue = resp["PageNavigatorAgent"];
        if (
          !pageToNavigate &&
          typeof navigatorValue === "string" &&
          navigatorValue.trim()
        ) {
          pageToNavigate = navigatorValue;
        }
        const sqlBuilderValue = resp["SQLBuilderAgent"];
        if (
          !tableHtml &&
          typeof sqlBuilderValue === "string" &&
          sqlBuilderValue.trim()
        ) {
          tableHtml = sqlBuilderValue;
        }
        const htmlTableValue = resp["HTML_TABLE_DATA"];
        if (
          !tableHtml &&
          typeof htmlTableValue === "string" &&
          htmlTableValue.trim()
        ) {
          tableHtml = htmlTableValue;
        }
        if (!botText) {
          trySetBotText(extractAgentText(resp));
        }
        if (!botText && "response" in resp) {
          trySetBotText(resp["response"]);
          if (
            !botText &&
            resp["response"] &&
            typeof resp["response"] === "object"
          ) {
            trySetBotText(extractAgentText(resp["response"]));
          }
        }
        if (!botText && "message" in resp) {
          trySetBotText(resp["message"]);
        }
        if (!botText) {
          for (const value of Object.values(resp)) {
            if (typeof value === "string") {
              trySetBotText(value);
            } else if (
              value &&
              typeof value === "object" &&
              !Array.isArray(value)
            ) {
              trySetBotText(extractAgentText(value));
            }
            if (botText && tableHtml) break;
          }
        }
      };

      const normalizeResponse = (resp: unknown) => {
        if (!resp) return;
        if (typeof resp === "string") {
          trySetBotText(resp);
          return;
        }
        if (Array.isArray(resp)) {
          resp.forEach((entry) => normalizeResponse(entry));
          return;
        }
        if (typeof resp === "object") {
          parseResponseObject(resp as Record<string, unknown>);
        }
      };

      if (data && "response" in data) {
        normalizeResponse(data.response);
      }

      if (!botText && data?.status === "error") {
        trySetBotText(
          isArabic
            ? "حدث خطأ أثناء معالجة الطلب."
            : "An error occurred while processing your request."
        );
      }

      if (!tableHtml) {
        const maybeTopLevelHtml = (
          data as unknown as { HTML_TABLE_DATA?: string }
        )?.HTML_TABLE_DATA;
        if (typeof maybeTopLevelHtml === "string" && maybeTopLevelHtml.trim()) {
          tableHtml = maybeTopLevelHtml;
        }
      }

      if (!botText && typeof data?.message === "string") {
        trySetBotText(data.message);
      }

      if (!botText && tableHtml) {
        botText = isArabic
          ? "تم جلب البيانات. اضغط لعرض التفاصيل."
          : "Data is ready. Tap to view details.";
      }

      const parsedTable = tableHtml ? parseHtmlTable(tableHtml) : null;

      if (botText || tableHtml) {
        setMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            text: botText || "",
            isUser: false,
            timestamp: new Date(),
            sqlData: tableHtml,
            parsedTable: parsedTable ?? undefined,
          },
        ]);
      }

      if (pageToNavigate) {
        navigate(pageToNavigate);
      }
    } catch (err) {
      console.error("Chat error:", err);

      // Mark message as error
      setMessages((m) =>
        m.map((msg) =>
          msg.id === messageId
            ? { ...msg, isLoading: false, isError: true }
            : msg
        )
      );

      const status = extractStatusCode(err);
      const fallbackText =
        status === 500
          ? isArabic
            ? "الخدمة غير متاحة حالياً. حاول مرة أخرى لاحقاً."
            : "Service is temporarily unavailable. Please try again later."
          : isArabic
          ? "تعذر الاتصال بالخادم."
          : "Failed to connect to the server.";

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          text: fallbackText,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating container */}
      <div
        className={[
          "select-none",
          "transition-all",
          isDragging ? "transition-none z-[1001]" : "z-[1000]",
        ].join(" ")}
        style={stylePos}
      >
        {/* Toggle Button */}
        {!isOpen && showToggle && (
          <button
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            onClick={handleToggleClick}
            aria-label={t("chatbot.title")}
            className={[
              "relative w-20 h-20 rounded-full",
              "flex items-center justify-center",
              "shadow-xl overflow-hidden touch-none",
              "transition-all",
              isDragging ? "cursor-grabbing scale-110" : "hover:scale-105",
              // Blue/white theme
              "bg-gradient-to-br from-[#4E8476] to-[#1e3933]",
            ].join(" ")}
          >
            <img
              src={iconUrl || chatIcon}
              alt="Chat Icon"
              className="w-[72px] h-[60px] object-cover rounded-sm relative z-[2] transition-transform"
            />
            {/* pulse ring */}
            {!isDragging && (
              <span className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-60" />
            )}
            {/* notification badge */}
            {hasNewMessage && (
              <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>
        )}

        {/* Chat Panel */}
        {isOpen && (
          <div
            className={[
              "absolute bottom-20",
              isArabic ? "left-0" : "right-0",
              "w-[680px] h-[550px]",
              "rounded-2xl overflow-hidden",
              "shadow-2xl border",
              // Glassy + blue/white theme
              isDarkMode
                ? "bg-slate-900/90 border-slate-700 backdrop-blur-xl"
                : "bg-white/95 border-white/60 backdrop-blur-xl",
              "flex flex-col",
              "animate-[fadeIn_0.25s_ease]",
            ].join(" ")}
          >
            {/* Header */}
            <div
              className={[
                "px-5 py-4 flex items-center justify-between",
                "text-white",
                "bg-gradient-to-r from-[#4E8476] to-[#3d6b5f]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Zm9 7V7l-6-6H9v2H7a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v10h2V11h2v10h2V11h2a2 2 0 0 0 2-2V7h2v2Z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold">
                    {t("chatbot.tanfeezAssistant")}
                  </h3>
                  <span className="text-xs opacity-80">
                    {t("chatbot.online")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSmartMode}
                  aria-label={smartModeButtonHint}
                  aria-pressed={isSmartMode}
                  className={[
                    "px-3 h-8 rounded-full border text-xs font-semibold transition flex items-center gap-2 bg-white/20 text-white border-white/30 hover:bg-white/30",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block w-2 h-2 rounded-full",
                      isSmartMode ? "bg-white/80" : "bg-white/80",
                    ].join(" ")}
                  />
                  <span>{smartModeButtonLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleChat}
                  aria-label={t("chatbot.closeChat")}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className={[
                "flex-1 p-5 overflow-y-auto flex flex-col gap-3",
                isDarkMode ? "bg-slate-900/40" : "bg-slate-50/50",
              ].join(" ")}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={[
                    "flex items-end gap-2",
                    m.isUser ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  <div className="max-w-[100%] flex flex-col">
                    {!m.isUser && m.sqlData && (
                      <div className="mb-2">
                        {m.parsedTable ? (
                          <AdvancedTable
                            table={m.parsedTable}
                            isDarkMode={isDarkMode}
                            isArabic={isArabic}
                            onClick={() => openSqlModal(m.sqlData!)}
                            size="compact"
                            t={t}
                          />
                        ) : (
                          <div
                            className={[
                              "text-xs rounded-xl overflow-x-auto shadow border cursor-pointer",
                              isDarkMode
                                ? "bg-slate-700/80 border-slate-600"
                                : "bg-white border-black/10",
                            ].join(" ")}
                            onClick={() => openSqlModal(m.sqlData!)}
                            dangerouslySetInnerHTML={{ __html: m.sqlData }}
                          />
                        )}
                      </div>
                    )}

                    <div
                      className={[
                        "rounded-2xl text-sm leading-snug break-words overflow-hidden",
                        m.isUser
                          ? "bg-gradient-to-r from-[#4E8476] to-[#3d6b5f] text-white rounded-br-md"
                          : isDarkMode
                          ? "bg-slate-700/80 text-slate-100 rounded-bl-md"
                          : "bg-white/90 text-slate-700 rounded-bl-md",
                      ].join(" ")}
                    >
                      {/* Image preview for user messages with files */}
                      {m.isUser && m.filePreview && (
                        <div className="relative">
                          <img
                            src={m.filePreview}
                            alt={m.fileName || "attachment"}
                            className="w-full max-w-xs rounded-t-2xl"
                          />
                          {m.isLoading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* PDF indicator for user messages */}
                      {m.isUser && m.fileName && !m.filePreview && (
                        <div className="flex items-center gap-2 p-3 bg-black/10">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-white"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM6 20V4h7v5h5v11H6Z" />
                          </svg>
                          <span className="text-xs font-medium truncate">
                            {m.fileName}
                          </span>
                        </div>
                      )}

                      {/* Message text */}
                      {m.text && <div className="px-4 py-3">{m.text}</div>}

                      {/* Error indicator with retry button */}
                      {m.isError && (
                        <div className="px-4 pb-3 flex items-center gap-2">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-red-300"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
                          </svg>
                          <span className="text-xs text-red-300">
                            {t("chatbot.failedToSend")}
                          </span>
                          <button
                            onClick={() => sendMessage(m.id)}
                            className="text-xs underline hover:no-underline text-white/90"
                          >
                            {t("chatbot.retry")}
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      className={[
                        "mt-1 text-[10px] opacity-60 flex items-center gap-1",
                        m.isUser ? "text-right justify-end" : "",
                      ].join(" ")}
                    >
                      <span>{timeOf(m.timestamp)}</span>
                      {m.isUser && m.isLoading && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="animate-spin"
                        >
                          <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Z" />
                        </svg>
                      )}
                      {m.isUser && !m.isLoading && !m.isError && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-blue-400"
                        >
                          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div
                    className={[
                      "px-4 py-3 rounded-2xl rounded-bl-md",
                      isDarkMode ? "bg-slate-700/80" : "bg-white/90",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div
              className={[
                "px-5 py-4 border-t",
                isDarkMode
                  ? "bg-slate-900/80 border-slate-700"
                  : "bg-white/80 border-black/10",
              ].join(" ")}
            >
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-red-600"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM6 20V4h7v5h5v11H6Z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 flex items-center justify-center transition"
                    aria-label={t("chatbot.removeFile")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-red-600"
                    >
                      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center transition",
                    isDarkMode
                      ? "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  ].join(" ")}
                  title={t("chatbot.attachFile")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5Z" />
                  </svg>
                </button>

                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder={t("chatbot.typeYourMessage")}
                  disabled={isTyping}
                  className={[
                    "flex-1 px-4 py-2.5 rounded-full text-sm outline-none transition",
                    "border",
                    isDarkMode
                      ? "bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
                      : "bg-white/80 border-black/10 text-slate-700 placeholder:text-slate-400",
                    "focus:ring-2 focus:ring-[#4E8476]/30 focus:border-[#4E8476]/60",
                  ].join(" ")}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={(!newMessage.trim() && !selectedFile) || isTyping}
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center text-white",
                    "bg-gradient-to-br from-[#4E8476] to-[#3d6b5f]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition hover:scale-110 shadow",
                  ].join(" ")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SQL Modal */}
      {showSqlModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 animate-[fadeIn_0.2s_ease]"
          onClick={closeSqlModal}
        >
          <div
            className={[
              "w-[90%] max-w-[900px] max-h-[80vh] rounded-xl overflow-hidden border shadow-2xl",
              isDarkMode
                ? "bg-slate-900/95 border-slate-700"
                : "bg-white/98 border-white/60",
              "flex flex-col",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="px-6 py-4 text-white bg-gradient-to-r from-[#4E8476] to-[#3d6b5f] flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {t("chatbot.dataDetails")}
              </h2>
              <button
                onClick={closeSqlModal}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                aria-label={t("chatbot.closeModal")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
                </svg>
              </button>
            </div>
            <div
              className={[
                "flex-1 overflow-auto p-6",
                isDarkMode ? "bg-slate-900/70" : "bg-slate-50/80",
              ].join(" ")}
            >
              {currentParsedTable ? (
                <AdvancedTable
                  table={currentParsedTable}
                  isDarkMode={isDarkMode}
                  isArabic={isArabic}
                  size="dialog"
                  t={t}
                />
              ) : (
                <div
                  className={[
                    "rounded-lg overflow-x-auto shadow",
                    isDarkMode ? "bg-slate-700/80" : "bg-white",
                  ].join(" ")}
                  dangerouslySetInnerHTML={{ __html: currentSqlData }}
                />
              )}
            </div>
            <div
              className={[
                "px-6 py-4 border-t flex justify-end",
                isDarkMode
                  ? "bg-slate-900/80 border-slate-700"
                  : "bg-white/80 border-black/10",
              ].join(" ")}
            >
              <button
                onClick={closeSqlModal}
                className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-slate-500 to-slate-600 hover:shadow transition text-sm"
              >
                {t("chatbot.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
