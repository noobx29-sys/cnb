import 'react-native-get-random-values';
import bcrypt from 'bcryptjs';
import { jwt } from '@/lib/jwt-rn';
import { db, users, userSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { config } from './config';

// JWT secret from configuration
const JWT_SECRET = config.jwtSecret;

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token) as { userId: string };
  } catch (error) {
    return null;
  }
};

// Sign up user
export const signUp = async (signupData: SignupData): Promise<AuthUser> => {
  const { email, password, firstName, lastName, role = 'user' } = signupData;

  // Check if user already exists
  const existingUsers = await db.select().from(users).where(eq(users.email, email));
  if (existingUsers.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db.insert(users).values({
    email,
    firstName,
    lastName,
    passwordHash,
    role,
  }).returning();

  // Generate and store session token
  const token = generateToken(newUser.id);
  await db.insert(userSessions).values({
    userId: newUser.id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Store token in AsyncStorage and clear guest flag
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('user_id', newUser.id);
  await AsyncStorage.setItem('user_email', newUser.email);
  await AsyncStorage.removeItem('is_guest'); // Clear guest flag

  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: newUser.role,
    isActive: newUser.isActive,
    avatarUrl: newUser.avatarUrl || undefined,
  };
};

// Sign in user
export const signIn = async (credentials: LoginCredentials): Promise<AuthUser> => {
  const { email, password } = credentials;

  // Find user by email
  const userList = await db.select().from(users).where(eq(users.email, email));
  if (userList.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = userList[0];

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Generate and store session token
  const token = generateToken(user.id);
  await db.insert(userSessions).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Store token in AsyncStorage and clear guest flag
  await AsyncStorage.setItem('auth_token', token);
  await AsyncStorage.setItem('user_id', user.id);
  await AsyncStorage.setItem('user_email', user.email);
  await AsyncStorage.removeItem('is_guest'); // Clear guest flag

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl || undefined,
  };
};

// Sign out user
export const signOut = async (): Promise<void> => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    // Remove session from database
    await db.delete(userSessions).where(eq(userSessions.token, token));
  }

  // Clear AsyncStorage
  await AsyncStorage.multiRemove(['auth_token', 'user_id', 'user_email', 'is_guest']);
};

// Get current user from token
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) return null;

    // Verify token
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      await signOut(); // Clean up invalid token
      return null;
    }
    
    const { userId } = tokenPayload;

    // Check if session exists and is not expired
    const sessions = await db.select().from(userSessions).where(eq(userSessions.token, token));
    if (sessions.length === 0 || sessions[0].expiresAt < new Date()) {
      await signOut(); // Clean up invalid session
      return null;
    }

    // Get user data
    const userList = await db.select().from(users).where(eq(users.id, userId));
    if (userList.length === 0 || !userList[0].isActive) {
      await signOut(); // Clean up if user doesn't exist or is inactive
      return null;
    }

    const user = userList[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl || undefined,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    await signOut(); // Clean up on error
    return null;
  }
};

// Guest login
export const signInAsGuest = async (): Promise<AuthUser> => {
  await AsyncStorage.setItem('is_guest', 'true');
  await AsyncStorage.setItem('user_id', 'guest');
  
  return {
    id: 'guest',
    email: 'guest@example.com',
    firstName: 'Guest',
    lastName: 'User',
    role: 'guest',
    isActive: true,
  };
};

// Delete user account
export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  try {
    // First, delete all user sessions
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
    
    // Then delete the user
    const result = await db.delete(users).where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error('Delete user account error:', error);
    return false;
  }
};