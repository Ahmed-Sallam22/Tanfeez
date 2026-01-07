// src/components/layout/ProfileDropdown.tsx
import { useState, useRef, useEffect } from "react";
import {
  User,
  //  FileText,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

type Props = {
  userName: string;
  userRole?: string;
  avatarUrl?: string;
  user_level?: string;
  onLogout?: () => void;
};

export default function ProfileDropdown({
  user_level,
  userName,
  avatarUrl = "https://i.pravatar.cc/100?img=12",
  onLogout,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق عند الضغط بره
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        className={cn(
          "flex items-center gap-1 sm:gap-2 focus:outline-none min-w-0"
        )}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`User menu for ${userName}`}
      >
        <img
          src={avatarUrl}
          alt={`${userName}'s profile`}
          className="h-5 w-5 sm:h-8 sm:w-8 rounded-full object-cover flex-shrink-0"
          width={32}
          height={32}
        />
        <div
          className={cn(
            "hidden md:block min-w-0",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {userName}
          </div>
          <div className="text-xs text-gray-500 truncate">{user_level}</div>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute mt-2 w-48 sm:w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50",
            isRTL ? "left-0" : "right-0"
          )}
        >
          {/* User info - Show on mobile when dropdown is open */}
          <div
            className={cn(
              "md:hidden p-3 border-b border-gray-100",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-xs text-gray-500 capitalize">{user_level}</div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <button
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 sm:py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              )}
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
              <span className="truncate">{t("users.title")}</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={onLogout}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 sm:py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              )}
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
              <span className="truncate">{t("logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
