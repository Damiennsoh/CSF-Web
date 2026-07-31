# Admin Dashboard Documentation

## Overview

The CSF Website includes a comprehensive **Admin Dashboard** for managing website content including resources, events, gallery, leadership, and user permissions. The admin interface is built with Next.js, React, and Tailwind CSS with a focus on usability and efficiency.

## Access Control

### Authentication Required
- All admin routes require user authentication
- Users must have `admin` role in Firestore
- Automatic redirect to login if not authenticated

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard home |
| `/admin/resources` | Manage spiritual resources |
| `/admin/events` | Manage events |
| `/admin/gallery` | Manage gallery photos |
| `/admin/leadership` | Manage leadership/execs |
| `/admin/alumni` | Manage alumni |
| `/admin/testimonials` | Manage testimonials |
| `/admin/users` | Manage user permissions |
| `/admin/donations` | Manage donation campaigns |
| `/admin/messages` | View contact messages |

## Admin Guard Hook

### Location
```
hooks/use-admin-guard.ts
```

### Usage
```typescript
import { useAdminGuard } from "@/hooks/use-admin-guard";

export default function AdminPage() {
  const { isAdmin, loading } = useAdminGuard();
  
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return null; // Already redirected
  
  return <AdminContent />;
}
```

### Implementation
```typescript
export function useAdminGuard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isAdminUser = userDoc.data()?.role === "admin";
      
      if (!isAdminUser) {
        router.push("/");
        return;
      }
      
      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, router]);

  return { isAdmin, loading };
}
```

## Admin Action Logging

All admin actions are logged for audit purposes.

### Location
```
lib/admin-logger.ts
```

### Usage
```typescript
import { logAdminAction } from "@/lib/admin-logger";

await logAdminAction(
  user.uid,
  user.email,
  "CREATE_RESOURCE",
  `Added resource: ${resource.title}`
);
```

### Logged Actions
- CREATE_RESOURCE
- UPDATE_RESOURCE
- DELETE_RESOURCE
- CREATE_EVENT
- UPDATE_EVENT
- DELETE_EVENT
- CREATE_LEADER
- UPDATE_LEADER
- DELETE_LEADER
- UPDATE_USER_ROLE
- DELETE_USER

## Common Admin Patterns

### 1. Data Loading

#### Quota-Safe Dashboard Stats

**⚠️ Critical**: Always use `getCountFromServer()` instead of `getDocs()` for counting to avoid quota exhaustion.

```typescript
import { collection, getCountFromServer } from "firebase/firestore";

// ✅ Quota-Safe Implementation
const loadStats = async () => {
  try {
    setLoading(true);
    
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

    // Fetch all counts in parallel (each costs only 1 read!)
    const [
      totalUsers,
      totalEvents,
      totalPrayerRequests,
      totalDonations,
      recentMessages
    ] = await Promise.all([
      safeGetCount("users"),
      safeGetCount("events"),
      safeGetCount("prayer_requests"),
      safeGetCount("donations"),
      safeGetCount("contact_messages")
    ]);

    setStats({
      totalUsers,
      totalEvents,
      totalPrayerRequests,
      totalDonations,
      recentMessages,
    });
  } catch (error) {
    console.error("Error loading stats:", error);
  } finally {
    setLoading(false);
  }
};

// ✅ Correct: Only runs when admin status is confirmed
useEffect(() => {
  if (isAdmin) {
    loadStats();
  }
}, [isAdmin]); // Stable dependency - prevents infinite loops
```

**❌ Wrong Pattern (Causes Quota Exhaustion):**
```typescript
// ❌ NEVER DO THIS - Fetches all documents!
const snapshot = await getDocs(collection(db, "users"));
const count = snapshot.size; // 100 users = 100 reads!

// ❌ NEVER DO THIS - Infinite loop!
useEffect(() => {
  loadStats();
}, [totalUsers, totalEvents]); // Updates trigger re-run!
```

#### Loading Collections
```typescript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

const loadItems = async () => {
  setLoading(true);
  try {
    const q = query(collection(db, "collection_name"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("Error loading items:", error);
    toast({ title: "Error", description: "Failed to load items", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

### 2. Create/Edit Dialog
```typescript
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [currentItem, setCurrentItem] = useState(null);

// Open create dialog
const handleAdd = () => {
  setCurrentItem(null);
  setIsDialogOpen(true);
};

// Open edit dialog
const handleEdit = (item) => {
  setCurrentItem(item);
  setIsDialogOpen(true);
};

// Save handler
const handleSave = async (formData) => {
  if (currentItem) {
    // Update existing
    await updateDoc(doc(db, "collection", currentItem.id), formData);
    await logAdminAction(user.uid, user.email, "UPDATE_ITEM", `Updated: ${formData.title}`);
  } else {
    // Create new
    await addDoc(collection(db, "collection"), formData);
    await logAdminAction(user.uid, user.email, "CREATE_ITEM", `Created: ${formData.title}`);
  }
  setIsDialogOpen(false);
  loadItems();
};
```

### 3. Delete with Confirmation
```typescript
const handleDelete = async (item) => {
  if (!confirm("Are you sure? This action cannot be undone.")) return;
  
  setIsDeleting(true);
  try {
    // Delete file from Cloudinary if exists
    if (item.file_path) {
      await fetch('/api/cloudinary/delete', {
        method: 'POST',
        body: JSON.stringify({ publicId: item.file_path }),
      });
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, "collection", item.id));
    
    await logAdminAction(user.uid, user.email, "DELETE_ITEM", `Deleted: ${item.title}`);
    
    toast({ title: "Success", description: "Item deleted successfully" });
    loadItems();
  } catch (error) {
    toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
  } finally {
    setIsDeleting(false);
  }
};
```

## UI Components

### Admin Layout
```
app/admin/layout.tsx
```
Provides common admin layout with:
- Navigation sidebar
- Header with user info
- Logout button
- Mobile-responsive menu

### Back Button
```
components/admin-back-button.tsx
```
Navigation back button for admin pages.

### File Upload
```
components/file-upload.tsx
```
Cloudinary file upload with:
- Drag & drop
- Progress indicator
- Image preview
- Size validation

### Data Tables
Admin pages use responsive cards for mobile and tables for desktop.

## Admin Dashboard Features

### Resources Admin
- Add/edit/delete resources
- Upload PDFs, audio, video
- Set featured/active status
- Category management

### Events Admin
- Create/edit events
- Date and location
- Registration management
- Featured events

### Gallery Admin
- Upload photos
- Organize by category
- Set featured photos
- Bulk operations

### Leadership Admin
- Add/edit leaders
- Upload profile photos
- Set positions and roles
- Display ordering

### Users Admin
- View all users
- Manage admin roles
- Disable accounts
- View user activity

## Security Best Practices

1. **Always check admin status** on server and client
2. **Log all admin actions** for audit trail
3. **Confirm destructive actions** with modal/dialog
4. **Validate all inputs** before saving to database
5. **Use server timestamps** for all date fields
6. **Implement soft delete** for critical data
7. **Backup regularly** before bulk operations

## Troubleshooting

### Issue: Admin pages not loading
- Check authentication status
- Verify Firestore security rules
- Check browser console for errors

### Issue: Cannot save changes
- Verify user has admin role
- Check Firestore permissions
- Validate form data before submission

### Issue: File uploads failing
- Check Cloudinary credentials
- Verify file size limits
- Check network connectivity

## Related Documentation

- [Firestore Database](./FIRESTORE_DATABASE.md)
- [Cloudinary Storage](./CLOUDINARY_STORAGE.md)
- [File Deletion](./DELETION.md)
