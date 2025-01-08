import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Initialize auth based on platform
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    auth = getAuth(app);
  }
}

export { auth };
export const firestore = getFirestore(app);
export const storage = getStorage(app);
