import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Alarm, RadioStation } from '../types/radio';

export { onAuthStateChanged };
export type { User };

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Track if quota has been exceeded to avoid spamming the backend
let isQuotaExceeded = false;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errMsg = error instanceof Error ? error.message : String(error);

  if (errMsg.includes('resource-exhausted') || errMsg.includes('Quota limit exceeded')) {
    isQuotaExceeded = true;
    console.warn('Firestore free quota limit reached for today. Using local storage fallback gracefully.');
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning: ', JSON.stringify(errInfo));
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

let saveDebounceTimer: number | null = null;

/**
 * Sync user preferences (Favorites, Alarms) to Firestore with debouncing and quota protection
 */
export async function saveUserPreferencesToFirestore(
  userId: string,
  data: {
    favorites: string[];
    favoriteStationObjects?: RadioStation[];
    alarms: Alarm[];
    totalMinutesListened?: number;
    settings?: Record<string, unknown>;
  }
) {
  if (isQuotaExceeded || !userId) {
    return;
  }

  if (saveDebounceTimer) {
    window.clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = window.setTimeout(async () => {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          userId,
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || '',
          favorites: data.favorites,
          favoriteStationObjects: data.favoriteStationObjects || [],
          alarms: data.alarms,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, 1000);
}

/**
 * Load user preferences from Firestore
 */
export async function loadUserPreferencesFromFirestore(userId: string) {
  if (isQuotaExceeded || !userId) return null;
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Listen to user preferences changes in real-time
 */
export function subscribeToUserPreferences(
  userId: string,
  onUpdate: (data: any) => void
) {
  if (isQuotaExceeded || !userId) {
    return () => {};
  }
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);
  try {
    return onSnapshot(
      userRef,
      docSnap => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data());
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}
