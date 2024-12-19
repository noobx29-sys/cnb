import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const prepare = async () => {
      // Prevent the splash screen from auto-hiding
      await SplashScreen.preventAutoHideAsync();
      
      if (!loading) {
        // Hide the splash screen once loading is complete
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, [loading]);

  // Redirect based on auth state
  return <Redirect href={user ? "/(tabs)" : "/(auth)/sign-in"} />;
}
