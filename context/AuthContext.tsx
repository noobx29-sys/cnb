import { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router';
import { auth, getUserDocument, verifyUserRole } from '@/services/firebase';
import type { UserData } from '@/services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check AsyncStorage for existing user data
        const storedUserId = await AsyncStorage.getItem('user_id');
        
        if (!auth) {
          console.error('Auth is not initialized');
          return;
        }

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          console.log('Auth state changed:', user ? `User exists: ${user.email}` : 'No user');
          try {
            if (user) {
              setLoading(true);
              setUser(user);
              
              const [userData, verifiedRole] = await Promise.all([
                getUserDocument(user.uid),
                verifyUserRole(user.uid)
              ]);
              
              console.log('User data fetched:', userData);
              console.log('Verified role:', verifiedRole);
              
              if (userData && verifiedRole) {
                setUserData({
                  ...userData,
                  role: verifiedRole
                });
                
                // Update AsyncStorage
                await AsyncStorage.setItem('user_id', user.uid);
                await AsyncStorage.setItem('user_email', user.email || '');
                
                // Explicitly navigate to tabs
                router.replace('/(tabs)');
              } else {
                throw new Error('Failed to get user data or role');
              }
            } else {
              // Clear everything and redirect to sign-in
              setUser(null);
              setUserData(null);
              await AsyncStorage.removeItem('user_id');
              await AsyncStorage.removeItem('user_email');
              router.replace('/(auth)/sign-in');
            }
          } catch (error) {
            console.error('Error in auth state change:', error);
            setUser(null);
            setUserData(null);
            await AsyncStorage.removeItem('user_id');
            await AsyncStorage.removeItem('user_email');
            router.replace('/(auth)/sign-in');
          } finally {
            setLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 