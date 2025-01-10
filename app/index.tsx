import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FB8A13" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/(auth)/sign-in" />;
}