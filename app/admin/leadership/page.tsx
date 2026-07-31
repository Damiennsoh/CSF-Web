"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DeleteButton } from "@/components/ui/delete-button"
import { Plus, Edit, Trash2, Shield } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"

interface Leader {
  id: string
  name: string
  role: string
  position?: string
  email?: string
  bio?: string
  phone?: string
  photo_url?: string
  photo_path?: string
  profile_picture_url?: string
  is_active: boolean
  is_current?: boolean
  is_featured?: boolean
  display_order?: number
  start_date?: string
  created_at?: string
  updated_at?: string
}

export default function LeadershipManagement() {
  const { isAdmin } = useAuth()
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [current, setCurrent] = useState<Leader | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined)
  const [photoPath, setPhotoPath] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!isAdmin) return
    loadLeaders()
  }, [isAdmin])

  const loadLeaders = async () => {
    setLoading(true)
    try {
      const q = query(collection(db!, "executive_leaders"), orderBy("name", "asc"), limit(50))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Leader[]
      setLeaders(data)
    } catch (error) {
      console.error("Error loading leaders:", error)
      toast({ title: "Error", description: "Failed to load leaders", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    try {
      await addDoc(collection(db!, "executive_leaders"), {
        name: fd.get("name"),
        position: fd.get("role"),
        role: fd.get("role"),
        email: fd.get("email"),
        bio: fd.get("bio"),
        phone: fd.get("phone"),
        profile_picture_url: photoUrl || null,
        photo_url: photoUrl || null,
        photo_path: photoPath || null,
        is_current: fd.get("is_current") === "on",
        is_featured: fd.get("is_featured") === "on",
        is_active: true,
        display_order: Number(fd.get("display_order")) || 0,
        start_date: fd.get("start_date"),
        createdAt: serverTimestamp(),
      })
      setIsAdding(false)
      setPhotoUrl(undefined)
      setPhotoPath(undefined)
      toast({ title: "Created", description: "Leader added" })
    } catch {
      toast({ title: "Error", description: "Failed to add leader", variant: "destructive" })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    try {
      await updateDoc(doc(db!, "executive_leaders", current.id), {
        name: fd.get("name"),
        position: fd.get("role"),
        role: fd.get("role"),
        email: fd.get("email"),
        bio: fd.get("bio"),
        phone: fd.get("phone"),
        profile_picture_url: photoUrl || current.photo_url || null,
        photo_url: photoUrl || current.photo_url || null,
        photo_path: photoPath || current.photo_path || null,
        is_current: fd.get("is_current") === "on",
        is_featured: fd.get("is_featured") === "on",
        display_order: Number(fd.get("display_order")) || 0,
        start_date: fd.get("start_date"),
        updatedAt: serverTimestamp(),
      })
      setIsEditing(false)
      setCurrent(null)
      setPhotoUrl(undefined)
      setPhotoPath(undefined)
      toast({ title: "Updated", description: "Leader updated" })
    } catch {
      toast({ title: "Error", description: "Failed to update leader", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db!, "executive_leaders", id))
      setLeaders(prev => prev.filter(x => x.id !== id))
      toast({ title: "Deleted", description: "Leader removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <AdminBackButton />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leadership</h2>
          <p className="text-sm text-gray-600">Manage executive leaders</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Leader
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Leader</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input name="role" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" type="tel" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input name="start_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input name="display_order" type="number" defaultValue="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea name="bio" rows={3} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_current" defaultChecked className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Current Leader (Show on homepage)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_featured" className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Featured</span>
                </label>
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
                  setPhotoUrl(url)
                  setPhotoPath(path)
                }}
                onRemove={() => {
                  setPhotoUrl(undefined)
                  setPhotoPath(undefined)
                }}
                currentUrl={photoUrl}
                currentPath={photoPath}
                folder="leadership"
                bucket="uploads"
              />
              <DialogFooter>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaders.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {item.name}
              </CardTitle>
              <CardDescription>{item.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.photo_url && (
                <img src={item.photo_url} alt={item.name} className="w-full h-32 object-cover rounded border" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg' }} />
              )}
              <div className="flex gap-2">
                <Dialog open={isEditing && current?.id === item.id} onOpenChange={(o) => { setIsEditing(o); if (!o) setCurrent(null) }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => { setCurrent(item); setPhotoUrl(item.photo_url); setPhotoPath(item.photo_path) }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Leader</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input name="name" defaultValue={current?.name} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input name="role" defaultValue={current?.role} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input name="email" type="email" defaultValue={current?.email} />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input name="phone" type="tel" defaultValue={current?.phone} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input name="start_date" type="date" defaultValue={current?.start_date} />
                        </div>
                        <div className="space-y-2">
                          <Label>Display Order</Label>
                          <Input name="display_order" type="number" defaultValue={current?.display_order || 0} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea name="bio" rows={3} defaultValue={current?.bio} />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="is_current" defaultChecked={current?.is_current} className="h-4 w-4 text-red-600" />
                          <span className="text-sm">Current Leader (Show on homepage)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="is_featured" defaultChecked={current?.is_featured} className="h-4 w-4 text-red-600" />
                          <span className="text-sm">Featured</span>
                        </label>
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
                          setPhotoUrl(url)
                          setPhotoPath(path)
                        }}
                        onRemove={() => {
                          setPhotoUrl(undefined)
                          setPhotoPath(undefined)
                        }}
                        currentUrl={photoUrl}
                        currentPath={photoPath}
                        folder="leadership"
                        bucket="uploads"
                        overwritePath={current?.photo_path} // Use existing path for overwrite
                        showDelete={false} // Disable delete to avoid Cloudinary errors
                      />
                      <DialogFooter>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <DeleteButton
                  itemId={item.id}
                  onDelete={handleDelete}
                  itemName={`leader "${item.name}"`}
                  iconOnly
                  size="icon"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

