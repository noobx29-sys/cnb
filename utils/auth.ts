import { getAuth, signOut } from 'firebase/auth';
import { Alert } from 'react-native';

export async function handleSignOut() {
  try {
    const auth = getAuth();
    await signOut(auth);
    // The AuthContext will automatically redirect to sign-in
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
} 