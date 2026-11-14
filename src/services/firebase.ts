import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AuthUser } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Gunakan firestoreDatabaseId dari konfigurasi
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cache token akses Google Sheets HANYA di memori (tidak pernah di localStorage)
let cachedSheetsAccessToken: string | null = null;

export function getCachedSheetsAccessToken(): string | null {
  return cachedSheetsAccessToken;
}

export function clearCachedSheetsAccessToken(): void {
  cachedSheetsAccessToken = null;
}

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Konversi Firebase User menjadi objek AuthUser aplikasi
 */
export function mapFirebaseUser(fbUser: User): AuthUser {
  const email = fbUser.email || '';
  return {
    uid: fbUser.uid,
    name: fbUser.displayName || (email ? email.split('@')[0] : 'Pengguna Schnell'),
    email,
    photoUrl: fbUser.photoURL || '',
  };
}

/**
 * Login Google menggunakan Firebase Auth Popup sekaligus meminta izin Google Sheets
 */
export async function signInWithGooglePopup(): Promise<{
  user: AuthUser;
  accessToken: string | null;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || null;
  if (token) {
    cachedSheetsAccessToken = token;
  }
  return {
    user: mapFirebaseUser(result.user),
    accessToken: token,
  };
}

/**
 * Meminta atau memperbarui token akses Google Sheets melalui Firebase Auth Popup
 */
export async function requestSheetsTokenViaFirebase(): Promise<string> {
  const result = auth.currentUser
    ? await reauthenticateWithPopup(auth.currentUser, googleProvider)
    : await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error(
      'Google tidak mengembalikan token akses Google Sheets. Pastikan Anda mencentang izin melihat Google Sheets saat login.'
    );
  }
  cachedSheetsAccessToken = token;
  return token;
}

/**
 * Logout dari Firebase Auth dan bersihkan token memori
 */
export async function signOutFirebase(): Promise<void> {
  cachedSheetsAccessToken = null;
  await signOut(auth);
}

/**
 * Pantau status autentikasi Firebase
 */
export function subscribeAuthState(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, (fbUser) => {
    if (!fbUser) {
      cachedSheetsAccessToken = null;
    }
    callback(fbUser ? mapFirebaseUser(fbUser) : null);
  });
}

/**
 * Uji koneksi awal ke Firestore saat aplikasi dimuat
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline atau koneksi internet belum stabil.');
    }
    return false;
  }
}

export interface SyncedUserData {
  sheetUrl?: string;
  monthlyTarget?: number;
  demoMode?: boolean;
  packageRates?: {
    Basic: number;
    Standart: number;
    Premium: number;
  };
  bookOverrides?: Record<number, any>;
  dummyStatuses?: Record<number, string>;
  bookNotes?: Record<number, any[]>;
  updatedAt?: string;
}

/**
 * Membaca data pengguna yang tersinkronisasi di Firestore
 */
export async function fetchUserCloudData(userId: string): Promise<SyncedUserData | null> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return null;
  }
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as SyncedUserData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Menyimpan atau memperbarui data konfigurasi pengguna ke Firestore
 */
export async function saveUserCloudData(
  userId: string,
  data: Partial<SyncedUserData>
): Promise<void> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `users/${userId}`;
  const payload: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.sheetUrl !== undefined) {
    payload.sheetUrl = String(data.sheetUrl).slice(0, 1024);
  }
  if (data.monthlyTarget !== undefined) {
    const target = Number(data.monthlyTarget);
    if (!Number.isNaN(target) && target > 0 && target <= 10000) {
      payload.monthlyTarget = target;
    }
  }
  if (data.demoMode !== undefined) {
    payload.demoMode = Boolean(data.demoMode);
  }
  if (data.packageRates !== undefined) {
    payload.packageRates = data.packageRates;
  }
  if (data.bookOverrides !== undefined) {
    payload.bookOverrides = data.bookOverrides;
  }
  if (data.dummyStatuses !== undefined) {
    payload.dummyStatuses = data.dummyStatuses;
  }
  if (data.bookNotes !== undefined) {
    payload.bookNotes = data.bookNotes;
  }

  try {
    await setDoc(doc(db, 'users', userId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Mendengarkan perubahan data pengguna secara real-time antar perangkat
 */
export function subscribeUserCloudData(
  userId: string,
  onData: (data: SyncedUserData) => void
): () => void {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SyncedUserData);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
