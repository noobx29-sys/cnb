import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { auth, createUserDocument } from '@/services/firebase';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      color: '#fff',
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
      marginBottom: 24,
    },
    title: {
      fontSize: 52,
      fontWeight: '700',
      color: '#FB8A13',
    },
    subtitle: {
      fontSize: 18,
      color: '#fff',
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


  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!name || !email || !password || !companyName || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (!auth) {
        console.error('Auth is not initialized');
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await createUserDocument({
        uid: userCredential.user.uid,
        email: email,
        name: name,
        companyName: companyName,
        fullName: fullName,
        role: 'Pending',
      });

      // Sign out the user immediately since they're pending
      await auth.signOut();

      Alert.alert(
        'Account Created',
        'Your account has been created and is pending admin approval. You will receive an email once your account is approved.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/sign-in')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <Text style={styles.title}>Newtex Carpets</Text>
        <Text style={styles.subtitle}>Create your account</Text>
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Company Name"
          placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
          value={companyName}
          onChangeText={setCompanyName}
        />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
          value={fullName}
          onChangeText={setFullName}
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
        <ThemedView style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Confirm Password"
            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.textMuted : Colors.light.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.showPasswordButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <ThemedText>{showConfirmPassword ? 'Hide' : 'Show'}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <Pressable style={styles.button} onPress={handleSignUp}>
        <ThemedText style={styles.buttonText}>Create Account</ThemedText>
      </Pressable>

      <ThemedView style={styles.footer}>
        <ThemedText>Already have an account? </ThemedText>
        <Link href="/sign-in" asChild>
          <Pressable>
            <ThemedText style={styles.link}>Sign In</ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}
