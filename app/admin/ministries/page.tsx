"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, FileText, Settings } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"

import Link from "next/link"

interface Ministry {
  id: string
  name: string
  slug?: string
  description?: string
  image_url?: string
  image_path?: string
  resource_url?: string
  resource_path?: string
  is_active: boolean
  display_order?: number
  created_at?: string
  updated_at?: string
}

export default function MinistriesManagement() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [current, setCurrent] = useState<Ministry | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [imagePath, setImagePath] = useState<string | undefined>(undefined)
  const [resourceUrl, setResourceUrl] = useState<string | undefined>(undefined)
  const [resourcePath, setResourcePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [isAdmin])

  const load = async () => {
    // Keep for manual refresh if needed
    setLoading(true)
    try {
      const q = query(collection(db!, "ministries"), orderBy("display_order", "asc"), limit(50))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Ministry[]
      setItems(data)
    } catch {
      toast({ title: "Error", description: "Failed to load ministries", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    const name = fd.get("name") as string
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      await addDoc(collection(db!, "ministries"), {
        name: name,
        slug: slug,
        description: fd.get("description"),
        image_url: imageUrl || null,
        image_path: imagePath || null,
        resource_url: resourceUrl || null,
        resource_path: resourcePath || null,
        is_active: true,
        createdAt: serverTimestamp(),
      })
      setIsAdding(false)
      setImageUrl(undefined)
      setImagePath(undefined)
      setResourceUrl(undefined)
      setResourcePath(undefined)
      load()
      toast({ title: "Created", description: "Ministry added" })
    } catch {
      toast({ title: "Error", description: "Failed to add ministry", variant: "destructive" })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    try {
      await updateDoc(doc(db!, "ministries", current.id), {
        name: fd.get("name"),
        description: fd.get("description"),
        image_url: imageUrl || current.image_url || null,
        image_path: imagePath || current.image_path || null,
        resource_url: resourceUrl || current.resource_url || null,
        resource_path: resourcePath || current.resource_path || null,
        updatedAt: serverTimestamp(),
      })
      setIsEditing(false)
      setCurrent(null)
      setImageUrl(undefined)
      setImagePath(undefined)
      setResourceUrl(undefined)
      setResourcePath(undefined)
      load()
      toast({ title: "Updated", description: "Ministry updated" })
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db!, "ministries", id))
      setItems(prev => prev.filter(x => x.id !== id))
      toast({ title: "Deleted", description: "Ministry removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const seedDefaults = async () => {
    const defaults = [
      { name: "Women's Fellowship", description: "Empowering women through Bible study, prayer, and fellowship.", display_order: 1 },
      { name: "Men's Fellowship", description: "Building strong Christian men through discipleship and accountability.", display_order: 2 },
      { name: "CSF Choir", description: "Worship through music and song, leading congregation in praise.", display_order: 3 },
      { name: "Bible Study", description: "Deep dive into God's Word through systematic weekly study.", display_order: 4 },
      { name: "Evangelism", description: "Sharing the Gospel on campus and in the community through outreach.", display_order: 5 },
      { name: "Intercessory Group", description: "Dedicated prayer warriors interceding for the university and community.", display_order: 6 },
    ]
    try {
      for (const m of defaults) {
        await addDoc(collection(db!, "ministries"), {
          ...m,
          is_active: true,
          createdAt: serverTimestamp(),
        })
      }
      toast({ title: "Seeded", description: "Default ministries created" })
      load()
    } catch {
      toast({ title: "Error", description: "Failed to seed ministries", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <AdminBackButton />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ministries</h2>
          <p className="text-sm text-gray-600">Create and manage ministries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedDefaults}>
            Seed 6 Default Ministries
          </Button>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Ministry
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ministry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" rows={4} />
              </div>
              <FileUpload
                label="Image"
                folder="ministries"
                onUpload={(url, path) => { setImageUrl(url); setImagePath(path) }}
                onRemove={() => { setImageUrl(undefined); setImagePath(undefined) }}
                currentUrl={imageUrl}
                currentPath={imagePath}
              />
              <FileUpload
                label="Attach Resource (PDF or media)"
                folder="ministries/resources"
                allowedTypes={["application/pdf","image/jpeg","image/png","image/webp","audio/mpeg","audio/wav","video/mp4"]}
                onUpload={(url, path) => { setResourceUrl(url); setResourcePath(path) }}
                onRemove={() => { setResourceUrl(undefined); setResourcePath(undefined) }}
                currentUrl={resourceUrl}
                currentPath={resourcePath}
              />
              <DialogFooter>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {item.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded border" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg' }} />
              )}
              {item.resource_url && (
                <a href={item.resource_url} target="_blank" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Resource
                </a>
              )}
              <div className="flex gap-2 flex-wrap">
                <Link href={`/admin/ministries/${item.id}`} className="w-full sm:w-auto">
                   <Button variant="secondary" className="w-full">
                     <Settings className="h-4 w-4 mr-2" />
                     Manage Details
                   </Button>
                </Link>
                <Dialog open={isEditing && current?.id === item.id} onOpenChange={(o) => { setIsEditing(o); if (!o) setCurrent(null) }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => { setCurrent(item); setImageUrl(item.image_url); setImagePath(item.image_path); setResourceUrl(item.resource_url); setResourcePath(item.resource_path) }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Ministry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input name="name" defaultValue={current?.name} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea name="description" rows={4} defaultValue={current?.description} />
                      </div>
                      <FileUpload
                        label="Image"
                        folder="ministries"
                        onUpload={(url, path) => { setImageUrl(url); setImagePath(path) }}
                        onRemove={() => { setImageUrl(undefined); setImagePath(undefined) }}
                        currentUrl={imageUrl}
                        currentPath={imagePath}
                      />
                      <FileUpload
                        label="Attach Resource (PDF or media)"
                        folder="ministries/resources"
                        allowedTypes={["application/pdf","image/jpeg","image/png","image/webp","audio/mpeg","audio/wav","video/mp4"]}
                        onUpload={(url, path) => { setResourceUrl(url); setResourcePath(path) }}
                        onRemove={() => { setResourceUrl(undefined); setResourcePath(undefined) }}
                        currentUrl={resourceUrl}
                        currentPath={resourcePath}
                      />
                      <DialogFooter>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
