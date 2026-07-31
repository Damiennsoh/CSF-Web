"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Upload, X, File, Image, FileText, Music, Video, Loader2 } from "lucide-react"
import { CloudinaryStorageService, CloudinaryUploadOptions } from "@/lib/cloudinary-storage"

interface FileUploadProps {
  label: string
  accept?: string
  maxSize?: number
  allowedTypes?: string[]
  onUpload: (url: string, path: string) => void
  onRemove?: () => void
  currentUrl?: string
  currentPath?: string
  folder: string
  bucket?: string
  overwritePath?: string // New prop for overwriting existing images
  className?: string
  showDelete?: boolean // Control delete button visibility
}

export function FileUpload({
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  onUpload,
  onRemove,
  currentUrl,
  currentPath,
  overwritePath,
  label = "Upload file",
  className = "",
  folder,
  allowedTypes,
  showDelete = true // Default to true for backward compatibility
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const getFileIcon = (filename: string) => {
    if (CloudinaryStorageService.isImageFile(filename)) return Image
    if (CloudinaryStorageService.isPdfFile(filename)) return FileText
    if (CloudinaryStorageService.isAudioFile(filename)) return Music
    if (CloudinaryStorageService.isVideoFile(filename)) return Video
    return File
  }

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)
    
    try {
      const uploadOptions: CloudinaryUploadOptions = {
        folder,
        maxSize,
        allowedTypes
      }

      // If we have an overwritePath, use it to overwrite the existing image
      if (overwritePath) {
        uploadOptions.publicId = overwritePath
      }

      const result = await CloudinaryStorageService.uploadFile(file, uploadOptions, (p: number) => {
        setProgress(p)
      })
      
      onUpload(result.url, result.publicId)
      setUploading(false)
      setProgress(0)
      
      toast({
        title: "Upload Complete",
        description: overwritePath ? "Profile picture updated successfully." : "File uploaded successfully.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      setUploading(false)
      setProgress(0)
      // Surface more helpful error messages when possible
      const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'An error occurred during upload')
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      })
    }
  }, [maxSize, onUpload, folder, allowedTypes])

  const handleRemove = async () => {
    if (currentPath) {
      console.log("FileUpload Delete Request:", { currentPath, currentUrl });
      
      try {
        // 1. Detect resource type by file extension for accuracy
        const isImage = currentUrl?.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i);
        const isVideo = currentUrl?.match(/\.(mp4|webm|ogg|mov)$/i);
        const isDocument = currentUrl?.match(/\.(pdf|doc|docx|txt)$/i);
        
        // Determine correct resource type for Cloudinary
        let resourceType = 'raw'; // Default for documents and other files
        if (isImage) {
          resourceType = 'image';
        } else if (isVideo) {
          resourceType = 'video';
        }

        console.log(`Detected resourceType: ${resourceType} for file: ${currentPath}`);

        // 2. Call server-side delete API with correct resource type
        const response = await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicId: currentPath,
            resourceType: resourceType // Send correct resource type
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            toast({
              title: "File removed",
              description: "File deleted successfully.",
            });
            onRemove?.();
          } else {
            throw new Error(result.error || 'Delete failed');
          }
        } else {
          const errorText = await response.text();
          console.error("Delete API Error Response:", errorText);
          throw new Error(`Server delete failed: ${response.status}`);
        }
      } catch (error) {
        console.error("Delete error:", error);
        
        // Fallback: Remove the UI reference even if the server-side deletion fails
        toast({
          title: "File removed locally",
          description: "The file was removed from the form, but may still exist in Cloudinary storage.",
          variant: "default",
        });
        onRemove?.();
      }
    } else {
      onRemove?.();
    }
  };

  const renderFilePreview = () => {
    if (!currentUrl) return null

    const isImage = CloudinaryStorageService.isImageFile(currentUrl)
    const FileIcon = getFileIcon(currentUrl)

    if (isImage) {
      return (
        <div className="relative group">
          <div 
            className="cursor-pointer"
            onClick={() => document.getElementById('file-upload-input')?.click()}
            title="Click to replace image"
          >
            <img 
              src={currentUrl} 
              alt="Current file" 
              className="w-full h-32 object-cover rounded-lg border shadow-sm group-hover:opacity-90 transition-opacity hover:border-red-400"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg'
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {showDelete && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              title="Delete file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="relative border rounded-lg p-4 flex items-center gap-3 bg-white">
        <FileIcon className="h-8 w-8 text-red-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentUrl.split('/').pop()?.split('?')[0]}
          </p>
          <p className="text-[10px] text-gray-500">Tap X to delete</p>
        </div>
        {showDelete && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleRemove}
            title="Delete file"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label} <span className="text-gray-400 font-normal normal-case">(optional)</span></Label>
      
      {currentUrl ? (
        renderFilePreview()
      ) : (
        <div className="relative border-2 border-dashed border-red-200 rounded-xl p-6 sm:p-10 text-center hover:border-red-400 hover:bg-red-50 transition-all cursor-pointer"
             onClick={() => document.getElementById('file-upload-input')?.click()}>
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
              <p className="text-xs font-medium text-red-600">Uploading... {Math.round(progress)}%</p>
              <Progress value={progress} className="w-full max-w-[200px] mt-4 h-1.5" />
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-10 w-10 text-red-300 mb-4" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Tap to upload file</p>
                <p className="text-[10px] text-gray-400">Max size: {Math.round(maxSize / 1024 / 1024)}MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        id="file-upload-input"
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        style={{ display: 'none' }}
      />
    </div>
  )
}
