# Firestore Database Documentation

## Overview

CSF Website uses **Firebase Firestore** as its primary NoSQL database for storing application data including users, resources, events, leaders, gallery items, and admin logs. Firestore provides real-time synchronization, offline support, and scalable data storage.

## Database Structure

### Collections

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── role: "admin" | "user"
│       ├── profile: object
│       └── created_at: timestamp
│
├── executive_leaders/
│   └── {leaderId}/
│       ├── name: string
│       ├── role: string
│       ├── photo_url: string
│       ├── photo_path: string
│       ├── email: string
│       ├── phone: string
│       ├── bio: string
│       ├── is_current: boolean
│       ├── is_featured: boolean
│       ├── display_order: number
│       └── start_date: timestamp
│
├── spiritual_resources/
│   └── {resourceId}/
│       ├── title: string
│       ├── description: string
│       ├── type: "document" | "audio" | "video"
│       ├── resource_type: string
│       ├── file_type: string
│       ├── file_url: string
│       ├── file_path: string
│       ├── content_url: string
│       ├── author: string
│       ├── category: string
│       ├── is_featured: boolean
│       ├── is_active: boolean
│       └── date_published: timestamp
│
├── gallery_items/
│   └── {itemId}/
│       ├── title: string
│       ├── description: string
│       ├── image_url: string
│       ├── image_path: string
│       ├── category: string
│       ├── is_featured: boolean
│       ├── is_active: boolean
│       └── created_at: timestamp
│
├── events/
│   └── {eventId}/
│       ├── title: string
│       ├── description: string
│       ├── date: timestamp
│       ├── location: string
│       ├── image_url: string
│       ├── category: string
│       ├── is_featured: boolean
│       └── registrations: array
│
├── admin_logs/
│   └── {logId}/
│       ├── user_id: string
│       ├── user_email: string
│       ├── action: string
│       ├── details: string
│       └── timestamp: timestamp
│
└── prayer_requests/
    └── {requestId}/
        ├── name: string
        ├── request: string
        ├── is_private: boolean
        ├── status: "pending" | "prayed"
        └── created_at: timestamp
