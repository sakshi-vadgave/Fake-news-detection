/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Helper to clean environment and config string values, removing any surrounding quotes or placeholder text
const cleanValue = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  const cleaned = val.replace(/^["']|["']$/g, '').trim();
  if (cleaned.includes("PLACEHOLDER")) return '';
  return cleaned;
};

// Construct config dynamically using environment variables to keep secrets safe in Git/GitHub
const dynamicConfig = {
  apiKey: cleanValue(import.meta.env.VITE_FIREBASE_API_KEY) || cleanValue(firebaseConfig.apiKey),
  authDomain: cleanValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || cleanValue(firebaseConfig.authDomain),
  projectId: cleanValue(import.meta.env.VITE_FIREBASE_PROJECT_ID) || cleanValue(firebaseConfig.projectId),
  storageBucket: cleanValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || cleanValue(firebaseConfig.storageBucket),
  messagingSenderId: cleanValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || cleanValue(firebaseConfig.messagingSenderId),
  appId: cleanValue(import.meta.env.VITE_FIREBASE_APP_ID) || cleanValue(firebaseConfig.appId),
  firestoreDatabaseId: cleanValue(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || cleanValue(firebaseConfig.firestoreDatabaseId),
};

const hasValidConfig = !!dynamicConfig.apiKey;

if (!hasValidConfig) {
  console.warn(
    "[Firebase] WARNING: Firebase Client Web API Key is missing or using placeholder values. " +
    "Verify your environment variables are set correctly."
  );
}

const app = initializeApp({
  apiKey: hasValidConfig ? dynamicConfig.apiKey : "PLACEHOLDER_KEY",
  authDomain: dynamicConfig.authDomain || undefined,
  projectId: dynamicConfig.projectId || undefined,
  storageBucket: dynamicConfig.storageBucket || undefined,
  messagingSenderId: dynamicConfig.messagingSenderId || undefined,
  appId: dynamicConfig.appId || undefined,
});

// CRITICAL: Initialize Firestore with persistent storage and force long-polling for environments with restricted WebSocket capabilities
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, dynamicConfig.firestoreDatabaseId || undefined);

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
