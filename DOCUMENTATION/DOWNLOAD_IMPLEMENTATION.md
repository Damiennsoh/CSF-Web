# Download Implementation Documentation

## Overview

The CSF Website implements a **reusable DownloadButton component** that provides consistent file download functionality across all resource pages. This component handles Cloudinary file downloads with proper attachment flags and file type mapping.

## Component Location

```
components/ui/download-button.tsx
```

## Component Interface

```typescript
interface DownloadButtonProps {
  fileUrl: string;      // URL of the file to download
  fileName: string;     // Name for the downloaded file
  fileType?: string;    // Type of file (pdf, video, audio, etc.)
  className?: string;   // Additional CSS classes
  variant?: "default" | "secondary" | "outline";  // Button style
  size?: "sm" | "default" | "lg";  // Button size
}
```

## Features

### 1. Cloudinary Integration
- Automatically adds `fl_attachment` flag to Cloudinary URLs
- Forces browser to download instead of preview
- Maintains original filename with safe characters

### 2. File Type Support
The component maps file types to proper extensions:

| File Type | Extension |
|-----------|-----------|
| pdf | .pdf |
| document/docx | .docx |
| video/mp4 | .mp4 |
| audio/mp3 | .mp3 |
| image/jpg/jpeg/png | .jpg |
| powerpoint/pptx | .pptx |
| excel/xlsx | .xlsx |
| text/txt | .txt |

### 3. Loading States
- Shows "Downloading..." text during download
- Animated bounce icon during download
- Disabled state prevents multiple clicks

### 4. Styling Variants
- **default**: Blue background, white text
- **secondary**: White/gray background, dark text
- **outline**: Bordered button with hover effects

## Usage Examples

### Basic Usage
```tsx
import DownloadButton from "@/components/ui/download-button";

<DownloadButton 
  fileUrl={resource.file_url}
  fileName={resource.title}
  fileType={resource.file_type}
/>
```

### With Size and Variant
```tsx
<DownloadButton 
  fileUrl={image.image_url}
  fileName={image.title}
  fileType="image"
  size="sm"
  variant="secondary"
  className="bg-white/90 hover:bg-white"
/>
```

### Full Width Button
```tsx
<DownloadButton 
  fileUrl={resource.file_url}
  fileName={resource.title}
  fileType={resource.file_type}
  className="w-full mt-4"
/>
```

## Implementation Details

### Download Process
1. Validates file URL exists
2. Sets loading state to true
3. Modifies Cloudinary URL with `fl_attachment` flag
4. Creates temporary anchor element
5. Sets download filename with proper extension
6. Programmatically triggers click
7. Cleans up DOM element
8. Resets loading state

### Cloudinary URL Transformation
```
Before: https://res.cloudinary.com/.../upload/v1234/filename.pdf
After:  https://res.cloudinary.com/.../upload/fl_attachment/filename.pdf
```

### Filename Sanitization
- Removes special characters
- Converts spaces to underscores
- Lowercase transformation
- Appends correct file extension

## Pages Using DownloadButton

| Page | File Path | Usage |
|------|-----------|-------|
| Spiritual Resources | `app/spiritual-resources/page.tsx` | Resource cards |
| Resources | `app/resources/page.tsx` | Resource grid |
| Gallery | `app/gallery/page.tsx` | Image download on hover |

## Error Handling

- Graceful failure if download fails
- Console error logging for debugging
- Button remains functional after error
- Disabled state when no file URL provided

## Future Enhancements

- [ ] Add download progress tracking
- [ ] Implement download count analytics
- [ ] Add support for bulk downloads
- [ ] Add file size display before download
- [ ] Support for password-protected files
