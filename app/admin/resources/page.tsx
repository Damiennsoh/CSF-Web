"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DeleteButton } from "@/components/ui/delete-button"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { logAdminAction } from "@/lib/admin-logger"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"
import { FirebaseStorageService } from "@/lib/firebase-storage"
import Link from "next/link"
import { Music, Video, FileText, Plus, Shield } from "lucide-react"

interface Resource {
  id: string
  title: string
  description: string
  type: "document" | "audio" | "video"
  file_url: string
  file_path: string
  category: string
  is_featured: boolean
  is_active: boolean
  author?: string
  date_published?: any
  created_at: string
  updated_at: string
}

export default function ResourcesManagement() {
  const { user, isAdmin } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingResource, setIsAddingResource] = useState(false)
  const [isEditingResource, setIsEditingResource] = useState(false)
  const [currentResource, setCurrentResource] = useState<Resource | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [resourceFileUrl, setResourceFileUrl] = useState<string | undefined>(undefined)
  const [resourceFilePath, setResourceFilePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (user && isAdmin) {
      loadResources()
    }
  }, [user, isAdmin])

  const loadResources = async () => {
    setLoading(true)
    toast({
      title: "Loading...",
      description: "Please wait while we load the resources.",
    })

    try {
      console.log("[ResourcesAdmin] Starting to load resources...")
      console.log("[ResourcesAdmin] Firebase ready:", !!db)
      
      // Try multiple collection names that might exist
      const collectionNames = ["spiritual_resources", "resources", "spiritualResources"]
      let data: Resource[] = []
      
      for (const collectionName of collectionNames) {
        try {
          console.log(`[ResourcesAdmin] Trying collection: ${collectionName}`)
          if (!db) {
            console.error("[ResourcesAdmin] Firestore db not initialized")
            continue
          }
          const colRef = collection(db, collectionName)
          const q = query(colRef, orderBy("createdAt", "desc"), limit(50))
          const querySnapshot = await getDocs(q)
          
          console.log(`[ResourcesAdmin] Found ${querySnapshot.docs.length} documents in ${collectionName}`)
          
          if (querySnapshot.docs.length > 0) {
            data = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Resource[]
            console.log("[ResourcesAdmin] Successfully loaded resources:", data.length)
            break // Found data, stop trying other collections
          }
        } catch (collectionError) {
          console.warn(`[ResourcesAdmin] Collection ${collectionName} failed:`, collectionError)
          continue
        }
      }

      setResources(data)
      
      if (data.length === 0) {
        console.log("[ResourcesAdmin] No resources found in any collection")
        toast({
          title: "No Resources",
          description: "No resources found. You can add your first resource using the button above.",
        })
      }
    } catch (error) {
      console.error("[ResourcesAdmin] Error loading resources:", error)
      toast({
        title: "Error",
        description: "Failed to load resources. Please check console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    // File upload is now optional
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    setIsUpdating(true)
    console.log("[ResourcesAdmin] Attempting to add resource:", {
      title: formData.get("title"),
      file_url: resourceFileUrl
    })

    try {
      console.log("[ResourcesAdmin] Attempting to add resource...")
      const typeValue = formData.get("type") as string

      // Map admin type to public resource fields
      const fileType =
        typeValue === "audio" ? "audio" : typeValue === "video" ? "video" : "pdf"

      const resourceData = {
        title: formData.get("title"),
        description: formData.get("description"),
        // admin-facing type
        type: typeValue,
        // public pages expect these fields
        resource_type: typeValue,
        file_type: fileType,
        content_url: null,
        file_url: resourceFileUrl,
        file_path: resourceFilePath,
        category: formData.get("category"),
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        author: user?.email || "CSF Team",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        date_published: serverTimestamp(),
      }

      console.log("[ResourcesAdmin] Resource data:", resourceData)

      if (!db) throw new Error("Firestore db not initialized")
      const docRef = await addDoc(collection(db, "spiritual_resources"), resourceData)
      console.log("[ResourcesAdmin] Firestore document created with ID:", docRef.id)
      await loadResources()
      
      if (user) {
        await logAdminAction(
          user.uid,
          user.email || "Unknown",
          "CREATE_RESOURCE",
          `Added resource: ${formData.get("title")} (${formData.get("type")})`
        )
      }

      setIsAddingResource(false)
      setResourceFileUrl(undefined)
      setResourceFilePath(undefined)
      toast({
        title: "Success",
        description: "Resource added successfully.",
      })
    } catch (error) {
      console.error("Error adding resource:", error)
      toast({
        title: "Error",
        description: "Failed to add resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentResource) return

    setIsUpdating(true)
    toast({
      title: "Updating...",
      description: "Please wait while we update the resource.",
    })

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      const typeValue = (formData.get("type") as string) || currentResource.type
      const fileType =
        typeValue === "audio" ? "audio" : typeValue === "video" ? "video" : "pdf"

      if (!db) throw new Error("Firestore db not initialized")
      const resourceRef = doc(db, "spiritual_resources", currentResource.id)
      await updateDoc(resourceRef, {
        title: formData.get("title"),
        description: formData.get("description"),
        type: typeValue,
        resource_type: typeValue,
        file_type: fileType,
        file_url: resourceFileUrl || currentResource.file_url,
        file_path: resourceFilePath || currentResource.file_path,
        category: formData.get("category"),
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        author: currentResource.author || user?.email || "CSF Team",
        updatedAt: serverTimestamp(),
        date_published: currentResource.date_published || serverTimestamp(),
      })

      await loadResources()
      setIsEditingResource(false)
      setCurrentResource(null)
      setResourceFileUrl(undefined)
      setResourceFilePath(undefined)
      toast({
        title: "Success",
        description: "Resource updated successfully.",
      })
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Error",
        description: "Failed to update resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteResource = async (id: string, filePath?: string) => {
    setIsUpdating(true)
    toast({
      title: "Deleting...",
      description: "Please wait while we delete the resource.",
    })

    try {
      // Delete file from Cloudinary if it exists
      if (filePath) {
        const response = await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            publicId: filePath,
            resourceType: 'auto' // Let Cloudinary auto-detect the resource type
          }),
        });

        const result = await response.json();
        if (!result.success) {
          console.warn("Cloudinary deletion failed:", result);
        } else {
          console.log("Cloudinary deletion successful:", result);
        }
      }

      // Delete from database
      if (!db) throw new Error("Firestore db not initialized")
      await deleteDoc(doc(db, "spiritual_resources", id))

      await loadResources()
      setIsEditingResource(false)
      toast({
        title: "Success",
        description: "Resource deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentResource) return

    setIsUpdating(true)
    toast({
      title: "Updating...",
      description: "Please wait while we update the resource.",
    })

    try {
      const formData = new FormData(e.currentTarget)
      const updateData: any = {
        title: formData.get('title'),
        type: formData.get('type'),
        category: formData.get('category'),
        description: formData.get('description'),
        is_active: formData.get('is_active') === 'true',
        is_featured: formData.get('is_featured') === 'true',
        updated_at: new Date().toISOString(),
      }

      // Update file URL if a new file was uploaded
      if (resourceFileUrl && resourceFileUrl !== currentResource.file_url) {
        updateData.file_url = resourceFileUrl
        updateData.file_path = resourceFilePath
        
        // Delete old file from storage
        if (currentResource.file_path) {
          await FirebaseStorageService.deleteFile(currentResource.file_path)
        }
      }

      // Update in database
      if (!db) throw new Error("Firestore db not initialized")
      await updateDoc(doc(db, "spiritual_resources", currentResource.id), updateData)

      await loadResources()
      toast({
        title: "Success",
        description: "Resource updated successfully.",
      })

      // Reset form
      setIsEditingResource(false)
      setCurrentResource(null)
      setResourceFileUrl(undefined)
      setResourceFilePath(undefined)
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Error",
        description: "Failed to update resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "audio":
        return Music
      case "video":
        return Video
      default:
        return FileText
    }
  }

  const getFileAccept = (type: string) => {
    switch (type) {
      case "audio":
        return "audio/*"
      case "video":
        return "video/*"
      default:
        return ".pdf,.doc,.docx,.txt"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resources management...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-[32px] shadow-xl">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-gray-500 font-medium mb-6">You need administrator privileges to access this area.</p>
          <Button asChild className="bg-gray-900 rounded-2xl px-8 py-6">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AdminBackButton iconOnly />
        <div className="mb-8 mt-4">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">Resources <span className="text-blue-600">Management</span></h1>
          <p className="mt-2 text-gray-600 font-medium">Manage spiritual resources, documents, audio, and video content</p>
        </div>

        <div className="mb-8">
          <Dialog open={isAddingResource} onOpenChange={setIsAddingResource}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 px-8 font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                <Plus className="h-5 w-5 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-[32px] overflow-hidden p-0 border-0">
              <div className="bg-gray-900 p-6 sm:p-8 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Add New Resource</DialogTitle>
                  <DialogDescription className="text-gray-400">Upload a new spiritual resource for the community</DialogDescription>
                </DialogHeader>
              </div>
              <form onSubmit={handleAddResource} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Title</Label>
                    <Input id="title" name="title" required className="h-12 rounded-xl bg-gray-50 border-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Type</Label>
                    <Select name="type" required>
                      <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-100">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document (PDF/DOC)</SelectItem>
                        <SelectItem value="audio">Audio (MP3)</SelectItem>
                        <SelectItem value="video">Video (MP4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Sermons, Bible Studies" required className="h-12 rounded-xl bg-gray-50 border-gray-100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Description</Label>
                  <Textarea id="description" name="description" rows={4} required className="rounded-xl bg-gray-50 border-gray-100" />
                </div>
                
                <FileUpload
                  label="Resource File"
                  accept=".pdf,.doc,.docx,.txt,audio/*,video/*"
                  maxSize={50 * 1024 * 1024}
                  allowedTypes={[
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/plain",
                    "audio/mpeg",
                    "audio/wav",
                    "audio/mp3",
                    "video/mp4",
                    "video/quicktime"
                  ]}
                  onUpload={(url, path) => {
                    setResourceFileUrl(url)
                    setResourceFilePath(path)
                  }}
                  onRemove={() => {
                    setResourceFileUrl(undefined)
                    setResourceFilePath(undefined)
                  }}
                  currentUrl={resourceFileUrl}
                  currentPath={resourceFilePath}
                  folder="resources"
                  bucket="uploads"
                />

                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="is_active" className="text-sm font-bold text-gray-700">Active</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input type="checkbox" id="is_featured" name="is_featured" value="true" className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="is_featured" className="text-sm font-bold text-gray-700">Featured</Label>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingResource(false)} className="rounded-xl py-6 font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 px-8 font-black shadow-lg shadow-blue-600/20">
                    {isUpdating ? "Processing..." : "Add Resource"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Resource Dialog */}
        <Dialog open={isEditingResource} onOpenChange={setIsEditingResource}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-[32px] overflow-hidden p-0 border-0">
            <div className="bg-gray-900 p-6 sm:p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Edit Resource</DialogTitle>
                <DialogDescription className="text-gray-400">Update the resource information</DialogDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleUpdateResource} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Title</Label>
                  <Input 
                    id="edit-title" 
                    name="title" 
                    defaultValue={currentResource?.title || ''}
                    required 
                    className="h-12 rounded-xl bg-gray-50 border-gray-100" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Type</Label>
                  <Select name="type" defaultValue={currentResource?.type || ''} required>
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document (PDF/DOC)</SelectItem>
                      <SelectItem value="audio">Audio (MP3)</SelectItem>
                      <SelectItem value="video">Video (MP4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Category</Label>
                <Input 
                  id="edit-category" 
                  name="category" 
                  defaultValue={currentResource?.category || ''}
                  placeholder="e.g., Sermons, Bible Studies" 
                  required 
                  className="h-12 rounded-xl bg-gray-50 border-gray-100" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={currentResource?.description || ''}
                  rows={4} 
                  required 
                  className="rounded-xl bg-gray-50 border-gray-100" 
                />
              </div>
              
              <FileUpload
                label="Resource File (Optional - leave unchanged to keep current file)"
                accept=".pdf,.doc,.docx,.txt,audio/*,video/*"
                maxSize={50 * 1024 * 1024}
                allowedTypes={[
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "text/plain",
                  "audio/mpeg",
                  "audio/wav",
                  "audio/mp3",
                  "video/mp4",
                  "video/quicktime"
                ]}
                onUpload={(url, path) => {
                  setResourceFileUrl(url)
                  setResourceFilePath(path)
                }}
                onRemove={() => {
                  setResourceFileUrl(undefined)
                  setResourceFilePath(undefined)
                }}
                currentUrl={resourceFileUrl}
                currentPath={resourceFilePath}
                folder="resources"
                bucket="uploads"
                overwritePath={currentResource?.file_path} // Use existing path for overwrite
                showDelete={false} // Disable delete to avoid Cloudinary errors
              />

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    id="edit-is_active" 
                    name="is_active" 
                    value="true" 
                    defaultChecked={currentResource?.is_active !== false}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" 
                  />
                  <Label htmlFor="edit-is_active" className="text-sm font-bold text-gray-700">Active</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    id="edit-is_featured" 
                    name="is_featured" 
                    value="true" 
                    defaultChecked={currentResource?.is_featured === true}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" 
                  />
                  <Label htmlFor="edit-is_featured" className="text-sm font-bold text-gray-700">Featured</Label>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100">
                <DeleteButton
                  itemId={currentResource?.id || ''}
                  filePath={currentResource?.file_path}
                  onDelete={handleDeleteResource}
                  itemName={currentResource?.title || 'this resource'}
                  variant="destructive"
                  size="default"
                  className="rounded-xl py-6 font-bold"
                  disabled={isUpdating}
                  onSuccess={() => setIsEditingResource(false)}
                />
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsEditingResource(false)} className="rounded-xl py-6 font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 px-8 font-black shadow-lg shadow-blue-600/20">
                    {isUpdating ? "Updating..." : "Update Resource"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {resources.map((resource) => {
            const FileIcon = getFileIcon(resource.type)
            return (
              <Card key={resource.id} className="overflow-hidden border-0 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[32px] bg-white">
                <CardHeader className="p-6 sm:p-8 pb-4">
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-6 w-6 text-gray-600" />
                    <h3 className="font-medium text-base text-gray-900 truncate">
                      {resource.title}
                    </h3>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 line-clamp-1">
                      {resource.description}
                    </span>
                    <button
                      onClick={() => {
                        setCurrentResource(resource)
                        setResourceFileUrl(resource.file_url)
                        setResourceFilePath(resource.file_path)
                        setIsEditingResource(true)
                      }}
                      className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
