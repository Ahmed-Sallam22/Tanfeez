import { useEffect, type ReactNode } from "react";
import { useGetThemeSettingsQuery } from "../api/settings.api";
import { ThemeContext, type ThemeContextType } from "./themeContext";

// Default theme values
const DEFAULT_THEME = {
  color: "#4E8476",
  hoverColor:"#365e53",
  mainLogo: "/src/assets/Tanfeezletter.png",
  mainCover: "/src/assets/bgDesigne.jpg",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: themeSettings, isLoading } = useGetThemeSettingsQuery();

  const theme: ThemeContextType = {
    color: themeSettings?.color || DEFAULT_THEME.color,
    hoverColor: themeSettings?.hover_color || DEFAULT_THEME.hoverColor,
    mainLogo: themeSettings?.main_logo || DEFAULT_THEME.mainLogo,
    mainCover: themeSettings?.main_cover || DEFAULT_THEME.mainCover,
    isLoading,
  };

  // Apply theme colors to CSS variables (always set them, even on error)
  useEffect(() => {
    // Set CSS variables as soon as we have values (from API or defaults)
    if (!isLoading) {
      document.documentElement.style.setProperty(
        "--color-primary",
        theme.color,
      );
      document.documentElement.style.setProperty(
        "--color-primary-hover",
        theme.hoverColor,
      );
    }
  }, [theme.color, theme.hoverColor, isLoading]);

  // Set default CSS variables immediately on mount and on error
  useEffect(() => {
    // Set defaults immediately
    document.documentElement.style.setProperty(
      "--color-primary",
      DEFAULT_THEME.color,
    );
    document.documentElement.style.setProperty(
      "--color-primary-hover",
      DEFAULT_THEME.hoverColor,
    );
  }, []);

  // Show loading page while fetching theme
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Theme...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
