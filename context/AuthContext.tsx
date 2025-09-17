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
  isGuest: boolean;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isGuest: false,
  setUserData: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have stored user data
        const storedUserId = await AsyncStorage.getItem('user_id');
        const storedEmail = await AsyncStorage.getItem('user_email');
        const storedIsGuest = await AsyncStorage.getItem('is_guest');
        
        setIsGuest(storedIsGuest === 'true');

        // Set up auth state listener
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          console.log('Auth state changed:', user ? `User exists: ${user.email || 'Anonymous'}` : 'No user');
          
          if (user) {
            setUser(user);
            try {
              // Check if this is a guest user
              const isGuestUser = await AsyncStorage.getItem('is_guest') === 'true';
              setIsGuest(isGuestUser);
              
              if (isGuestUser) {
                // For guest users, we don't need to fetch additional data
                console.log('Guest user signed in');
                const guestUserData = {
                  uid: user.uid,
                  email: 'guest@example.com',
                  name: 'Guest User',
                  role: 'Guest',
                  isGuest: true,
                  createdAt: new Date(),
                } as UserData;
                
                setUserData(guestUserData);
                router.replace('/(tabs)');
              } else {
                // For regular users, fetch their data
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
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              setUser(null);
              setUserData(null);
              setIsGuest(false);
              router.replace('/(auth)/sign-in');
            }
          } else {
            // No user is signed in
            setUser(null);
            setUserData(null);
            setIsGuest(false);
            await AsyncStorage.multiRemove(['user_id', 'user_email', 'is_guest']);
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
    <AuthContext.Provider value={{ user, userData, loading, isGuest, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 