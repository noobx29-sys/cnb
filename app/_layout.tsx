import { useCallback, useState } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { AuthProvider } from '@/context/AuthContext';
import { ColorSchemeProvider } from '@/context/ColorSchemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  const onAnimationComplete = useCallback((finished: boolean) => {
    if (finished) {
      setSplashAnimationFinished(true);
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AnimatedSplashScreen onAnimationComplete={onAnimationComplete}>
      <ColorSchemeProvider>
        <ThemeProvider value={DarkTheme}>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen 
                name="(auth)" 
                options={{
                  animation: splashAnimationFinished ? 'fade' : 'none',
                }}
              />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" options={{ headerShown: true }} />
            </Stack>
            <StatusBar style="light" />
          </AuthProvider>
        </ThemeProvider>
      </ColorSchemeProvider>
    </AnimatedSplashScreen>
  );
}
