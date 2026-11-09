import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = { apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDnP_QyltRRwKjoUfJraQMqkV3_SJYigoU', authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ceyiz-defteri-sync.firebaseapp.com', projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ceyiz-defteri-sync', storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ceyiz-defteri-sync.firebasestorage.app', messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '490613867046', appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:490613867046:web:8f9af6ceaa4a7af10edce7' };
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);
