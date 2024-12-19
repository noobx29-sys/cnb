import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase
export const firebaseConfig = {
  apiKey: 'AIzaSyB558CviT50ttHxIeSVROTEpxhu_h8Wias',
  authDomain: 'cnb-app-f2ed6.firebaseapp.com',
  databaseURL: 'https://cnb-app-f2ed6.firebaseio.com',
  projectId: 'cnb-app-f2ed6',
  storageBucket: 'cnb-app-f2ed6.firebasestorage.app',
  messagingSenderId: '465463891466',
  appId: '1:465463891466:ios:91389050378e1701b9f1f3',
};

export const app = initializeApp(firebaseConfig);

// Initialize auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };
export const database = getDatabase(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
