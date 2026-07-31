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
import { Plus, Edit, Trash2, MessageSquare, Star, User } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"
import { DeleteButton } from "@/components/ui/delete-button"
import { FirebaseStorageService } from "@/lib/firebase-storage"

interface Testimonial {
  id: string
  name: string
  email?: string
  role?: string
  company?: string
  content: string
  rating: number
  image_url?: string
  image_path?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TestimonialsManagement() {
  const { user, isAdmin } = useAuth()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false)
  const [isEditingTestimonial, setIsEditingTestimonial] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [testimonialImageUrl, setTestimonialImageUrl] = useState<string | undefined>(undefined)
  const [testimonialImagePath, setTestimonialImagePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (user && isAdmin) {
      loadTestimonials()
    }
  }, [user, isAdmin])

  const loadTestimonials = async () => {
    setLoading(true)
    toast({
      title: "Loading...",
      description: "Please wait while we load the testimonials.",
    })

    try {
      const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"), limit(50))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
      })) as Testimonial[]

      setTestimonials(data)
    } catch (error) {
      console.error("Error loading testimonials:", error)
      toast({
        title: "Error",
        description: "Failed to load testimonials. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    setIsUpdating(true)
    toast({
      title: "Adding...",
      description: "Please wait while we add the testimonial.",
    })

    try {
      await addDoc(collection(db, "testimonials"), {
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
        company: formData.get("company"),
        content: formData.get("content"),
        rating: Number.parseInt(formData.get("rating") as string),
        image_url: testimonialImageUrl,
        image_path: testimonialImagePath,
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await loadTestimonials()
      setIsAddingTestimonial(false)
      setTestimonialImageUrl(undefined)
      setTestimonialImagePath(undefined)
      toast({
        title: "Success",
        description: "Testimonial added successfully.",
      })
    } catch (error) {
      console.error("Error adding testimonial:", error)
      toast({
        title: "Error",
        description: "Failed to add testimonial. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTestimonial) return

    setIsUpdating(true)
    toast({
      title: "Updating...",
      description: "Please wait while we update the testimonial.",
    })

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      const testimonialRef = doc(db, "testimonials", currentTestimonial.id)
      await updateDoc(testimonialRef, {
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
        company: formData.get("company"),
        content: formData.get("content"),
        rating: Number.parseInt(formData.get("rating") as string),
        image_url: testimonialImageUrl || currentTestimonial.image_url,
        image_path: testimonialImagePath || currentTestimonial.image_path,
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        updatedAt: serverTimestamp(),
      })

      await loadTestimonials()
      setIsEditingTestimonial(false)
      setCurrentTestimonial(null)
      setTestimonialImageUrl(undefined)
      setTestimonialImagePath(undefined)
      toast({
        title: "Success",
        description: "Testimonial updated successfully.",
      })
    } catch (error) {
      console.error("Error updating testimonial:", error)
      toast({
        title: "Error",
        description: "Failed to update testimonial. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTestimonial = async (id: string, imagePath?: string) => {
    setIsUpdating(true)
    toast({
      title: "Deleting...",
      description: "Please wait while we delete the testimonial.",
    })

    try {
      // Delete image from storage if it exists
      if (imagePath) {
        await FirebaseStorageService.deleteFile(imagePath)
      }

      // Delete from database
      await deleteDoc(doc(db, "testimonials", id))

      await loadTestimonials()
      toast({
        title: "Success",
        description: "Testimonial deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting testimonial:", error)
      toast({
        title: "Error",
        description: "Failed to delete testimonial. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading testimonials management...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminBackButton />
        <div className="mb-8 mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Testimonials Management</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage testimonials and reviews from members and visitors</p>
        </div>

        <div className="mb-6">
          <Dialog open={isAddingTestimonial} onOpenChange={setIsAddingTestimonial}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden rounded-[32px]">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-xl font-bold">Add New Testimonial</DialogTitle>
                <DialogDescription>Add a new testimonial to showcase</DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handleAddTestimonial} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                      <Input id="name" name="name" required className="h-10" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input id="email" name="email" type="email" className="h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="role" className="text-sm font-medium">Role/Position</Label>
                      <Input id="role" name="role" placeholder="e.g., Student, Alumni, Member" className="h-10" />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-sm font-medium">Company/Organization</Label>
                      <Input id="company" name="company" placeholder="e.g., Google, University" className="h-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rating" className="text-sm font-medium">Rating</Label>
                    <select
                      id="rating"
                      name="rating"
                      className="w-full p-2 border rounded-md h-10"
                      required
                    >
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Very Good</option>
                      <option value="3">3 Stars - Good</option>
                      <option value="2">2 Stars - Fair</option>
                      <option value="1">1 Star - Poor</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-sm font-medium">Testimonial Content</Label>
                    <Textarea id="content" name="content" rows={3} required placeholder="Share your experience..." className="resize-none" />
                  </div>
                  <FileUpload
                    label="Profile Picture"
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
                      setTestimonialImageUrl(url)
                      setTestimonialImagePath(path)
                    }}
                    onRemove={() => {
                      setTestimonialImageUrl(undefined)
                      setTestimonialImagePath(undefined)
                    }}
                    currentUrl={testimonialImageUrl}
                    currentPath={testimonialImagePath}
                    folder="testimonials"
                    bucket="uploads"
                  />
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked />
                      <Label htmlFor="is_active" className="text-sm">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="is_featured" name="is_featured" value="true" />
                      <Label htmlFor="is_featured" className="text-sm">Featured</Label>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsAddingTestimonial(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                      {isUpdating ? "Adding..." : "Add Testimonial"}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {testimonial.image_url && (
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(testimonial.rating)}
                    </div>
                    {(testimonial.role || testimonial.company) && (
                      <CardDescription>
                        {testimonial.role}
                        {testimonial.role && testimonial.company && " • "}
                        {testimonial.company}
                      </CardDescription>
                    )}
                    {testimonial.email && (
                      <CardDescription>{testimonial.email}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {testimonial.is_featured && <Badge variant="default">Featured</Badge>}
                    {testimonial.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-sm text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex justify-end gap-2">
                  <Dialog
                    open={isEditingTestimonial && currentTestimonial?.id === testimonial.id}
                    onOpenChange={(open) => {
                      setIsEditingTestimonial(open)
                      if (!open) setCurrentTestimonial(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setCurrentTestimonial(testimonial)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden rounded-[32px]">
                      <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-xl font-bold">Edit Testimonial</DialogTitle>
                        <DialogDescription>Update testimonial information</DialogDescription>
                      </DialogHeader>
                      <div className="px-6 pb-6 overflow-y-auto max-h-[70vh]">
                        <form onSubmit={handleEditTestimonial} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="edit-name" className="text-sm font-medium">Name</Label>
                              <Input id="edit-name" name="name" defaultValue={testimonial.name} required className="h-10" />
                            </div>
                            <div>
                              <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                              <Input id="edit-email" name="email" type="email" defaultValue={testimonial.email} className="h-10" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="edit-role" className="text-sm font-medium">Role/Position</Label>
                              <Input id="edit-role" name="role" defaultValue={testimonial.role} className="h-10" />
                            </div>
                            <div>
                              <Label htmlFor="edit-company" className="text-sm font-medium">Company/Organization</Label>
                              <Input id="edit-company" name="company" defaultValue={testimonial.company} className="h-10" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="edit-rating" className="text-sm font-medium">Rating</Label>
                            <select
                              id="edit-rating"
                              name="rating"
                              className="w-full p-2 border rounded-md h-10"
                              defaultValue={testimonial.rating}
                              required
                            >
                              <option value="5">5 Stars - Excellent</option>
                              <option value="4">4 Stars - Very Good</option>
                              <option value="3">3 Stars - Good</option>
                              <option value="2">2 Stars - Fair</option>
                              <option value="1">1 Star - Poor</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="edit-content" className="text-sm font-medium">Testimonial Content</Label>
                            <Textarea id="edit-content" name="content" rows={3} defaultValue={testimonial.content} required className="resize-none" />
                          </div>
                          <FileUpload
                            label="Profile Picture"
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
                              setTestimonialImageUrl(url)
                              setTestimonialImagePath(path)
                            }}
                            onRemove={() => {
                              setTestimonialImageUrl(undefined)
                              setTestimonialImagePath(undefined)
                            }}
                            currentUrl={testimonialImageUrl || testimonial.image_url}
                            currentPath={testimonialImagePath || testimonial.image_path}
                            folder="testimonials"
                            bucket="uploads"
                            overwritePath={testimonial.image_path} // Use existing path for overwrite
                            showDelete={false} // Disable delete to avoid Cloudinary errors
                          />
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="edit-is_active"
                                name="is_active"
                                value="true"
                                defaultChecked={testimonial.is_active}
                              />
                              <Label htmlFor="edit-is_active" className="text-sm">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="edit-is_featured"
                                name="is_featured"
                                value="true"
                                defaultChecked={testimonial.is_featured}
                              />
                              <Label htmlFor="edit-is_featured" className="text-sm">Featured</Label>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditingTestimonial(false)
                                setCurrentTestimonial(null)
                              }}
                              className="w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                              {isUpdating ? "Updating..." : "Update Testimonial"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <DeleteButton
                    itemId={testimonial.id}
                    filePath={testimonial.image_path}
                    onDelete={handleDeleteTestimonial}
                    itemName={`testimonial from ${testimonial.name}`}
                    iconOnly
                    size="icon"
                    disabled={isUpdating}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
