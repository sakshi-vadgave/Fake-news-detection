/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Retrieve the dynamic Firebase configuration served by the server from window.FIREBASE_CONFIG
let globalConfig = (typeof window !== "undefined" ? (window as any).FIREBASE_CONFIG : null);

// Fail-safe synchronous fallback: If window.FIREBASE_CONFIG is not loaded yet, fetch it synchronously!
if (typeof window !== "undefined" && !globalConfig) {
  try {
    const xhr = new XMLHttpRequest();
    // Synchronous request guarantees config is populated before Firebase initialization continues
    xhr.open("GET", "/api/firebase-config", false);
    xhr.send();
    if (xhr.status === 200) {
      globalConfig = JSON.parse(xhr.responseText);
      (window as any).FIREBASE_CONFIG = globalConfig;
    }
  } catch (err) {
    console.error("[Firebase Config Fallback] Synchronous config load failed:", err);
  }
}

if (!globalConfig) {
  globalConfig = {};
}

// Helper to clean environment and config string values, removing any surrounding quotes or placeholder text
const cleanValue = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  const cleaned = val.replace(/^["']|["']$/g, '').trim();
  if (cleaned.includes("PLACEHOLDER")) return '';
  return cleaned;
};

// Construct config dynamically using the server-served runtime configuration
const dynamicConfig = {
  apiKey: cleanValue(globalConfig.apiKey),
  authDomain: cleanValue(globalConfig.authDomain),
  projectId: cleanValue(globalConfig.projectId),
  storageBucket: cleanValue(globalConfig.storageBucket),
  messagingSenderId: cleanValue(globalConfig.messagingSenderId),
  appId: cleanValue(globalConfig.appId),
  firestoreDatabaseId: cleanValue(globalConfig.firestoreDatabaseId),
};

const hasValidConfig = !!dynamicConfig.apiKey;

if (!hasValidConfig) {
  console.warn(
    "[Firebase] WARNING: Dynamic Firebase Client Web API Key is missing. " +
    "Verify your server-side firebase-applet-config.json and env variables are set correctly."
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
