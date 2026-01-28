import { useEffect, type ReactNode } from "react";
import { useGetThemeSettingsQuery } from "../api/settings.api";
import { ThemeContext, type ThemeContextType } from "./themeContext";

// Default theme values
const DEFAULT_THEME = {
  color: "#1e3a5f",
  hoverColor: "#2c5282",
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

  // Apply theme colors to CSS variables
  useEffect(() => {
    if (!isLoading && theme.color) {
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

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