```

## Configuration

### Firebase Initialization

```typescript
// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
```

## CRUD Operations

### Create

```typescript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const addResource = async (resourceData) => {
  const docRef = await addDoc(collection(db, "spiritual_resources"), {
    ...resourceData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};
```

### Read

```typescript
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

// Fetch featured leaders
const getFeaturedLeaders = async () => {
  const q = query(
    collection(db, "executive_leaders"),
    where("is_featured", "==", true),
    where("is_current", "==", true),
    orderBy("display_order", "asc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### Update

```typescript
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const updateResource = async (resourceId, updates) => {
  const resourceRef = doc(db, "spiritual_resources", resourceId);
  await updateDoc(resourceRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
```

### Delete

```typescript
import { doc, deleteDoc } from "firebase/firestore";

const deleteResource = async (resourceId) => {
  await deleteDoc(doc(db, "spiritual_resources", resourceId));
};
```

## Query Patterns

### Filtering

```typescript
// Active resources only
query(collection(db, "spiritual_resources"), where("is_active", "==", true))

// Featured leaders
query(collection(db, "executive_leaders"), where("is_featured", "==", true))

// By category
query(collection(db, "gallery_items"), where("category", "==", "events"))
```

### Sorting

```typescript
// Order by display order
query(collection(db, "executive_leaders"), orderBy("display_order", "asc"))

// Latest first
query(collection(db, "events"), orderBy("date", "desc"))
```

### Pagination

```typescript
import { query, limit, startAfter, getDocs } from "firebase/firestore";

const getPaginatedResources = async (lastDoc = null) => {
  let q = query(collection(db, "spiritual_resources"), limit(10));
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs;
};
```

## Quota-Safe Operations

### ⚠️ Avoiding Read Quota Exhaustion

Firebase Firestore has a daily read quota (50K reads/day on Spark plan). The following patterns help prevent exceeding quotas:

#### ❌ WRONG: Fetching All Documents for Counting
```typescript
// ❌ NEVER DO THIS - Costs 1 read per document
const snapshot = await getDocs(collection(db, "users"));
const count = snapshot.size; // 100 users = 100 reads!
```

#### ✅ CORRECT: Using getCountFromServer
```typescript
import { getCountFromServer } from "firebase/firestore";

// ✅ Costs 1 read regardless of collection size
const snapshot = await getCountFromServer(collection(db, "users"));
const count = snapshot.data().count; // Always 1 read
```

### Admin Dashboard Stats - Quota-Safe Pattern

```typescript
const loadStats = async () => {
  try {
    // Helper function with error handling
    const safeGetCount = async (collectionName: string): Promise<number> => {
      try {
        const snapshot = await getCountFromServer(collection(db, collectionName));
        return snapshot.data().count;
      } catch (error) {
        console.warn(`Collection "${collectionName}" not found:`, error);
        return 0;
      }
    };

    // Fetch all counts in parallel
    const [totalUsers, totalEvents] = await Promise.all([
      safeGetCount("users"),
      safeGetCount("events")
    ]);

    setStats({ totalUsers, totalEvents });
  } catch (error) {
    console.error("Error loading stats:", error);
  }
};
```

### Preventing Infinite Loops

#### ❌ WRONG: Infinite Loop from Dependency Array
```typescript
// ❌ This creates an infinite loop!
useEffect(() => {
  loadStats();
}, [totalUsers, totalEvents]); // Updates trigger re-run!
```

#### ✅ CORRECT: Stable Dependencies
```typescript
// ✅ Only runs when admin status changes
useEffect(() => {
  if (isAdmin) {
    loadStats();
  }
}, [isAdmin]); // Stable dependency
```

### Cost Comparison

| Operation | 100 Documents | 1000 Documents | 10,000 Documents |
|-----------|---------------|----------------|------------------|
| `getDocs()` + count | 100 reads | 1,000 reads | 10,000 reads |
| `getCountFromServer()` | **1 read** | **1 read** | **1 read** |

### Best Practices for Quota Management

1. **Use `getCountFromServer()`** for all counting operations
2. **Limit query results** with `limit()`
3. **Use pagination** for large datasets
4. **Cache results** in state to prevent re-fetching
5. **Avoid dependency loops** in `useEffect` hooks
6. **Monitor quota usage** in Firebase Console

### Monitoring Quota Usage

```typescript
// Log read operations during development
const logReadOperation = (operation: string, count: number) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Firestore Read] ${operation}: ${count} reads`);
  }
};
```

## Security Rules

### Basic Rules Template

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to public collections
    match /spiritual_resources/{resource} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /executive_leaders/{leader} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /gallery_items/{item} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /events/{event} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Admin logs - write only by admins
    match /admin_logs/{log} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow create: if request.auth != null && request.auth.token.admin == true;
      allow update, delete: if false;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Error Handling

### Common Firestore Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `permission-denied` | Security rules blocking | Check auth state, update rules |
| `not-found` | Document doesn't exist | Verify document ID, handle gracefully |
| `already-exists` | Duplicate ID | Use addDoc instead of setDoc |
| `resource-exhausted` | Rate limiting | Implement exponential backoff |
| `unauthenticated` | User not logged in | Check auth state before operations |

### Error Handling Pattern

```typescript
const safeFirestoreOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    console.error("Firestore error:", error);
    
    if (error.code === 'permission-denied') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to perform this action.",
        variant: "destructive",
      });
    } else if (error.code === 'not-found') {
      toast({
        title: "Not Found",
        description: "The requested item could not be found.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
};
```

## Best Practices

### 1. Use Server Timestamps
Always use server timestamps for date fields:
```typescript
import { serverTimestamp } from "firebase/firestore";

await addDoc(collection(db, "resources"), {
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

### 2. Batch Operations
For multiple writes, use batch operations:
```typescript
import { writeBatch } from "firebase/firestore";

const batch = writeBatch(db);

const resourceRef = doc(db, "spiritual_resources", "resource1");
batch.update(resourceRef, { is_active: false });

const logRef = doc(collection(db, "admin_logs"));
batch.set(logRef, {
  action: "DEACTIVATE_RESOURCE",
  timestamp: serverTimestamp(),
});

await batch.commit();
```

### 3. Offline Persistence
Enable offline persistence for better UX:
```typescript
import { enableIndexedDbPersistence } from "firebase/firestore";

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
  } else if (err.code == 'unimplemented') {
    // The current browser doesn't support persistence.
  }
});
```

### 4. Compound Queries
Create composite indexes for complex queries:
```typescript
// Requires composite index
query(
  collection(db, "executive_leaders"),
  where("is_current", "==", true),
  where("is_featured", "==", true),
  orderBy("display_order", "asc")
)
```

### 5. Data Validation
Validate data before writing:
```typescript
const validateResource = (data) => {
  const required = ['title', 'type', 'file_url'];
  for (const field of required) {
    if (!data[field]) throw new Error(`${field} is required`);
  }
  return true;
};
```

## Indexes

### Required Composite Indexes

| Collection | Fields | Query |
|------------|--------|-------|
| executive_leaders | is_current, display_order | Featured leaders ordered |
| spiritual_resources | is_featured, date_published | Featured resources |
| gallery_items | is_featured, created_at | Featured photos |

Create indexes in Firebase Console:
1. Go to Firestore Database → Indexes
2. Click "Add index"
3. Select collection and fields
4. Set sort order (ascending/descending)

## Related Documentation

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Query Guide](https://firebase.google.com/docs/firestore/query-data/queries)
- [Cloudinary Storage](./CLOUDINARY_STORAGE.md)
