import { createContext } from 'react';

export interface ThemeContextType {
  color: string;
  hoverColor: string;
  mainLogo: string;
  mainCover: string;
  isLoading: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
