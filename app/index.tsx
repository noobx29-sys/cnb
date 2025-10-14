import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Index screen - Loading:', loading, 'User:', user?.email);
    if (!loading) {
      if (user) {
        console.log('Redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('Redirecting to sign-in');
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, loading]);

  // Show loading indicator while checking auth state
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FB8A13" />
    </View>
  );
}