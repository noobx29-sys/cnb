import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
}

const COLOR_SCHEME_KEY = '@color_scheme';
const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme() as ColorScheme;
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemColorScheme);

  // Load saved preference on mount
  useEffect(() => {
    const loadColorScheme = async () => {
      try {
        const savedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
        if (savedScheme) {
          setColorScheme(savedScheme as ColorScheme);
        }
      } catch (error) {
        console.error('Failed to load color scheme:', error);
      }
    };
    loadColorScheme();
  }, []);

  const toggleColorScheme = async () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, newScheme);
      setColorScheme(newScheme);
    } catch (error) {
      console.error('Failed to save color scheme:', error);
    }
  };

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export const useColorScheme = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) throw new Error('useColorScheme must be used within ColorSchemeProvider');
  return context;
}; 