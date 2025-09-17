import { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Alert, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { router, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { handleSignOut, handleDeleteAccount } from '@/utils/auth';
import { UserData } from '@/services/firebase';
import { verifyUserRole } from '@/services/firebase';
import { useColorScheme } from '@/context/ColorSchemeContext';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { userData, isGuest } = useAuth();
  const { toggleColorScheme, colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    safeArea: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    profileSection: {
      padding: 20,
      gap: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
    },
    label: {
      color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
      fontWeight: '600',
    },
    value: {
      fontWeight: '400',
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    },
    button: {
      backgroundColor: '#FB8A13',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    adminButton: {
      backgroundColor: '#FB8A13',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    signOutButton: {
      backgroundColor: '#D1001E',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    deleteAccountButton: {
      backgroundColor: '#8B0000',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    themeToggle: {
      padding: 8,
      borderRadius: 20,
    },
    guestContainer: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    guestTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 12,
      color: '#FB8A13',
    },
    guestMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    },
    signUpButton: {
      backgroundColor: '#FB8A13',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
      marginBottom: 12,
    },
    signInButton: {
      backgroundColor: 'transparent',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: '#FB8A13',
    },
    signInButtonText: {
      color: '#FB8A13',
      fontSize: 16,
      fontWeight: '600',
    },
  });
  
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await handleDeleteAccount();
            if (success) {
              // The auth context will handle the redirect
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Guest user view
  if (isGuest) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.guestContainer}>
            <ThemedText style={styles.guestTitle}>Guest Account</ThemedText>
            <ThemedText style={styles.guestMessage}>
              You're currently using the app as a guest. Create an account to access all features including saving favorites, viewing prices, and more.
            </ThemedText>
            
            <Pressable 
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <ThemedText style={styles.buttonText}>Create Account</ThemedText>
            </Pressable>
            
            <Pressable 
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
            </Pressable>
            
            <Pressable 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please sign in to view your profile.</ThemedText>
        <Pressable 
          style={styles.button}
          onPress={() => router.replace('/sign-in')}
        >
          <ThemedText style={styles.buttonText}>Sign In</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Profile</ThemedText>
            <Pressable 
              style={styles.themeToggle}
              onPress={toggleColorScheme}
            >
              <ThemedText>{colorScheme === 'dark' ? '🌙' : '☀️'}</ThemedText>
              </Pressable>
          </ThemedView>

          <ThemedView style={styles.profileSection}>
            <ThemedView style={styles.infoRow} variant="secondary">
              <ThemedText style={styles.label}>Name</ThemedText>
              <ThemedText style={styles.value}>{userData.name}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow} variant="secondary">
              <ThemedText style={styles.label}>Email</ThemedText>
              <ThemedText style={styles.value}>{userData.email}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.infoRow} variant="secondary">
              <ThemedText style={styles.label}>Role</ThemedText>
              <ThemedText style={[styles.value, { textTransform: 'capitalize' }]}>{userData.role}</ThemedText>
            </ThemedView>

            {userData.role === 'Admin' && (
              <Pressable 
                style={styles.adminButton}
                onPress={() => router.push('/admin/users')}
              >
                <ThemedText style={styles.buttonText}>Manage Users</ThemedText>
              </Pressable>
            )}

            <Pressable 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
            </Pressable>
            
            <Pressable 
              style={styles.deleteAccountButton}
              onPress={confirmDeleteAccount}
            >
              <ThemedText style={styles.buttonText}>Delete Account</ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}