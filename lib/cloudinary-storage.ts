export interface CloudinaryUploadOptions {
  folder?: string
  maxSize?: number
  allowedTypes?: string[]
  resourceType?: 'image' | 'video' | 'raw' | 'auto'
  publicId?: string // For overwriting existing images
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  resourceType: string
  format: string
  bytes: number
}

export class CloudinaryStorageService {
  private static readonly DEFAULT_MAX_SIZE = 50 * 1024 * 1024 // 50MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "audio/mpeg",
    "audio/wav",
    "audio/mp3",
    "video/mp4",
    "video/quicktime"
  ]

  static initialize() {
    // Cloudinary config is handled via environment variables
    // No client-side initialization needed for unsigned uploads
  }

  static async uploadFile(
    file: File,
    options: CloudinaryUploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResult> {
    const {
      folder,
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES,
      resourceType = 'auto'
    } = options

    // Validate file
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }

    // Determine resource type based on file
    let determinedResourceType: 'image' | 'video' | 'raw' | 'auto' = resourceType
    if (file.type.startsWith('image/')) {
      determinedResourceType = 'image'
    } else if (file.type.startsWith('video/')) {
      determinedResourceType = 'video'
    } else {
      determinedResourceType = 'raw'
    }

    // Create FormData for upload
    const formData = new FormData()
    formData.append('file', file)
    
    // Use a simpler folder structure to avoid potential issues
    const safeFolder = folder === 'leaders' ? 'leadership' : (folder || 'csf-website')
    formData.append('folder', safeFolder)
    
    // Add public_id if provided (for overwriting existing images)
    if (options.publicId) {
      formData.append('public_id', options.publicId)
    }
    
    // Try the configured upload preset first, then fallback
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'csf-mullana-web-preset'
    formData.append('upload_preset', uploadPreset)

    try {
      // Log environment variables for debugging (without exposing secrets)
      console.log("Cloudinary Upload Debug:", {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        originalFolder: folder,
        safeFolder: safeFolder,
        fileSize: file.size,
        fileType: file.type,
        resourceType: determinedResourceType,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`
      })

      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined in environment variables')
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      console.log("Cloudinary Response Status:", response.status)
      console.log("Cloudinary Response Headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Cloudinary Error Response:", errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { message: errorText }
        }
        
        // Handle specific Cloudinary errors
        if (error.message?.includes('cloud name disabled') || error.error?.message?.includes('cloud name disabled')) {
          throw new Error('Cloudinary account is disabled or suspended. Please check your Cloudinary account status, billing, and verify the cloud name is correct.')
        }
        
        if (error.message?.includes('upload preset') || error.error?.message?.includes('upload preset')) {
          throw new Error('Cloudinary upload preset is invalid or disabled. Please check your upload preset configuration.')
        }
        
        if (error.message?.includes('api key') || error.error?.message?.includes('api key')) {
          throw new Error('Cloudinary API key is invalid or disabled. Please check your API key configuration.')
        }
        
        if (error.message?.includes('folder') || error.error?.message?.includes('folder')) {
          throw new Error('Cloudinary folder permissions issue. The folder may not exist or access may be restricted.')
        }
        
        throw new Error(`Upload failed: ${error.message || error.error?.message || 'Unknown error'}`)
      }

      const result = await response.json()
      console.log("Cloudinary Upload Success:", result)
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes
      }
    } catch (error: any) {
      console.error("Cloudinary Upload Error Details:", {
        error: error,
        message: error?.message,
        stack: error?.stack,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      })
      
      // If it's a cloud name disabled error, try with a different approach
      if (error?.message?.includes('cloud name disabled')) {
        console.log("Attempting fallback upload without folder restriction...")
        try {
          const fallbackFormData = new FormData()
          fallbackFormData.append('file', file)
          fallbackFormData.append('upload_preset', 'ml_default') // Try default preset
          
          const fallbackResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
            {
              method: 'POST',
              body: fallbackFormData,
            }
          )
          
          if (fallbackResponse.ok) {
            const result = await fallbackResponse.json()
            console.log("Cloudinary Fallback Upload Success:", result)
            return {
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
              format: result.format,
              bytes: result.bytes
            }
          }
        } catch (fallbackError) {
          console.error("Fallback upload also failed:", fallbackError)
        }
      }
      
      throw new Error(`Cloudinary upload failed: ${error?.message || error || 'Unknown error'}`)
    }
  }

  static async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
    try {
      // Check if we're on client-side (browser) where server-side env vars aren't available
      if (typeof window !== 'undefined') {
        console.warn("Delete operation attempted from client-side - this may not work due to missing server-side credentials")
      }
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            timestamp: Math.floor(Date.now() / 1000)
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Cloudinary Delete Error Response:", errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { message: errorText }
        }
        
        // Handle specific Cloudinary delete errors
        if (error.message?.includes('api key') || error.error?.message?.includes('api key')) {
          throw new Error('Cloudinary delete failed: API key is invalid or missing server-side credentials. This operation requires server-side execution.')
        }
        
        if (error.message?.includes('not found') || error.error?.message?.includes('not found')) {
          console.warn('File not found on Cloudinary, may have been already deleted')
          return // Don't throw error for already deleted files
        }
        
        throw new Error(`Delete failed: ${error.message || error.error?.message || 'Unknown error'}`)
      }

      const result = await response.json()
      
      if (result.result !== 'ok') {
        throw new Error(`Delete failed: ${result.error?.message || 'Unknown error'}`)
      }
      
      console.log("Cloudinary Delete Success:", result)
    } catch (error: any) {
      console.error("Cloudinary Delete Error Details:", {
        error: error,
        message: error?.message,
        stack: error?.stack,
        publicId: publicId,
        resourceType: resourceType,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasSecret: !!process.env.CLOUDINARY_API_SECRET,
        isClientSide: typeof window !== 'undefined'
      })
      throw new Error(`Cloudinary delete failed: ${error?.message || error || 'Unknown error'}`)
    }
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const ext = this.getFileExtension(filename.split('?')[0])
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

  static getPublicIdFromUrl(url: string): string {
    // Extract public_id from Cloudinary URL
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)$/)
    return matches ? matches[1] : ''
  }

  static getResourceTypeFromUrl(url: string): string {
    // Extract resource type from Cloudinary URL
    if (url.includes('/video/')) return 'video'
    if (url.includes('/image/')) return 'image'
    if (url.includes('/raw/')) return 'raw'
    return 'image'
  }
}
