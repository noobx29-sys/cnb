import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB558CviT50ttHxIeSVROTEpxhu_h8Wias',
  authDomain: 'cnb-app-f2ed6.firebaseapp.com',
  databaseURL: 'https://cnb-app-f2ed6.firebaseio.com',
  projectId: 'cnb-app-f2ed6',
  storageBucket: 'cnb-app-f2ed6.firebasestorage.app',
  messagingSenderId: '465463891466',
  appId: '1:465463891466:ios:91389050378e1701b9f1f3',
} as const;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
export default firebaseConfig;
