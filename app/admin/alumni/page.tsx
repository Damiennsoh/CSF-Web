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
import { Plus, Edit, Trash2, GraduationCap, Mail, Phone, MapPin } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { logAdminAction } from "@/lib/admin-logger"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"

interface Alumni {
  id: string
  name: string
  email: string
  phone?: string
  graduation_year: number
  degree: string
  current_occupation?: string
  current_position?: string
  location?: string
  company_organization?: string
  bio?: string
  testimony?: string
  image_url?: string
  image_path?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AlumniManagement() {
  const { user, isAdmin } = useAuth()
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingAlumni, setIsAddingAlumni] = useState(false)
  const [isEditingAlumni, setIsEditingAlumni] = useState(false)
  const [currentAlumni, setCurrentAlumni] = useState<Alumni | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [alumniImageUrl, setAlumniImageUrl] = useState<string | undefined>(undefined)
  const [alumniImagePath, setAlumniImagePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (user && isAdmin) {
      loadAlumni()
    }
  }, [user, isAdmin])

  const loadAlumni = async () => {
    setLoading(true)
    toast({
      title: "Loading...",
      description: "Please wait while we load the alumni data.",
    })

    try {
      const q = query(collection(db, "alumni"), orderBy("graduation_year", "desc"))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alumni[]

      setAlumni(data)
    } catch (error) {
      console.error("Error loading alumni:", error)
      toast({
        title: "Error",
        description: "Failed to load alumni data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAlumni = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    setIsUpdating(true)
    toast({
      title: "Adding...",
      description: "Please wait while we add the alumni record.",
    })

    try {
      await addDoc(collection(db, "alumni"), {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        graduation_year: Number.parseInt(formData.get("graduation_year") as string),
        degree: formData.get("degree"),
        current_occupation: formData.get("current_occupation"),
        current_position: formData.get("current_occupation"),
        location: formData.get("location"),
        company_organization: formData.get("location"),
        bio: formData.get("bio"),
        testimony: formData.get("bio"),
        image_url: alumniImageUrl,
        image_path: alumniImagePath,
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await loadAlumni()
      
      if (user) {
        await logAdminAction(
          user.uid,
          user.email || "Unknown",
          "CREATE_ALUMNI",
          `Added alumni: ${formData.get("name")}`
        )
      }

      setIsAddingAlumni(false)
      setAlumniImageUrl(undefined)
      setAlumniImagePath(undefined)
      toast({
        title: "Success",
        description: "Alumni record added successfully.",
      })
    } catch (error) {
      console.error("Error adding alumni:", error)
      toast({
        title: "Error",
        description: "Failed to add alumni record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditAlumni = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAlumni) return

    setIsUpdating(true)
    toast({
      title: "Updating...",
      description: "Please wait while we update the alumni record.",
    })

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      const alumniRef = doc(db, "alumni", currentAlumni.id)
      await updateDoc(alumniRef, {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        graduation_year: Number.parseInt(formData.get("graduation_year") as string),
        degree: formData.get("degree"),
        current_occupation: formData.get("current_occupation"),
        current_position: formData.get("current_occupation"),
        location: formData.get("location"),
        company_organization: formData.get("location"),
        bio: formData.get("bio"),
        testimony: formData.get("bio"),
        image_url: alumniImageUrl || currentAlumni.image_url,
        image_path: alumniImagePath || currentAlumni.image_path,
        is_featured: formData.get("is_featured") === "true",
        is_active: formData.get("is_active") === "true",
        updatedAt: serverTimestamp(),
      })

      await loadAlumni()
      setIsEditingAlumni(false)
      setCurrentAlumni(null)
      setAlumniImageUrl(undefined)
      setAlumniImagePath(undefined)
      toast({
        title: "Success",
        description: "Alumni record updated successfully.",
      })
    } catch (error) {
      console.error("Error updating alumni:", error)
      toast({
        title: "Error",
        description: "Failed to update alumni record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAlumni = async (id: string, imagePath?: string) => {
    setIsUpdating(true)
    toast({
      title: "Deleting...",
      description: "Please wait while we delete the alumni record.",
    })

    try {
      // Delete image from storage if it exists
      if (imagePath) {
        const { FirebaseStorageService } = await import("@/lib/firebase-storage")
        await FirebaseStorageService.deleteFile(imagePath)
      }

      // Delete from database
      await deleteDoc(doc(db, "alumni", id))

      await loadAlumni()
      toast({
        title: "Success",
        description: "Alumni record deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting alumni:", error)
      toast({
        title: "Error",
        description: "Failed to delete alumni record. Please try again.",
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
          <p className="mt-4 text-gray-600">Loading alumni management...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBackButton iconOnly />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alumni Management</h1>
          <p className="mt-2 text-gray-600">Manage alumni records and achievements</p>
        </div>

        <div className="mb-6">
          <Dialog open={isAddingAlumni} onOpenChange={setIsAddingAlumni}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Alumni
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Alumni</DialogTitle>
                <DialogDescription>Add a new alumni record to the database</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAlumni} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" placeholder="+91-XXXXX-XXXXX" />
                  </div>
                  <div>
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    <Input id="graduation_year" name="graduation_year" type="number" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="degree">Degree</Label>
                    <Input id="degree" name="degree" placeholder="e.g., B.Sc Computer Science" required />
                  </div>
                  <div>
                    <Label htmlFor="current_occupation">Current Occupation</Label>
                    <Input id="current_occupation" name="current_occupation" placeholder="e.g., Software Engineer" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g., Bangalore, India" />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" name="bio" rows={4} placeholder="Brief biography and achievements..." />
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
                    setAlumniImageUrl(url)
                    setAlumniImagePath(path)
                  }}
                  onRemove={() => {
                    setAlumniImageUrl(undefined)
                    setAlumniImagePath(undefined)
                  }}
                  currentUrl={alumniImageUrl}
                  currentPath={alumniImagePath}
                  folder="alumni"
                  bucket="uploads"
                />
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="is_featured" name="is_featured" value="true" />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddingAlumni(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Adding..." : "Add Alumni"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((alum) => (
            <Card key={alum.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {alum.image_url && (
                    <img
                      src={alum.image_url}
                      alt={alum.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{alum.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {alum.degree} - Class of {alum.graduation_year}
                    </CardDescription>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {alum.email}
                    </CardDescription>
                    {alum.phone && (
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {alum.phone}
                      </CardDescription>
                    )}
                    {alum.location && (
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {alum.location}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {alum.is_featured && <Badge variant="default">Featured</Badge>}
                    {alum.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {alum.current_occupation && (
                  <p className="text-sm font-medium text-gray-700 mb-2">{alum.current_occupation}</p>
                )}
                {alum.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{alum.bio}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Dialog
                    open={isEditingAlumni && currentAlumni?.id === alum.id}
                    onOpenChange={(open) => {
                      setIsEditingAlumni(open)
                      if (!open) setCurrentAlumni(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setCurrentAlumni(alum)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Alumni</DialogTitle>
                        <DialogDescription>Update alumni information</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleEditAlumni} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input id="edit-name" name="name" defaultValue={alum.name} required />
                          </div>
                          <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" name="email" type="email" defaultValue={alum.email} required />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input id="edit-phone" name="phone" defaultValue={alum.phone} placeholder="+91-XXXXX-XXXXX" />
                          </div>
                          <div>
                            <Label htmlFor="edit-graduation_year">Graduation Year</Label>
                            <Input id="edit-graduation_year" name="graduation_year" type="number" defaultValue={alum.graduation_year} required />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-degree">Degree</Label>
                            <Input id="edit-degree" name="degree" defaultValue={alum.degree} required />
                          </div>
                          <div>
                            <Label htmlFor="edit-current_occupation">Current Occupation</Label>
                            <Input id="edit-current_occupation" name="current_occupation" defaultValue={alum.current_occupation} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-location">Location</Label>
                          <Input id="edit-location" name="location" defaultValue={alum.location} />
                        </div>
                        <div>
                          <Label htmlFor="edit-bio">Bio</Label>
                          <Textarea id="edit-bio" name="bio" rows={4} defaultValue={alum.bio} />
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
                            setAlumniImageUrl(url)
                            setAlumniImagePath(path)
                          }}
                          onRemove={() => {
                            setAlumniImageUrl(undefined)
                            setAlumniImagePath(undefined)
                          }}
                          currentUrl={alumniImageUrl || alum.image_url}
                          currentPath={alumniImagePath || alum.image_path}
                          folder="alumni"
                          bucket="uploads"
                          overwritePath={alum.image_path} // Use existing path for overwrite
                          showDelete={false} // Disable delete to avoid Cloudinary errors
                        />
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-is_active"
                              name="is_active"
                              value="true"
                              defaultChecked={alum.is_active}
                            />
                            <Label htmlFor="edit-is_active">Active</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-is_featured"
                              name="is_featured"
                              value="true"
                              defaultChecked={alum.is_featured}
                            />
                            <Label htmlFor="edit-is_featured">Featured</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditingAlumni(false)
                              setCurrentAlumni(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? "Updating..." : "Update Alumni"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <DeleteButton
                    itemId={alum.id}
                    filePath={alum.image_path}
                    onDelete={handleDeleteAlumni}
                    itemName={alum.name}
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
