import { getAuth, signOut, deleteUser } from 'firebase/auth';
import { Alert } from 'react-native';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, usersCollection } from '@/services/firebase';

export async function handleSignOut() {
  try {
    const auth = getAuth();
    await signOut(auth);
    // The AuthContext will automatically redirect to sign-in
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
} 

export async function handleDeleteAccount() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    // Delete user document from Firestore
    const userDocRef = doc(usersCollection, user.uid);
    await deleteDoc(userDocRef);
    
    // Delete the user's authentication account
    await deleteUser(user);
    
    // The AuthContext will automatically redirect to sign-in
    return true;
  } catch (error: any) {
    Alert.alert('Error', error.message);
    return false;
  }
} 