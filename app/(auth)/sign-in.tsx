import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { signIn, signInAsGuest } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const { refreshAuth } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    inputContainer: {
      gap: 16,
      marginBottom: 24,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: '#666666',
    },
    button: {
      height: 48,
      backgroundColor: '#FB8A13',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    guestButton: {
      height: 48,
      backgroundColor: 'transparent',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#FB8A13',
    },
    guestButtonText: {
      color: '#FB8A13',
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    link: {
      color: '#FB8A13',
      fontWeight: '600',
    },
    titleContainer: {
      marginBottom: 32,
    },
    title: {
      fontSize: 52,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#FB8A13',
    },
    subtitle: {
      color: '#666666',
      fontSize: 18,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    passwordInput: {
      flex: 1,
    },
    showPasswordButton: {
      position: 'absolute',
      right: 16,
      height: '100%',
      justifyContent: 'center',
    },
    forgotPassword: {
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    forgotPasswordText: {
      color: '#FB8A13',
      fontSize: 14,
    },
  }); 

  const router = useRouter();
  const handleSignIn = async () => {
    try {
      const user = await signIn({ email, password });
      
      // Check user's role - if it's 'pending', show message
      if (user.role === 'pending') {
        Alert.alert(
          'Account Pending Approval',
          'Your account is currently waiting for administrator approval. You will receive an email once your account has been approved.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('Sign in successful, user ID:', user.id);
      
      // Refresh auth state to immediately update context
      await refreshAuth();
      
      // Navigate to tabs
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert('Error', error.message || 'An error occurred during sign in');
    }
  };

  const handleGuestSignIn = async () => {
    try {
      const guestUser = await signInAsGuest();
      console.log('Guest sign in successful, user ID:', guestUser.id);
      
      // Refresh auth state to immediately update context
      await refreshAuth();
      
      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Guest sign in error:', error);
      Alert.alert('Error', error.message || 'An error occurred during guest sign in');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    // TODO: Implement password reset functionality with your chosen email service
    // You can use services like SendGrid, AWS SES, or similar
    Alert.alert(
      'Password Reset',
      'Password reset functionality is not yet implemented. Please contact support for assistance.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <Text style={styles.title}>Newtex Carpets</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <ThemedView style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <ThemedText>{showPassword ? 'Hide' : 'Show'}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <Pressable style={styles.button} onPress={handleSignIn}>
        <ThemedText style={styles.buttonText}>Sign In</ThemedText>
      </Pressable>
      
      <Pressable style={styles.guestButton} onPress={handleGuestSignIn}>
        <ThemedText style={styles.guestButtonText}>Continue as Guest</ThemedText>
      </Pressable>

      <ThemedView style={styles.footer}>
        <ThemedText>Don't have an account? </ThemedText>
        <Link href="/sign-up" asChild>
          <Pressable>
            <ThemedText style={styles.link}>Sign Up</ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
      <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
        <ThemedText style={styles.forgotPasswordText}>Forgot password?</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}