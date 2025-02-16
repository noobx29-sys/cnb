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
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  setUserData: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have stored user data
        const storedUserId = await AsyncStorage.getItem('user_id');
        const storedEmail = await AsyncStorage.getItem('user_email');

        // Set up auth state listener
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          console.log('Auth state changed:', user ? `User exists: ${user.email}` : 'No user');
          
          if (user) {
            setUser(user);
            try {
              const [userData, verifiedRole] = await Promise.all([
                getUserDocument(user.uid),
                verifyUserRole(user.uid)
              ]);
              
              if (userData && verifiedRole) {
                setUserData({
                  ...userData,
                  role: verifiedRole
                });
                await AsyncStorage.setItem('user_id', user.uid);
                await AsyncStorage.setItem('user_email', user.email || '');
                router.replace('/(tabs)');
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              setUser(null);
              setUserData(null);
              router.replace('/(auth)/sign-in');
            }
          } else {
            // No user is signed in
            setUser(null);
            setUserData(null);
            await AsyncStorage.multiRemove(['user_id', 'user_email']);
            router.replace('/(auth)/sign-in');
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error in auth initialization:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 