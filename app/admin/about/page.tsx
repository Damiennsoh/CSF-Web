"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Shield, Users, Camera } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"

interface AboutLeader {
  id: string
  name: string
  position: string
  bio: string
  image_url?: string
  photo_path?: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AboutLeadershipPage() {
  const { isAdmin } = useAuth()
  const [leaders, setLeaders] = useState<AboutLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Dialog states
  const [isAddingLeader, setIsAddingLeader] = useState(false)
  const [isEditingLeader, setIsEditingLeader] = useState(false)
  const [currentLeader, setCurrentLeader] = useState<AboutLeader | null>(null)

  // Form states
  const [leaderName, setLeaderName] = useState("")
  const [leaderPosition, setLeaderPosition] = useState("")
  const [leaderBio, setLeaderBio] = useState("")
  const [leaderImageUrl, setLeaderImageUrl] = useState<string | undefined>(undefined)
  const [leaderPhotoPath, setLeaderPhotoPath] = useState<string | undefined>(undefined)
  const subscribed = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!isAdmin) return
    mounted.current = true
    if (subscribed.current) return
    subscribed.current = true

    const q = query(
      collection(db!, "about_leadership"),
      orderBy("order", "asc"),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!mounted.current) return
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AboutLeader[]
      setLeaders(data)
      setLoading(false)
    }, (error) => {
      if (!mounted.current) return
      console.error("Error loading about leadership:", error)
      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscribed.current = false
      unsubscribe()
    }
  }, [isAdmin])

  const addLeader = async () => {
    if (!leaderName.trim() || !leaderPosition.trim() || !leaderBio.trim()) return

    setIsUpdating(true)
    try {
      const newLeader: Omit<AboutLeader, 'id' | 'created_at' | 'updated_at'> = {
        name: leaderName.trim(),
        position: leaderPosition.trim(),
        bio: leaderBio.trim(),
        image_url: leaderImageUrl || "",
        photo_path: leaderPhotoPath || "",
        order: leaders.length,
        is_active: true,
      }

      await addDoc(collection(db!, "about_leadership"), {
        ...newLeader,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      toast({
        title: "Success",
        description: "About leadership member has been added"
      })

      // Reset form
      setLeaderName("")
      setLeaderPosition("")
      setLeaderBio("")
      setLeaderImageUrl(undefined)
      setLeaderPhotoPath(undefined)
      setIsAddingLeader(false)
    } catch (error) {
      console.error("Error adding leader:", error)
      toast({
        title: "Error",
        description: "Failed to add leadership member",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateLeader = async () => {
    if (!currentLeader || !leaderName.trim() || !leaderPosition.trim() || !leaderBio.trim()) return

    setIsUpdating(true)
    try {
      const updatedLeader: Partial<AboutLeader> = {
        name: leaderName.trim(),
        position: leaderPosition.trim(),
        bio: leaderBio.trim(),
        image_url: leaderImageUrl || currentLeader.image_url,
        photo_path: leaderPhotoPath || currentLeader.photo_path,
        updated_at: new Date().toISOString()
      }

      const leaderRef = doc(db!, "about_leadership", currentLeader.id)
      await updateDoc(leaderRef, updatedLeader)

      toast({
        title: "Success",
        description: "About leadership member has been updated"
      })

      // Reset form
      setLeaderName("")
      setLeaderPosition("")
      setLeaderBio("")
      setLeaderImageUrl(undefined)
      setLeaderPhotoPath(undefined)
      setCurrentLeader(null)
      setIsEditingLeader(false)
    } catch (error) {
      console.error("Error updating leader:", error)
      toast({
        title: "Error",
        description: "Failed to update leadership member",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteLeader = async (leaderId: string) => {
    if (!confirm("Are you sure you want to delete this leadership member? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDoc(doc(db!, "about_leadership", leaderId))
      toast({
        title: "Success",
        description: "Leadership member has been removed"
      })
    } catch (error) {
      console.error("Error deleting leader:", error)
      toast({
        title: "Error",
        description: "Failed to remove leadership member",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (leader: AboutLeader) => {
    setCurrentLeader(leader)
    setLeaderName(leader.name)
    setLeaderPosition(leader.position)
    setLeaderBio(leader.bio)
    setLeaderImageUrl(leader.image_url)
    setLeaderPhotoPath(leader.photo_path)
    setIsEditingLeader(true)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
            <AdminBackButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">About Page Leadership</h1>
              <p className="text-gray-600">Manage leadership team members shown on About page</p>
            </div>
            <Button onClick={() => setIsAddingLeader(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Leader
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : leaders.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Leadership Members</h3>
              <p className="text-gray-500 mb-4">Start by adding your first leadership team member</p>
              <Button onClick={() => setIsAddingLeader(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Leader
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaders.map((leader) => (
              <Card key={leader.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                    {leader.image_url ? (
                      <img 
                        src={leader.image_url} 
                        alt={leader.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-black">
                        {leader.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{leader.name}</CardTitle>
                  <CardDescription className="text-blue-600 font-medium">{leader.position}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{leader.bio}</p>
                  <div className="flex justify-center gap-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(leader)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteLeader(leader.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Leader Dialog */}
      <Dialog open={isAddingLeader} onOpenChange={setIsAddingLeader}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Add About Leadership Member</DialogTitle>
            <DialogDescription>
              Add a new leadership team member to be shown on the About page
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <Label htmlFor="leader-name">Full Name *</Label>
                <Input
                  id="leader-name"
                  placeholder="Enter full name"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="leader-position">Position *</Label>
                <Input
                  id="leader-position"
                  placeholder="e.g., President, Vice President"
                  value={leaderPosition}
                  onChange={(e) => setLeaderPosition(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="leader-bio">Bio *</Label>
                <Textarea
                  id="leader-bio"
                  placeholder="Brief description of this leadership member..."
                  value={leaderBio}
                  onChange={(e) => setLeaderBio(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <FileUpload
                label="Profile Photo"
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
                  setLeaderImageUrl(url)
                  setLeaderPhotoPath(path)
                }}
                onRemove={() => {
                  setLeaderImageUrl(undefined)
                  setLeaderPhotoPath(undefined)
                }}
                currentUrl={leaderImageUrl}
                currentPath={leaderPhotoPath}
                folder="about-leadership"
                bucket="uploads"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddingLeader(false)}>
              Cancel
            </Button>
            <Button onClick={addLeader} disabled={isUpdating}>
              {isUpdating ? "Adding..." : "Add Leader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Leader Dialog */}
      <Dialog open={isEditingLeader} onOpenChange={setIsEditingLeader}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Edit About Leadership Member</DialogTitle>
            <DialogDescription>
              Update leadership member information
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-leader-name">Full Name *</Label>
                <Input
                  id="edit-leader-name"
                  placeholder="Enter full name"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-leader-position">Position *</Label>
                <Input
                  id="edit-leader-position"
                  placeholder="e.g., President, Vice President"
                  value={leaderPosition}
                  onChange={(e) => setLeaderPosition(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-leader-bio">Bio *</Label>
                <Textarea
                  id="edit-leader-bio"
                  placeholder="Brief description of this leadership member..."
                  value={leaderBio}
                  onChange={(e) => setLeaderBio(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <FileUpload
                label="Profile Photo"
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
                  setLeaderImageUrl(url)
                  setLeaderPhotoPath(path)
                }}
                onRemove={() => {
                  setLeaderImageUrl(undefined)
                  setLeaderPhotoPath(undefined)
                }}
                currentUrl={leaderImageUrl}
                currentPath={leaderPhotoPath}
                folder="about-leadership"
                bucket="uploads"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditingLeader(false)}>
              Cancel
            </Button>
            <Button onClick={updateLeader} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Leader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
