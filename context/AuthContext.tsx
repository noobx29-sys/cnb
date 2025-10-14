import { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getCurrentUser, signInAsGuest } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: AuthUser | null;
  userData: AuthUser | null;
  loading: boolean;
  isGuest: boolean;
  setUserData: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isGuest: false,
  setUserData: () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Refresh authentication state
  const refreshAuth = async () => {
    try {
      setLoading(true);
      
      // Check if we have stored user data
      const storedIsGuest = await AsyncStorage.getItem('is_guest');
      const isGuestUser = storedIsGuest === 'true';
      
      setIsGuest(isGuestUser);

      if (isGuestUser) {
        // Handle guest user
        console.log('Guest user signed in');
        const guestUser = await signInAsGuest();
        setUser(guestUser);
        setUserData(guestUser);
      } else {
        // Check for authenticated user
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log('User authenticated:', currentUser.email);
          setUser(currentUser);
          setUserData(currentUser);
          setIsGuest(false);
        } else {
          // No user is signed in
          console.log('No authenticated user found');
          setUser(null);
          setUserData(null);
          setIsGuest(false);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in auth refresh:', error);
      setLoading(false);
      setUser(null);
      setUserData(null);
      setIsGuest(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshAuth();
      
      // Navigate based on auth state
      const storedIsGuest = await AsyncStorage.getItem('is_guest');
      const currentUser = await getCurrentUser();
      
      if (storedIsGuest === 'true' || currentUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    };

    initializeAuth();
  }, []);

  // Function to refresh user data (useful after profile updates)
  const refreshUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUserData(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      isGuest, 
      setUserData: (data) => {
        setUserData(data);
        if (data) setUser(data);
      },
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 