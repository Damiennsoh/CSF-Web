# File Upload & Storage Guide

## Quick Start

### Uploading Files to Each Section

#### 1. Resources Page (`/admin/resources`)
**Purpose**: Store spiritual documents, sermons, audio, and video content

**File Types Allowed**:
- Documents: PDF, DOC, DOCX, TXT (max 50MB)
- Audio: MP3, WAV (max 50MB)
- Video: MP4 (max 50MB)

**Steps**:
1. Click "Add Resource" button
2. Enter title, description, and select type (Document/Audio/Video)
3. Choose category (e.g., Sermons, Bible Studies, Prayers)
4. Tap "Resource File" upload zone to select file
5. Check "Featured" to show on homepage preview
6. Check "Active" to make publicly available
7. Click "Add Resource"

**Sync**: Changes appear on `/resources` page and homepage preview immediately

---

#### 2. Gallery Page (`/admin/gallery`)
**Purpose**: Store event photos, worship images, outreach pictures

**File Types Allowed**:
- Images only: JPG, PNG, GIF, WebP (max 5MB)

**Steps**:
1. Click "Upload Photo" button
2. Enter title and description
3. Select category (Events, Worship, Outreach, etc.)
4. Tap image upload area and select photo
5. Set display order (controls image sequence)
6. Check "Featured" to show on homepage
7. Check "Active" to display
8. Click "Upload Photo"

**Sync**: Gallery updates on `/gallery` page and homepage section instantly

---

#### 3. Events Page (`/admin/events`)
**Purpose**: Create upcoming fellowship events

**Optional Image**:
- Images: JPG, PNG (max 5MB) - OPTIONAL
- If not provided, event displays without image

**Steps**:
1. Click "Add Event"
2. Enter event title, description, date, time, location
3. Optionally upload event thumbnail/banner
4. Check "Featured" to promote on homepage
5. Click "Add Event"

**Sync**: Event appears on `/events` page and homepage events section

---

#### 4. Ministries Page (`/admin/ministries`)
**Purpose**: Manage ministry groups (Women's, Men's, Choir, etc.)

**Files**:
- Ministry Logo/Image: JPG, PNG (max 5MB) - OPTIONAL
- Ministry Resource: Any type (max 50MB) - OPTIONAL

**Steps**:
1. Click "Add Ministry"
2. Enter ministry name and description
3. Optionally upload ministry logo
4. Optionally upload ministry resource document
5. Check "Active" to enable
6. Click "Save"

**Sync**: Ministry appears on `/ministries` page and homepage

---

#### 5. Alumni, Testimonials, Leadership
These pages use **optional image fields** where admins can add profile photos:

**Alumni** (`/admin/alumni`):
- Optional profile image (JPG, PNG)
- Set `is_featured: true` to show on homepage

**Testimonials** (`/admin/testimonials`):
- Optional profile photo
- Set `is_featured: true` for homepage display

**Leadership** (`/admin/leadership`):
- Optional leader profile image
- Set `is_current: true` to include in current leaders

---

## Storage Structure

Files are organized in Firebase Storage:

```
uploads/
├── gallery/
│   ├── 1705432109-abc123.jpg     (Gallery images)
│   └── 1705432156-xyz789.png
├── resources/
│   ├── 1705432201-pdf456.pdf     (Documents, audio, video)
│   ├── 1705432267-audio789.mp3
│   └── 1705432334-video123.mp4
├── events/
│   └── 1705432401-event456.jpg   (Event images)
├── ministries/
│   ├── 1705432468-min789.jpg     (Ministry logos)
│   └── 1705432535-min.pdf        (Ministry resources)
└── alumni-images/
    └── 1705432602-alumni123.jpg  (Alumni photos)
```

**Note**: Files are renamed with timestamps + random strings to avoid conflicts and ensure uniqueness.

---

## Firestore Database Fields

### Gallery Items
```javascript
{
  title: "Easter Celebration",
  description: "Our fellowship gathering",
  image_url: "https://...",      // Public download URL
  image_path: "uploads/gallery/...", // Storage reference
  category: "Events",
  is_featured: true,              // Show on homepage
  is_active: true,                // Display on site
  display_order: 1                // Sequence (lower = first)
}
```

