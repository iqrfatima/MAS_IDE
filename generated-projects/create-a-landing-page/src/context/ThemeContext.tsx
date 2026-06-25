import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Define the shape of the theme context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Create the Theme Context with a default undefined value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define props for ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component to wrap the application and provide theme context.
 * Manages theme state, persists it to localStorage, and applies the 'dark' class to the document's html element.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      // Check for user's system preference if no theme is stored
      if (storedTheme) {
        return storedTheme as 'light' | 'dark';
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Effect to update the 'dark' class on the html element and persist theme to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  /**
   * Toggles the theme between 'light' and 'dark'.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to consume the ThemeContext.
 * Throws an error if used outside of a ThemeProvider.
 * @returns {ThemeContextType} The current theme and a function to toggle it.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    const error = new Error('useTheme must be used within a ThemeProvider');
    console.error(error);
    throw error;
  }
  return context;
};
