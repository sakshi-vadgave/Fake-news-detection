import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Construct config dynamically using environment variables to keep secrets safe in Git/GitHub
const dynamicConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
};

const hasValidConfig = dynamicConfig.apiKey && dynamicConfig.apiKey !== "PLACEHOLDER_API_KEY";

if (!hasValidConfig) {
  console.warn(
    "[Firebase] WARNING: Firebase Client Web API Key is missing or using placeholder values. " +
    "Verify your environment variables are set correctly."
  );
}

const app = initializeApp({
  apiKey: hasValidConfig ? dynamicConfig.apiKey : "PLACEHOLDER_KEY",
  authDomain: dynamicConfig.authDomain,
  projectId: dynamicConfig.projectId,
  storageBucket: dynamicConfig.storageBucket,
  messagingSenderId: dynamicConfig.messagingSenderId,
  appId: dynamicConfig.appId,
});

// CRITICAL: Initialize Firestore with persistent storage and force long-polling for environments with restricted WebSocket capabilities
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, dynamicConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Connection to Firestore on startup as requested
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info("[Firestore] Initial online handshake succeeded.");
  } catch (error) {
    console.info("[Firestore] Offline or connection pending. Using persistent offline cache fallback mode gracefully.");
  }
}
testConnection();

// --- Firestore Error Formatting Helper ---
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
