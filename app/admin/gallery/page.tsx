"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, Calendar, MapPin, X, AlertTriangle, Shield, Eye } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { FirebaseStorageService } from "@/lib/firebase-storage"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"
import Link from "next/link"

interface GalleryItem {
  id: string
  title: string
  description: string
  image_url: string
  image_path: string
  category: string
  is_featured: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export default function GalleryManagement() {
  const { user, isAdmin } = useAuth()
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [currentItem, setCurrentItem] = useState<GalleryItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [imagePath, setImagePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (user && isAdmin) {
      setLoading(true)
      toast({
        title: "Loading...",
        description: "Please wait while we load the gallery items.",
      })
      loadGalleryItems()
    }
  }, [user, isAdmin])

  const loadGalleryItems = async () => {
    try {
      const q = query(collection(db, "gallery"), orderBy("display_order", "asc"), limit(50))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[]

      setGalleryItems(data)
    } catch (error) {
      console.error("Error loading gallery items:", error)
      toast({
        title: "Error",
        description: "Failed to load gallery items. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive",
      })
      return
    }

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    setIsUpdating(true)
    console.log("[GalleryAdmin] Attempting to add item to Firestore:", {
      title: formData.get("title"),
      image_url: imageUrl,
      image_path: imagePath,
      created_at: formData.get("created_at")
    })

    try {
      // Get form date value
      const formDate = formData.get("created_at") as string
      
      // Build document object with robust date handling
      const docData: any = {
        title: formData.get("title"),
        description: formData.get("description"),
        image_url: imageUrl,
        image_path: imagePath,
        category: formData.get("category"),
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        display_order: Number.parseInt(formData.get("display_order") as string) || 0,
        updated_at: serverTimestamp(),
      }
      
      // Add created_at with proper fallback
      if (formDate && formDate.trim() !== '') {
        docData.created_at = formDate
      } else {
        docData.created_at = serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, "gallery"), docData)

      console.log("[GalleryAdmin] Firestore document created with ID:", docRef.id)
      await loadGalleryItems()
      setIsAddingItem(false)
      setImageUrl(undefined)
      setImagePath(undefined)
      toast({
        title: "Success",
        description: "Gallery item added successfully.",
      })
    } catch (error: any) {
      console.error("[GalleryAdmin] Error adding gallery item:", error)
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentItem) return

    setIsUpdating(true)
    toast({
      title: "Updating...",
      description: "Please wait while we update the gallery item.",
    })

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      const itemRef = doc(db, "gallery", currentItem.id)
      
      // Get form date value
      const formDate = formData.get("created_at") as string
      
      // Build update object - only include created_at if we have a valid value
      const updateData: any = {
        title: formData.get("title"),
        description: formData.get("description"),
        image_url: imageUrl || currentItem.image_url,
        image_path: imagePath || currentItem.image_path,
        category: formData.get("category"),
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        display_order: Number.parseInt(formData.get("display_order") as string) || currentItem.display_order,
        updated_at: serverTimestamp(),
      }
      
      // Only add created_at if we have a valid value (form date or existing date)
      if (formDate && formDate.trim() !== '') {
        updateData.created_at = formDate
      } else if (currentItem.created_at && currentItem.created_at.trim() !== '') {
        updateData.created_at = currentItem.created_at
      } else {
        updateData.created_at = serverTimestamp()
      }
      
      await updateDoc(itemRef, updateData)