### Resources
```javascript
{
  title: "Sunday Sermon",
  description: "Weekly teaching",
  file_url: "https://...",        // Public download URL
  file_path: "uploads/resources/...",
  type: "audio",                  // document|audio|video
  category: "Sermons",
  is_featured: true,              // Show on homepage
  is_active: true
}
```

### Events
```javascript
{
  title: "Prayer Night",
  description: "Community prayer meeting",
  imageUrl: "https://...",        // Optional
  imagePath: "uploads/events/...",
  eventDate: "2024-12-25",
  time: "19:00",
  location: "Main Hall",
  isActive: true,
  isFeatured: true                // Show on homepage
}
```

---

## Mobile Usage Tips

### On Smartphones
1. **Landscape Orientation**: Better for preview before upload
2. **File Picker**: Tap upload zone - allows camera or photo library
3. **Progress**: Watch percentage bar during upload
4. **Preview**: Swipe to see uploaded content after upload

### File Size Recommendations
- **Gallery Images**: Keep under 3MB (loads faster on mobile)
- **Resources**: Split large files if possible (easier mobile downloads)
- **Videos**: 50MB max, but keep under 20MB for smooth mobile playback

---

## Troubleshooting

### "File too large" error
- Check file size against type limit
- Gallery images: 5MB max
- Documents/Audio/Video: 50MB max

### "File type not allowed"
- Ensure correct file format
- Use: JPG, PNG for images
- Use: PDF, DOC for documents
- Use: MP3, WAV for audio
- Use: MP4 for video

### Upload stuck/slow
- Check internet connection
- Try smaller file (test with < 2MB)
- Wait for progress bar to complete
- Refresh page if upload seems stuck

### Changes not showing on homepage
- Ensure "is_featured" is checked in admin
- Ensure "is_active" is checked
- Wait 5 seconds for real-time sync
- Refresh homepage browser tab

### Image shows as broken link
- Check if file is still in Firebase Storage
- Verify image_url is correct in Firestore
- Try re-uploading image
- Check image file isn't corrupted

---

## Security Notes

- **Private URLs**: All downloads require user access
- **File Type Validation**: System blocks non-allowed types automatically
- **Size Limits**: Enforced to prevent abuse
- **Automatic Cleanup**: Deleting content in admin removes from Firebase too
- **Unique Filenames**: Prevents overwrites and conflicts

---

## Best Practices

### Images
- ✅ Use JPG for photos (smaller file size)
- ✅ Use PNG for logos/graphics (transparency support)
- ✅ Optimize image size before upload (reduce quality to 80%)
- ✅ Landscape orientation for events (better on mobile)

### Documents
- ✅ Use PDF for final documents (consistent display)
- ✅ Add cover page with title
- ✅ Compress PDF before upload

### Audio
- ✅ Use MP3 format (universal compatibility)
- ✅ 128kbps bitrate is good quality-to-size ratio
- ✅ Add metadata (artist, album) before upload

### Videos
- ✅ Use MP4 format (works on all devices)
- ✅ Keep under 20MB for mobile users
- ✅ 720p resolution balances quality and size

---

## For Developers

### Adding File Upload to New Page

```typescript
import { FileUpload } from "@/components/file-upload"

export default function MyPage() {
  const [fileUrl, setFileUrl] = useState<string>()
  const [filePath, setFilePath] = useState<string>()

  return (
    <FileUpload
      label="Upload my file"
      accept="image/*,application/pdf"
      maxSize={5 * 1024 * 1024}  // 5MB
      onUpload={(url, path) => {
        setFileUrl(url)
        setFilePath(path)
      }}
      onRemove={() => {
        setFileUrl(undefined)
        setFilePath(undefined)
      }}
      currentUrl={fileUrl}
      currentPath={filePath}
      folder="my-content"         // Creates uploads/my-content/
    />
  )
}
```

### File Types Reference
```typescript
// Service automatically detects:
isImageFile(filename)    // jpg, jpeg, png, gif, webp
isPdfFile(filename)      // pdf
isAudioFile(filename)    // mp3, wav
isVideoFile(filename)    // mp4
```
