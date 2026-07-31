import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
// Do NOT import firebase/analytics at module scope on the server.
// It accesses browser globals and breaks Next.js prerender.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only on client side to prevent SSR issues
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Global flag to track initialization (HMR protection)
const GLOBAL_KEY = "__FIREBASE_INITIALIZED__";

if (typeof window !== "undefined") {
  try {
    // Check if Firebase was already initialized in this session
    const wasInitialized = (window as any)[GLOBAL_KEY];
    
    if (getApps().length > 0) {
      // Firebase already initialized, reuse existing
      app = getApp();
    } else if (!wasInitialized) {
      // First time initialization
      app = initializeApp(firebaseConfig);
      (window as any)[GLOBAL_KEY] = true;
    } else {
      // HMR triggered reload but Firebase was cleared
      app = initializeApp(firebaseConfig);
    }

    if (app) {
      auth = getAuth(app);
      
      // Use initializeFirestore with cache config to prevent duplicate initialization issues
      // Only initialize Firestore once per app instance
      try {
        db = getFirestore(app);
      } catch (firestoreError) {
        // If getFirestore fails, try initializeFirestore with cache settings
        // This can happen if Firestore wasn't initialized with the app
        try {
          db = initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          });
        } catch (initError) {
          // If initializeFirestore also fails, Firestore may already exist
          db = getFirestore(app);
        }
      }
      
      storage = getStorage(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Don't attempt recovery - let the app handle uninitialized state gracefully
    // Recovery attempts can cause the "Unexpected state" error
  }
}

// Initialize Analytics lazily and only in the browser to avoid SSR errors.
let analytics: any = null;
if (typeof window !== "undefined" && app) {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) =>
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app!);
        }
        return null;
      })
    )
    .catch(() => {
      // ignore analytics failures on unsupported environments
    });
}

// Safe wrapper functions with retry logic
export const safeFirestoreOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T | null> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's an internal assertion error
      if (error?.message?.includes("INTERNAL ASSERTION FAILED") || 
          error?.message?.includes("Unexpected state")) {
        console.warn(`Firestore internal error on attempt ${attempt}, retrying...`);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          continue;
        }
      } else {
        // Not an internal error, throw immediately
        throw error;
      }
    }
  }
  
  console.error("Firestore operation failed after retries:", lastError);
  return null;
};

// Helper to check if Firebase is ready
export const isFirebaseReady = (): boolean => {
  return typeof window !== "undefined" && !!app && !!db;
};

export { app, auth, db, storage, analytics };
