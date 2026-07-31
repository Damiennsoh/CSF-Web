# File Upload & Delete System - Unified Implementation

## Overview

All file upload and deletion functionality across the admin dashboard now uses a **unified, consistent implementation** that works reliably across all pages.

## Pages with File Upload/Delete Functionality

### ✅ Profile Picture Management
- **Leadership** (`/admin/leadership`) - Leader profile photos
- **Executives** (`/admin/executives`) - Executive member photos  
- **Alumni** (`/admin/alumni`) - Alumni profile photos
- **About** (`/admin/about`) - About page leader photos

### ✅ Media Management
- **Gallery** (`/admin/gallery`) - Gallery images
- **Events** (`/admin/events`) - Event cover images
- **Ministries** (`/admin/ministries`) - Ministry images and resources

### ✅ Resource Management
- **Resources** (`/admin/resources`) - PDF documents, audio, video files
- **Testimonials** (if applicable) - Testimonial images

## Key Improvements Applied

### 🎯 Extension-Based ResourceType Detection
```typescript
// Smart detection based on file extension (not folder name)
const isImage = currentUrl?.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i);
const isVideo = currentUrl?.match(/\.(mp4|webm|ogg|mov)$/i);
const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';
```

### 🔧 Enhanced Error Handling
```typescript
// Graceful fallback for API failures
catch (error) {
  console.error("Delete error:", error);
  toast({
    title: "File removed locally",
    description: "The file was removed from the form, but may still exist in Cloudinary storage.",
    variant: "default",
  });
  onRemove?.(); // Always remove UI reference
}
```

### 📝 Better Logging
```typescript
console.log("FileUpload Delete Request:", { currentPath, currentUrl });
console.log(`Detected resourceType: ${resourceType}`);
```

## File Type Support

### 🖼️ Images (Default)
- **Extensions**: jpg, jpeg, png, webp, avif, gif, svg
- **Resource Type**: `image`
- **Used For**: Profile pictures, gallery images, event covers

### 🎥 Videos  
- **Extensions**: mp4, webm, ogg, mov
- **Resource Type**: `video`
- **Used For**: Event videos, ministry resources

### 📄 Documents
- **Extensions**: All other extensions (pdf, doc, docx, txt, etc.)
- **Resource Type**: `raw`
- **Used For**: Resources, ministry documents

## Environment Variables Required

### 🔑 Server-Side (No NEXT_PUBLIC_ prefix)
```
CLOUDINARY_CLOUD_NAME=dj0flulwu
CLOUDINARY_API_KEY=558114819297539
CLOUDINARY_API_SECRET=MIlceHFaa6G7tn6hUc0tVHqo4yU
```

### 🌐 Client-Side (With NEXT_PUBLIC_ prefix)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dj0flulwu
NEXT_PUBLIC_CLOUDINARY_API_KEY=558114819297539
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=csf-mullana-web-preset
```

## Troubleshooting Guide

### ❌ "Unknown API key" Error
1. **Check Vercel Environment Variables**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Ensure all 6 variables are added (see above)
   - **Important**: Check for trailing spaces in variable values

2. **Redeploy After Adding Variables**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Select "Redeploy"

### ❌ File Deletion Still Fails
1. **Check Browser Console**
   ```javascript
   // Look for these logs:
   "FileUpload Delete Request:" { currentPath, currentUrl }
   "Detected resourceType: image"
   ```

2. **Verify File Extension**
   - Ensure uploaded files have proper extensions
   - Check that URLs end with .jpg, .png, .webp, etc.

3. **Test Diagnostic Route**
   - Visit: `https://your-domain.vercel.app/api/cloudinary/diagnose`
   - Verify all environment variables are present

### ❌ Upload Works But Delete Fails
- **Cause**: ResourceType detection issue
- **Fix**: The new extension-based detection should resolve this
- **Verify**: Check console logs for "Detected resourceType:"

## Testing Checklist

### ✅ Before Deployment (Local)
1. Upload an image to any admin page
2. Delete the same image
3. Check browser console for success logs
4. Verify file is removed from UI

### ✅ After Deployment (Production)
1. Add environment variables to Vercel
2. Redeploy the application
3. Test upload/delete on production
4. Check diagnostic route: `/api/cloudinary/diagnose`

### ✅ Cross-Page Testing
Test these specific scenarios:
- **Alumni**: Upload/delete profile picture
- **Leadership**: Upload/delete leader photo
- **Gallery**: Upload/delete gallery image
- **Events**: Upload/delete event image
- **Resources**: Upload/delete PDF or video file

## Expected Behavior

### ✅ Successful Upload
- File uploads to Cloudinary
- URL and path stored in database
- Image preview appears in form
- No error messages in console

### ✅ Successful Delete
- File deleted from Cloudinary
- Database reference removed
- UI shows upload area again
- Success toast message appears

### ✅ Graceful Fallback
- If Cloudinary delete fails, UI still updates
- Clear error message shown to user
- File reference removed from database
- Console shows detailed error information

## Benefits of Unified Implementation

1. **🎯 Consistency**: Same behavior across all admin pages
2. **🔧 Reliability**: Extension-based detection prevents resource type errors
3. **📝 Debugging**: Enhanced logging for easier troubleshooting
4. **🛡️ Error Handling**: Graceful fallbacks ensure UI always works
5. **🚀 Performance**: Optimized file type detection
6. **🔍 Visibility**: Clear console logs for debugging

## File Structure

```
components/
├── file-upload.tsx          # Unified component (updated)
├── ui/
│   ├── dialog.tsx
│   ├── toast.tsx
│   └── ...

app/api/cloudinary/
├── delete/route.ts          # Server-side delete API
├── diagnose/route.ts        # Diagnostic endpoint
└── ...

lib/
├── cloudinary-storage.ts    # Upload logic
├── cloudinary.ts            # SDK configuration
└── ...
```

This unified system ensures that file upload and deletion works consistently and reliably across all admin pages, with proper error handling and debugging capabilities.
