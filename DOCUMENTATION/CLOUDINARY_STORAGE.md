# Cloudinary File Upload & Storage Documentation

## Overview

CSF Website uses **Cloudinary** as its primary file storage service for images, documents, videos, and audio files. Cloudinary provides robust CDN delivery, image optimization, and easy file management through both client-side and server-side APIs.

## Why Cloudinary?

| Feature | Benefit |
|---------|---------|
| **Global CDN** | Fast file delivery worldwide |
| **Image Optimization** | Automatic format conversion (WebP, AVIF) |
| **Responsive Images** | Automatic sizing for different devices |
| **Video/Audio Support** | Stream media efficiently |
| **Transformations** | Resize, crop, filter on-the-fly |
| **Backup & Versioning** | File history and recovery |
| **Security** | Signed URLs, access control |

## Architecture

### Upload Flow
```
Client → FileUpload Component → Cloudinary API → CDN URL → Firestore
```

### Storage Structure
```
csf-mmu/
├── executives/          # Leadership photos
├── gallery/             # Event photos
├── alumni/              # Alumni profile pictures
├── resources/           # Documents, audio, video
│   ├── documents/
│   ├── audio/
│   └── video/
└── testimonials/        # Testimonial photos
```

## Component: FileUpload

### Location
```
components/file-upload.tsx
```

### Features
- Drag & drop support
- Click to upload
- File type validation
- Size limits
- Progress indication
- Preview generation
- Cloudinary upload via API

### Usage
```tsx
import { FileUpload } from "@/components/file-upload";

<FileUpload
  label="Upload Resource"
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024} // 10MB
  onUpload={(url, path) => {
    setFileUrl(url);
    setFilePath(path);
  }}
  folder="resources/documents"
/>
```

### Props Interface
```typescript
interface FileUploadProps {
  label?: string;
  accept?: string;           // File types (e.g., "image/*,.pdf")
  maxSize?: number;          // Max file size in bytes
  onUpload: (url: string, path: string) => void;
  onRemove?: () => void;
  currentUrl?: string;       // Existing file URL
  currentPath?: string;    // Existing file path
  folder?: string;         // Cloudinary folder
  showDelete?: boolean;    // Show delete button
  overwritePath?: string;  // For profile picture updates
}
```

## Upload API Route

### Location
```
app/api/cloudinary/upload/route.ts
```

### Implementation
```typescript
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder || 'csf-mmu',
      resource_type: 'auto',  // Auto-detect file type
      overwrite: true,        // For updates
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
```

## File Types & Constraints

### Supported Types

| Category | Extensions | Max Size | Folder |
|----------|-----------|----------|--------|
| **Images** | .jpg, .jpeg, .png, .gif, .webp | 5MB | `images/` |
| **Documents** | .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx | 10MB | `resources/documents/` |
| **Audio** | .mp3, .wav, .m4a, .ogg | 50MB | `resources/audio/` |
| **Video** | .mp4, .mov, .avi, .webm | 100MB | `resources/video/` |

### Client-Side Validation
```typescript
const validateFile = (file: File, maxSize: number) => {
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'audio/mpeg', 'video/mp4'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported');
  }
};
```

## Cloudinary Configuration

### Environment Variables
```env
# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Next.js Public (for client-side)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Configuration File
```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
```

## Image Optimization

### Automatic Transformations
Cloudinary applies these automatically:

```
Original: https://res.cloudinary.com/demo/image/upload/v1234/photo.jpg
Optimized: https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1234/photo.jpg
```

| Parameter | Description |
|-----------|-------------|
| `f_auto` | Auto-select best format (WebP, AVIF, JPG) |
| `q_auto` | Auto quality optimization |
| `w_800` | Resize to 800px width |
| `c_fill` | Crop to fill dimensions |
| `g_face` | Smart crop to face |

### Usage in Next.js Image
```tsx
import Image from 'next/image';

<Image
  src={photoUrl}  // Cloudinary URL
  alt={leader.name}
  width={400}
  height={400}
  className="object-cover rounded-full"
/>
```

## Profile Picture Uploads (Overwrite Pattern)

For profile pictures (alumni, executives, leadership), use **overwrite** to avoid file accumulation:

```tsx
<FileUpload
  label="Profile Photo"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUpload={(url, path) => {
    setPhotoUrl(url);
    setPhotoPath(path);
  }}
  currentUrl={currentMember?.photo_url}
  overwritePath={currentMember?.photo_path}  // Same path = overwrite
  showDelete={false}  // Disable delete
/>
```

Benefits:
- No orphaned files
- Consistent URL for user
- No deletion errors

## Media Delivery

### Images
```typescript
// With automatic optimization
const optimizedUrl = cloudinary.url(publicId, {
  fetch_format: 'auto',
  quality: 'auto',
  width: 800,
  crop: 'limit',
});
```

### Videos
```typescript
// Video with streaming
const videoUrl = cloudinary.video(publicId, {
  streaming_profile: 'hd',
  format: 'm3u8',  // HLS streaming
});
```

### Audio
```typescript
// Audio file
const audioUrl = cloudinary.url(publicId, {
  resource_type: 'video',  // Audio uses video resource type
  format: 'mp3',
});
```

## Error Handling

### Common Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `File too large` | Exceeds maxSize | Check file size before upload |
| `Invalid file type` | Unsupported format | Validate MIME type |
| `Upload failed` | Network/server error | Retry with exponential backoff |
| `Unauthorized` | Invalid credentials | Check API keys |

### Upload Progress
```typescript
const [progress, setProgress] = useState(0);

const uploadWithProgress = async (file: File) => {
  const xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      setProgress((event.loaded / event.total) * 100);
    }
  };
  
  // ... upload logic
};
```

## Security Best Practices

1. **Server-Side Uploads**
   - Never expose API secret to client
   - Use API routes for uploads
   - Validate file types server-side

2. **Signed URLs**
   ```typescript
   const signedUrl = cloudinary.utils.api_sign_request(
     { public_id: 'sample', version: '1234' },
     process.env.CLOUDINARY_API_SECRET
   );
   ```

3. **Access Control**
   - Set folder-level permissions
   - Use delivery signatures for sensitive files
   - Enable strict transformations

4. **Backup Strategy**
   - Enable automatic backup
   - Maintain offsite copies
   - Version critical files

## Troubleshooting

### Issue: Uploads fail consistently
- Check API credentials
- Verify file size limits
- Check Cloudinary dashboard for quotas

### Issue: Images not displaying
- Verify URL is correct
- Check if file exists in Cloudinary
- Check for CORS issues

### Issue: Slow uploads
- Enable chunking for large files
- Check network connection
- Consider direct browser upload with unsigned presets

## Related Documentation

- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Cloudinary Transformations](https://cloudinary.com/documentation/transformation_reference)
- [File Deletion](./DELETION.md)
- [Download Implementation](./DOWNLOAD_IMPLEMENTATION.md)
