import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { signInWithEmailAndPassword, setPersistence, getReactNativePersistence } from 'firebase/auth';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '@/services/firebase';
import { Colors } from '@/constants/Colors';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();

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
  }); 

  const router = useRouter();
  const handleSignIn = async () => {
    try {
      if (!auth) {
        console.error('Auth is not initialized');
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful, user ID:', userCredential.user.uid);
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user_email', email);
      await AsyncStorage.setItem('user_id', userCredential.user.uid);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <Text style={styles.title}>CNB Carpets</Text>
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

      <ThemedView style={styles.footer}>
        <ThemedText>Don't have an account? </ThemedText>
        <Link href="/sign-up" asChild>
          <Pressable>
            <ThemedText style={styles.link}>Sign Up</ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}