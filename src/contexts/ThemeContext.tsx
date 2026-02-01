import { useEffect, type ReactNode } from "react";
import { useGetThemeSettingsQuery } from "../api/settings.api";
import { ThemeContext, type ThemeContextType } from "./themeContext";

// Default theme values
const DEFAULT_THEME = {
  color: "#4E8476",
  hoverColor: "#365e53",
  mainLogo: "/src/assets/Tanfeezletter.png",
  mainCover: "/src/assets/bgDesigne.jpg",
};

// LocalStorage key for caching theme
const THEME_CACHE_KEY = "tanfeez_theme_cache";

// Get cached theme from localStorage
const getCachedTheme = () => {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error("Failed to load cached theme:", error);
  }
  return null;
};

// Save theme to localStorage
const setCachedTheme = (theme: Partial<ThemeContextType>) => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme));
  } catch (error) {
    console.error("Failed to cache theme:", error);
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get cached theme
  const cachedTheme = getCachedTheme();

  // Only fetch if we don't have cached data
  const { data: themeSettings, isLoading } = useGetThemeSettingsQuery(
    undefined,
    {
      // Use cached data if available
      skip: false,
    },
  );

  const theme: ThemeContextType = {
    color: themeSettings?.color || cachedTheme?.color || DEFAULT_THEME.color,
    hoverColor:
      themeSettings?.hover_color ||
      cachedTheme?.hoverColor ||
      DEFAULT_THEME.hoverColor,
    mainLogo:
      themeSettings?.main_logo ||
      cachedTheme?.mainLogo ||
      DEFAULT_THEME.mainLogo,
    mainCover:
      themeSettings?.main_cover ||
      cachedTheme?.mainCover ||
      DEFAULT_THEME.mainCover,
    isLoading,
  };

  // Cache theme data when received from API
  useEffect(() => {
    if (themeSettings) {
      setCachedTheme({
        color: themeSettings.color,
        hoverColor: themeSettings.hover_color,
        mainLogo: themeSettings.main_logo,
        mainCover: themeSettings.main_cover,
      });
    }
  }, [themeSettings]);

  // Apply theme colors to CSS variables
  useEffect(() => {
    // Apply immediately from cache or defaults
    document.documentElement.style.setProperty("--color-primary", theme.color);
    document.documentElement.style.setProperty(
      "--color-primary-hover",
      theme.hoverColor,
    );
  }, [theme.color, theme.hoverColor]);

  // Show loading only on first load when no cache exists
  if (isLoading && !cachedTheme) {
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