      await loadGalleryItems()
      setIsEditingItem(false)
      setCurrentItem(null)
      setImageUrl(undefined)
      setImagePath(undefined)
      toast({
        title: "Success",
        description: "Gallery item updated successfully.",
      })
    } catch (error) {
      console.error("Error updating gallery item:", error)
      toast({
        title: "Error",
        description: "Failed to update gallery item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteItem = async (id: string, imagePath?: string) => {
    setIsUpdating(true)
    toast({
      title: "Deleting...",
      description: "Please wait while we delete the gallery item.",
    })

    try {
      // Delete image from storage if it exists
      if (imagePath) {
        await FirebaseStorageService.deleteFile(imagePath)
      }

      // Delete from database
      await deleteDoc(doc(db, "gallery", id))

      await loadGalleryItems()
      toast({
        title: "Success",
        description: "Gallery item deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting gallery item:", error)
      toast({
        title: "Error",
        description: "Failed to delete gallery item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gallery management...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-[32px] shadow-xl">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
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
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">Gallery <span className="text-red-600">Management</span></h1>
          <p className="mt-2 text-gray-600 font-medium">Manage church gallery photos and images</p>
        </div>

        <div className="mb-8">
          <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-2xl py-6 px-8 font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95">
                <Plus className="h-5 w-5 mr-2" />
                Add Gallery Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] rounded-[32px] overflow-hidden p-0 border-0">
              <div className="bg-gray-900 p-6 sm:p-8 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Add New Photo</DialogTitle>
                  <DialogDescription className="text-gray-400">Upload a new image to the community gallery</DialogDescription>
                </DialogHeader>
              </div>
              <form onSubmit={handleAddItem} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Title</Label>
                    <Input id="title" name="title" required className="h-12 rounded-xl bg-gray-50 border-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Category</Label>
                    <Input id="category" name="category" placeholder="e.g., Events, Services" required className="h-12 rounded-xl bg-gray-50 border-gray-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Description</Label>
                  <Textarea id="description" name="description" rows={3} className="rounded-xl bg-gray-50 border-gray-100" />
                </div>
                
                <FileUpload
                  label="Gallery Image"
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                  allowedTypes={[
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp",
                    "image/jpg"
                  ]}
                  onUpload={(url, path) => {
                    setImageUrl(url)
                    setImagePath(path)
                  }}
                  onRemove={() => {
                    setImageUrl(undefined)
                    setImagePath(undefined)
                  }}
                  currentUrl={imageUrl}
                  currentPath={imagePath}
                  folder="gallery"
                  bucket="uploads"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Order</Label>
                    <Input id="display_order" name="display_order" type="number" defaultValue="0" className="h-12 rounded-xl bg-gray-50 border-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="created_at" className="text-sm font-bold text-gray-700 uppercase tracking-wider">Event Date</Label>
                    <Input id="created_at" name="created_at" type="date" className="h-12 rounded-xl bg-gray-50 border-gray-100" />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600" />
                    <Label htmlFor="is_active" className="text-sm font-bold text-gray-700">Active</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input type="checkbox" id="is_featured" name="is_featured" value="true" className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600" />
                    <Label htmlFor="is_featured" className="text-sm font-bold text-gray-700">Featured</Label>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingItem(false)} className="rounded-xl py-6 font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating} className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 px-8 font-black shadow-lg shadow-red-600/20">
                    {isUpdating ? "Processing..." : "Upload Photo"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {galleryItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group border-0 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[32px] bg-white">
              <div className="relative h-56 sm:h-48 bg-gray-100">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <a
                    href={item.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </a>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.is_featured && <Badge variant="default">Featured</Badge>}
                  {item.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                <CardDescription>{item.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Order: {item.display_order}</span>
                  <div className="flex gap-2">
                    <Dialog
                      open={isEditingItem && currentItem?.id === item.id}
                      onOpenChange={(open) => {
                        setIsEditingItem(open)
                        if (!open) setCurrentItem(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setCurrentItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-[32px]">
                        <DialogHeader className="bg-gray-50 p-6 sm:p-8 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-4">
                          <DialogTitle className="text-xl sm:text-2xl font-black">Edit Gallery Item</DialogTitle>
                          <DialogDescription>Update gallery item information</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditItem} className="space-y-4 px-6 sm:px-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-title" className="text-sm font-bold">Title</Label>
                              <Input id="edit-title" name="title" defaultValue={item.title} required className="h-12 rounded-xl" />
                            </div>
                            <div>
                              <Label htmlFor="edit-category" className="text-sm font-bold">Category</Label>
                              <Input id="edit-category" name="category" defaultValue={item.category} required className="h-12 rounded-xl" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea id="edit-description" name="description" rows={3} defaultValue={item.description} />
                          </div>
                          <FileUpload
                            label="Gallery Image"
                            accept="image/*"
                            maxSize={5 * 1024 * 1024}
                            allowedTypes={[
                              "image/jpeg",
                              "image/png",
                              "image/gif",
                              "image/webp",
                              "image/jpg"
                            ]}
                            onUpload={(url, path) => {
                              setImageUrl(url)
                              setImagePath(path)
                            }}
                            onRemove={() => {
                              setImageUrl(undefined)
                              setImagePath(undefined)
                            }}
                            currentUrl={imageUrl || item.image_url}
                            currentPath={imagePath || item.image_path}
                            folder="gallery"
                            bucket="uploads"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="edit-display_order" className="text-sm font-bold">Display Order</Label>
                              <Input
                                id="edit-display_order"
                                name="display_order"
                                type="number"
                                defaultValue={item.display_order}
                                className="h-12 rounded-xl"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-created_at" className="text-sm font-bold">Event Date</Label>
                              <Input
                                id="edit-created_at"
                                name="created_at"
                                type="date"
                                defaultValue={
                                  item.created_at && typeof item.created_at === 'object' && 'seconds' in item.created_at 
                                    ? new Date((item.created_at as any).seconds * 1000).toISOString().split('T')[0]
                                    : item.created_at?.split('T')[0] || ''
                                }
                                className="h-12 rounded-xl"
                              />
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <input
                                type="checkbox"
                                id="edit-is_active"
                                name="is_active"
                                value="true"
                                defaultChecked={item.is_active}
                                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600"
                              />
                              <Label htmlFor="edit-is_active" className="text-sm font-bold">Active</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <input
                                type="checkbox"
                                id="edit-is_featured"
                                name="is_featured"
                                value="true"
                                defaultChecked={item.is_featured}
                                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600"
                              />
                              <Label htmlFor="edit-is_featured" className="text-sm font-bold">Featured</Label>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditingItem(false)
                                setCurrentItem(null)
                              }}
                              className="rounded-xl py-6 font-bold"
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating} className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 px-8 font-black shadow-lg shadow-red-600/20">
                              {isUpdating ? "Updating..." : "Update Item"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <DeleteButton
                      itemId={item.id}
                      filePath={item.image_path}
                      onDelete={handleDeleteItem}
                      itemName={item.title}
                      iconOnly
                      size="icon"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
