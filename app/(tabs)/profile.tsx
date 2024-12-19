import { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Alert, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { handleSignOut } from '@/utils/auth';
import { UserData } from '@/services/firebase';
import { verifyUserRole } from '@/services/firebase';
import { useColorScheme } from '@/context/ColorSchemeContext';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { userData } = useAuth();
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
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    themeToggle: {
      padding: 8,
      borderRadius: 20,
    },
  });
  

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

            {userData.role === 'admin' && (
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
            
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}