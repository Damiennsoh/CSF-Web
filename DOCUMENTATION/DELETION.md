# File Deletion Documentation

## Overview

The CSF Website implements file deletion through **Cloudinary's destroy API** via server-side API routes. This ensures secure deletion with proper authentication while maintaining a record of deletions in Firestore.

## Architecture

### Server-Side Deletion (Recommended)
```
API Route: app/api/cloudinary/delete/route.ts
Method: POST
```

### Client-Side Flow
1. User initiates delete action
2. Client calls server API with file public_id
3. Server authenticates with Cloudinary
4. Cloudinary deletes file from storage
5. Server returns success/failure response
6. Client updates Firestore document (optional)

## API Route Implementation

### File Location
```
app/api/cloudinary/delete/route.ts
```

### API Interface
```typescript
POST /api/cloudinary/delete

Request Body:
{
  "publicId": "string",     // Cloudinary public ID
  "resourceType": "string"  // image | video | raw
}

Response:
{
  "success": true,
  "result": {
    "result": "ok"
  }
}
```

### Implementation Details

```typescript
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const { publicId, resourceType } = await req.json();
    
    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" }, 
        { status: 400 }
      );
    }

    // Cloudinary destroy with resource type
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'image',
      invalidate: true,  // Clear CDN cache
    });

    if (result.result !== 'ok') {
      return NextResponse.json(
        { error: "Cloudinary delete failed", details: result }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

## Resource Types

Cloudinary supports three resource types for deletion:

| Type | Description | Use Case |
|------|-------------|----------|
| `image` | Photos, graphics | Leadership photos, gallery images |
| `video` | Video files | Sermon videos, event recordings |
| `raw` | Documents, other files | PDFs, Word docs, audio files |

## Client-Side Implementation

### Admin Resources Page
```typescript
// File: app/admin/resources/page.tsx

const handleDeleteResource = async (id: string, filePath?: string) => {
  try {
    // Delete file from Cloudinary if it exists
    if (filePath) {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicId: filePath,
          resourceType: 'auto'
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.warn("Cloudinary deletion failed:", result);
      }
    }

    // Delete from Firestore
    await deleteDoc(doc(db, "spiritual_resources", id));
    
    // Refresh list
    await loadResources();
    
  } catch (error) {
    console.error("Error deleting resource:", error);
  }
};
```

### Profile Picture Uploads
For profile pictures (alumni, executives, leadership), use **overwrite** instead of delete:
- Store the file path in the database
- When uploading new image, use same path
- Cloudinary automatically overwrites
- No deletion needed, avoiding errors

## Security Considerations

### 1. Server-Side Only
- API secret never exposed to client
- All deletion logic handled server-side
- Prevents unauthorized deletions

### 2. Admin Authentication
- Only authenticated admins can delete
- Implement proper auth checks
- Log all deletion actions

### 3. Soft Delete Option
```typescript
// Instead of permanent deletion
await updateDoc(docRef, {
  is_deleted: true,
  deleted_at: serverTimestamp(),
  deleted_by: user.uid
});
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `not found` | File doesn't exist in Cloudinary | Check publicId, continue with DB deletion |
| `unauthorized` | Invalid API credentials | Verify environment variables |
| `resource_type mismatch` | Wrong resource type | Detect correct type from URL |

### Graceful Degradation
```typescript
// Continue with DB deletion even if file deletion fails
const result = await response.json();
if (!result.success) {
  console.warn("File deletion failed, continuing with DB cleanup");
  // Log for manual cleanup later
}
// Always proceed with Firestore deletion
await deleteDoc(docRef);
```

## Best Practices

1. **Always delete file before database record**
   - Prevents orphaned file references
   - Easier to retry file deletion

2. **Log all deletions**
   ```typescript
   await logAdminAction(user.uid, user.email, 'DELETE_RESOURCE', 
     `Deleted: ${resource.title}`);
   ```

3. **Confirm with user**
   ```typescript
   if (!confirm("Are you sure? This cannot be undone.")) return;
   ```

4. **Show loading state**
   - Disable delete button during operation
   - Show progress indicator
   - Handle timeout scenarios

## Admin Logging

All deletions are logged for audit purposes:

```typescript
// lib/admin-logger.ts
export async function logAdminAction(
  userId: string,
  userEmail: string,
  action: string,
  details: string
) {
  await addDoc(collection(db, "admin_logs"), {
    user_id: userId,
    user_email: userEmail,
    action,
    details,
    timestamp: serverTimestamp(),
    ip_address: null, // Add if available
  });
}
```

## Environment Variables

Required for deletion functionality:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Troubleshooting

### Issue: Deletion fails silently
- Check browser console for errors
- Verify API route is returning proper response
- Check Cloudinary dashboard for logs

### Issue: File deleted but still accessible
- CDN cache may still hold file
- Use `invalidate: true` in destroy call
- Wait 1-2 minutes for cache clearing

### Issue: Permission denied
- Verify Firestore security rules
- Check user authentication state
- Confirm admin role/claims

## Related Components

- `app/api/cloudinary/delete/route.ts` - Server API
- `lib/cloudinary.ts` - Cloudinary configuration
- `lib/admin-logger.ts` - Audit logging
- `app/admin/resources/page.tsx` - Implementation example
