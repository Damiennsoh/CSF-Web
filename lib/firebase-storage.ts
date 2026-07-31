import { storage } from "./firebase"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"

export interface UploadOptions {
  bucket?: string
  folder?: string
  maxSize?: number
  allowedTypes?: string[]
}

export class FirebaseStorageService {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
    "application/pdf",
    "audio/mpeg",
    "audio/wav",
    "video/mp4"
  ]

  static async uploadFile(
    file: File,
    options: UploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; path: string }> {
    const {
      folder,
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES
    } = options

    // Validate file
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }

    // Generate unique file name and keep everything under /uploads/**
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Always store inside the "uploads" root to match Firebase Storage rules
    const baseFolder =
      folder && folder.trim().length > 0
        ? folder.startsWith("uploads/") || folder === "uploads"
          ? folder
          : `uploads/${folder}`
        : "uploads"

    const filePath = `${baseFolder}/${fileName}`

    const storageRef = ref(storage!, filePath)
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (onProgress) onProgress(progress)
        },
        (error) => {
          // Provide error code + message for easier debugging (e.g., rules, network, permission)
          const code = (error && (error.code || error?.name)) || "unknown"
          reject(new Error(`Upload failed (${code}): ${error.message || error}`))
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve({ url, path: filePath })
        }
      )
    })
  }

  static async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage!, path)
    try {
      await deleteObject(storageRef)
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== "storage/object-not-found") {
        throw new Error(`Delete failed: ${error.message}`)
      }
    }
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const ext = this.getFileExtension(filename.split('?')[0]) // Handle URLs with query params
    return imageExtensions.includes(ext)
  }

  static isPdfFile(filename: string): boolean {
    return this.getFileExtension(filename.split('?')[0]) === 'pdf'
  }

  static isAudioFile(filename: string): boolean {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a']
    return audioExtensions.includes(this.getFileExtension(filename.split('?')[0]))
  }

  static isVideoFile(filename: string): boolean {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv']
    return videoExtensions.includes(this.getFileExtension(filename.split('?')[0]))
  }
}
