import { useCallback, useEffect, useState } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { AuthProvider } from '@/context/AuthContext';
import { ColorSchemeProvider } from '@/context/ColorSchemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

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

  const Content = () => (
    <ColorSchemeProvider>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
              name="(auth)" 
              options={{
                animation: 'none',
              }}
            />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </ThemeProvider>
    </ColorSchemeProvider>
  );

  // Use AnimatedSplashScreen for both platforms
  return (
    <AnimatedSplashScreen onAnimationComplete={onAnimationComplete}>
      <Content />
    </AnimatedSplashScreen>
  );
}
