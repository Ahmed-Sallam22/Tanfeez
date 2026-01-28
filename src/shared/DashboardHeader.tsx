// src/pages/DashboardHeader.tsx

import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import moment from "moment-hijri";
import { useState } from "react";
import { NotificationsModal } from "@/components/NotificationsModal";

export default function DashboardHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

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

  const today = new Date();
  const displayLocale = i18n.language === "ar" ? "ar-EG" : "en-GB";
  const formatted = today.toLocaleDateString(displayLocale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Hijri date
  moment.locale(i18n.language === "ar" ? "ar-sa" : "en");
  const hijriDate = moment();
  const formattedHijri = hijriDate.format(
    i18n.language === "ar" ? "iDD iMMMM iYYYY" : "iDD iMMMM iYYYY"
  );

  const hours = new Date().getHours();
  const isMorning = hours < 12;
  const greeting = isMorning ? t("greeting.morning") : t("greeting.evening");

  return (
    <header className={cn("flex items-start justify-between gap-4")}>
      {/* Left: greeting */}
      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            "text-xl sm:text-3xl font-semibold text-[var(--color-primary)]",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {greeting} , {userName}
        </h2>
        <div className="flex flex-col gap-0.5">
          <p
            className={cn(
              "text-[#757575] text-sm",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {formatted}
          </p>
          <p
            className={cn(
              "text-[#757575] text-xs",
              isRTL ? "text-right" : "text-left"
            )}
          >
            {formattedHijri} {isRTL ? "هـ" : "AH"}
          </p>
        </div>
      </div>

      {/* Right: navbar capsule */}
      <Navbar
        onSearchClick={() => console.log("search")}
        onBellClick={() => setNotificationsOpen(true)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </header>
  );
}
