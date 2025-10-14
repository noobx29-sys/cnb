import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, deleteUserAccount } from '@/lib/auth';
import { router } from 'expo-router';

export async function handleSignOut() {
  try {
    // Clear stored authentication data
    await AsyncStorage.multiRemove(['jwt_token', 'user_data', 'is_guest']);
    
    // Redirect to sign-in page
    router.replace('/(auth)/sign-in');
  } catch (error: any) {
    Alert.alert('Error', 'Failed to sign out. Please try again.');
    console.error('Sign out error:', error);
  }
} 

export async function handleDeleteAccount() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    // Delete user account from database
    const success = await deleteUserAccount(currentUser.id);
    
    if (success) {
      // Clear stored authentication data
      await AsyncStorage.multiRemove(['jwt_token', 'user_data', 'is_guest']);
      
      // Redirect to sign-in page
      router.replace('/(auth)/sign-in');
      
      Alert.alert('Success', 'Your account has been deleted successfully.');
      return true;
    } else {
      throw new Error('Failed to delete account');
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
    console.error('Delete account error:', error);
    return false;
  }
} 