"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, User, Users, Calendar, Download, Save, ArrowLeft, Loader2, Clock, MapPin, Mail } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"

// --- Interfaces ---

interface Ministry {
  id: string
  name: string
  slug: string
  description?: string
  meeting_time?: string
  meeting_location?: string
  contact_person?: string
  contact_email?: string
}

interface Leader {
  id: string
  person_name: string
  role_name: string
  person_email?: string
  bio?: string
  image_url?: string
  image_path?: string
  display_order?: number
}

interface Member {
  id: string
  name: string
  role?: string
  joined_date?: string
  email?: string
}

interface ScheduleItem {
  id: string
  day_of_week: number // 0-6
  start_time: string
  end_time: string
  location?: string
  venue?: string
  activity_name: string
  description?: string
  recurring?: string
}

interface Activity {
  id: string
  title: string
  description?: string
  activity_date?: string
  recurring?: string
  venue?: string
  image_url?: string
  image_path?: string
}

interface Resource {
  id: string
  title: string
  description?: string
  resource_type: "document" | "link" | "audio" | "video" | "other"
  file_url?: string
  file_path?: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Default ministry data for when Firestore document doesn't exist
const getDefaultMinistryData = (ministryId: string) => {
  const defaults: Record<string, Partial<Ministry>> = {
    "womens-fellowship": {
      name: "Women's Fellowship",
      description: "Empowering women through Bible study, prayer, and fellowship.",
      meeting_time: "Every Saturday, 3:00 PM",
      meeting_location: "Women's Fellowship Hall",
      contact_person: "Women's Leader",
      contact_email: "womens.fellowship@csfmmu.org"
    },
    "mens-fellowship": {
      name: "Men's Fellowship",
      description: "Building strong Christian men through discipleship, accountability, and service to the community.",
      meeting_time: "Every Saturday, 5:00 PM",
      meeting_location: "Men's Hall, Student Center",
      contact_person: "Men's Leader",
      contact_email: "mens.fellowship@csfmmu.org"
    },
    "choir": {
      name: "CSF Choir",
      description: "Worship through music and song, leading congregation in praise.",
      meeting_time: "Every Friday, 6:00 PM",
      meeting_location: "Chapel",
      contact_person: "Choir Director",
      contact_email: "choir@csfmmu.org"
    },
    "bible-study": {
      name: "Bible Study",
      description: "Deep dive into God's Word through systematic weekly study.",
      meeting_time: "Every Tuesday, 7:00 PM",
      meeting_location: "Study Room A",
      contact_person: "Bible Study Leader",
      contact_email: "bible.study@csfmmu.org"
    },
    "evangelism": {
      name: "Evangelism",
      description: "Sharing the Gospel on campus and in the community through outreach programs and personal witnessing.",
      meeting_time: "Every Friday, 5:00 PM",
      meeting_location: "Campus Grounds",
      contact_person: "Evangelism Coordinator",
      contact_email: "evangelism@csfmmu.org"
    },
    "intercessory": {
      name: "Intercessory Group",
      description: "Dedicated prayer warriors interceding for the university and community.",
      meeting_time: "Every Wednesday, 6:00 AM",
      meeting_location: "Prayer Room",
      contact_person: "Prayer Coordinator",
      contact_email: "intercessory@csfmmu.org"
    }
  }
  return defaults[ministryId] || {
    name: ministryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: "Ministry description pending update.",
    meeting_time: "TBD",
    meeting_location: "TBD",
    contact_person: "TBD",
    contact_email: "ministry@csfmmu.org"
  }
}

export default function MinistryDetailManagement() {
  const { id } = useParams()
  const ministryId = Array.isArray(id) ? id[0] : id
  const { isAdmin } = useAuth()
  
  const [ministry, setMinistry] = useState<Ministry | null>(null)
  const [loading, setLoading] = useState(true)

  // Sub-collection states
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [resources, setResources] = useState<Resource[]>([])

  // UI States
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditingMinistry, setIsEditingMinistry] = useState(false)
  
  // Dialog States
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null)
  const [isLeaderDialogOpen, setIsLeaderDialogOpen] = useState(false)
  
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)

  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)

  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)

  // File Upload State Helpers
  const [tempImageUrl, setTempImageUrl] = useState<string | undefined>()
  const [tempImagePath, setTempImagePath] = useState<string | undefined>()
  const [tempFileUrl, setTempFileUrl] = useState<string | undefined>()
  const [tempFilePath, setTempFilePath] = useState<string | undefined>()

  useEffect(() => {
    if (isAdmin && ministryId) {
      loadAllData()
    }
  }, [isAdmin, ministryId])

  const loadAllData = async () => {
    if (!ministryId) {
      toast({ title: "Error", description: "No ministry ID provided", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      // 1. Fetch Ministry - create if not exists
      const docRef = doc(db, "ministries", ministryId as string)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        setMinistry({ id: docSnap.id, ...docSnap.data() } as Ministry)
      } else {
        // Create ministry with default data if not exists
        const defaultMinistryData = getDefaultMinistryData(ministryId as string)
        await setDoc(docRef, {
          ...defaultMinistryData,
          slug: ministryId,
          is_active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        setMinistry({ id: ministryId, ...defaultMinistryData } as Ministry)
        toast({ title: "Info", description: "Ministry created with default data" })
      }

      // 2. Fetch Sub-collections
      // Leaders
      const leadersQ = query(collection(db, `ministries/${ministryId}/roles`), orderBy("display_order", "asc"))
      const leadersSnap = await getDocs(leadersQ)
      setLeaders(leadersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Leader[])

      // Members
      const membersSnap = await getDocs(collection(db, `ministries/${ministryId}/members`))
      setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Member[])

      // Schedule
      const scheduleSnap = await getDocs(query(collection(db, `ministries/${ministryId}/schedule`), orderBy("day_of_week", "asc")))
      setSchedule(scheduleSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ScheduleItem[])

      // Activities
      const activitiesSnap = await getDocs(query(collection(db, `ministries/${ministryId}/activities`), orderBy("activity_date", "desc")))
      setActivities(activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Activity[])

      // Resources
      const resourcesSnap = await getDocs(collection(db, `ministries/${ministryId}/resources`))
      setResources(resourcesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[])

    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to load ministry details", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers: Ministry Overview ---
  const handleUpdateMinistry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ministry) return
    const fd = new FormData(e.target as HTMLFormElement)
    try {
      await updateDoc(doc(db, "ministries", ministry.id), {
        name: fd.get("name"),
        description: fd.get("description"),
        meeting_time: fd.get("meeting_time"),
        meeting_location: fd.get("meeting_location"),
        contact_person: fd.get("contact_person"),
        contact_email: fd.get("contact_email"),
        updatedAt: serverTimestamp()
      })
      setMinistry(prev => ({ ...prev!, 
        name: fd.get("name") as string,
        description: fd.get("description") as string,
        meeting_time: fd.get("meeting_time") as string,
        meeting_location: fd.get("meeting_location") as string,
        contact_person: fd.get("contact_person") as string,
        contact_email: fd.get("contact_email") as string,
      }))
      setIsEditingMinistry(false)
      toast({ title: "Success", description: "Ministry details updated" })
    } catch {
      toast({ title: "Error", description: "Failed to update ministry", variant: "destructive" })
    }
  }

  // --- Handlers: Leadership ---
  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = {
      person_name: fd.get("person_name"),
      role_name: fd.get("role_name"),
      person_email: fd.get("person_email"),
      bio: fd.get("bio"),
      display_order: Number(fd.get("display_order") || 0),
      image_url: tempImageUrl || editingLeader?.image_url || null,
      image_path: tempImagePath || editingLeader?.image_path || null,
    }

    try {
      if (editingLeader) {
        await updateDoc(doc(db, `ministries/${ministryId}/roles`, editingLeader.id), { ...data, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, `ministries/${ministryId}/roles`), { ...data, createdAt: serverTimestamp() })
      }
      setIsLeaderDialogOpen(false)
      setEditingLeader(null)
      setTempImageUrl(undefined)
      setTempImagePath(undefined)
      loadAllData() // Reload to refresh list
      toast({ title: "Success", description: "Leader saved" })
    } catch (error) {
      console.error("Save leader error:", error)
      toast({ title: "Error", description: `Failed to save leader: ${(error as Error).message}`, variant: "destructive" })
    }
  }

  const handleDeleteLeader = async (id: string) => {
    try {
      await deleteDoc(doc(db, `ministries/${ministryId}/roles`, id))
      setLeaders(prev => prev.filter(l => l.id !== id))
      toast({ title: "Deleted", description: "Leader removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  // --- Handlers: Members ---
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = {
      name: fd.get("name"),
      role: fd.get("role"),
      email: fd.get("email"),
      joined_date: fd.get("joined_date"),
    }

    try {
      if (editingMember) {
        await updateDoc(doc(db, `ministries/${ministryId}/members`, editingMember.id), { ...data, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, `ministries/${ministryId}/members`), { ...data, createdAt: serverTimestamp() })
      }
      setIsMemberDialogOpen(false)
      setEditingMember(null)
      loadAllData()
      toast({ title: "Success", description: "Member saved" })
    } catch (error) {
      console.error("Save member error:", error)
      toast({ title: "Error", description: `Failed to save member: ${(error as Error).message}`, variant: "destructive" })
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, `ministries/${ministryId}/members`, id))
      setMembers(prev => prev.filter(m => m.id !== id))
      toast({ title: "Deleted", description: "Member removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  // --- Handlers: Schedule ---
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = {
      day_of_week: Number(fd.get("day_of_week")),
      start_time: fd.get("start_time"),
      end_time: fd.get("end_time"),
      location: fd.get("location"),
      venue: fd.get("venue") || null,
      activity_name: fd.get("activity_name"),
      description: fd.get("description"),
      recurring: fd.get("recurring") || null,
    }

    try {
      if (editingSchedule) {
        await updateDoc(doc(db, `ministries/${ministryId}/schedule`, editingSchedule.id), { ...data, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, `ministries/${ministryId}/schedule`), { ...data, createdAt: serverTimestamp() })
      }
      setIsScheduleDialogOpen(false)
      setEditingSchedule(null)
      loadAllData()
      toast({ title: "Success", description: "Schedule item saved" })
    } catch (error) {
      console.error("Save schedule error:", error)
      toast({ title: "Error", description: `Failed to save schedule: ${(error as Error).message}`, variant: "destructive" })
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, `ministries/${ministryId}/schedule`, id))
      setSchedule(prev => prev.filter(s => s.id !== id))
      toast({ title: "Deleted", description: "Schedule item removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  // --- Handlers: Activities ---
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = {
      title: fd.get("title"),
      description: fd.get("description"),
      activity_date: fd.get("activity_date"),
      recurring: fd.get("recurring") || null,
      venue: fd.get("venue") || null,
      image_url: tempImageUrl || editingActivity?.image_url || null,
      image_path: tempImagePath || editingActivity?.image_path || null,
    }

    try {
      if (editingActivity) {
        await updateDoc(doc(db, `ministries/${ministryId}/activities`, editingActivity.id), { ...data, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, `ministries/${ministryId}/activities`), { ...data, createdAt: serverTimestamp() })
      }
      setIsActivityDialogOpen(false)
      setEditingActivity(null)
      setTempImageUrl(undefined)
      setTempImagePath(undefined)
      loadAllData()
      toast({ title: "Success", description: "Activity saved" })
    } catch (error) {
      console.error("Save activity error:", error)
      toast({ title: "Error", description: `Failed to save activity: ${(error as Error).message}`, variant: "destructive" })
    }
  }

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteDoc(doc(db, `ministries/${ministryId}/activities`, id))
      setActivities(prev => prev.filter(a => a.id !== id))
      toast({ title: "Deleted", description: "Activity removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  // --- Handlers: Resources ---
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const data = {
      title: fd.get("title"),
      description: fd.get("description"),
      resource_type: fd.get("resource_type"),
      file_url: tempFileUrl || editingResource?.file_url || null,
      file_path: tempFilePath || editingResource?.file_path || null,
    }

    try {
      if (editingResource) {
        await updateDoc(doc(db, `ministries/${ministryId}/resources`, editingResource.id), { ...data, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, `ministries/${ministryId}/resources`), { ...data, createdAt: serverTimestamp() })
      }
      setIsResourceDialogOpen(false)
      setEditingResource(null)
      setTempFileUrl(undefined)
      setTempFilePath(undefined)
      loadAllData()
      toast({ title: "Success", description: "Resource saved" })
    } catch (error) {
      console.error("Save resource error:", error)
      toast({ title: "Error", description: `Failed to save resource: ${(error as Error).message}`, variant: "destructive" })
    }
  }

  const handleDeleteResource = async (id: string) => {
    try {
      await deleteDoc(doc(db, `ministries/${ministryId}/resources`, id))
      setResources(prev => prev.filter(r => r.id !== id))
      toast({ title: "Deleted", description: "Resource removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!ministry) {
    return <div>Ministry not found</div>
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <AdminBackButton />
        <div>
          <h1 className="text-2xl font-bold">{ministry.name}</h1>
          <p className="text-sm text-gray-500">Manage ministry details</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow">Overview</TabsTrigger>
          <TabsTrigger value="leadership" className="data-[state=active]:bg-white data-[state=active]:shadow">Leadership</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:shadow">Members</TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow">Schedule</TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-white data-[state=active]:shadow">Activities</TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-white data-[state=active]:shadow">Resources</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Ministry Overview</CardTitle>
              <CardDescription>General information about the ministry</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateMinistry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ministry Name</Label>
                    <Input name="name" defaultValue={ministry.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input name="contact_person" defaultValue={ministry.contact_person} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input name="contact_email" defaultValue={ministry.contact_email} />
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Time (Summary)</Label>
                    <Input name="meeting_time" defaultValue={ministry.meeting_time} placeholder="e.g. Every Friday, 5 PM" />
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Location (Summary)</Label>
                    <Input name="meeting_location" defaultValue={ministry.meeting_location} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" rows={5} defaultValue={ministry.description} />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADERSHIP TAB */}
        <TabsContent value="leadership">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Leadership Team</h2>
            <Button onClick={() => { setEditingLeader(null); setIsLeaderDialogOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Leader
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaders.map(leader => (
              <Card key={leader.id}>
                <CardContent className="p-4 flex gap-4">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {leader.image_url ? (
                        <img src={leader.image_url} alt={leader.person_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{leader.person_name}</h3>
                      <p className="text-sm text-blue-600 truncate">{leader.role_name}</p>
                      <p className="text-xs text-gray-500 truncate">{leader.person_email}</p>
                   </div>
                   <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingLeader(leader); setTempImageUrl(leader.image_url); setTempImagePath(leader.image_path); setIsLeaderDialogOpen(true) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteLeader(leader.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isLeaderDialogOpen} onOpenChange={setIsLeaderDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingLeader ? 'Edit Leader' : 'Add Leader'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveLeader} className="space-y-4">
                <Input name="person_name" placeholder="Name" defaultValue={editingLeader?.person_name} required />
                <Input name="role_name" placeholder="Role (e.g. President)" defaultValue={editingLeader?.role_name} required />
                <Input name="person_email" placeholder="Email" defaultValue={editingLeader?.person_email} />
                <Textarea name="bio" placeholder="Short Bio" defaultValue={editingLeader?.bio} />
                <Input name="display_order" type="number" placeholder="Display Order" defaultValue={editingLeader?.display_order || 0} />
                <FileUpload
                  label="Profile Image"
                  folder={`ministries/${ministryId}/leaders`}
                  onUpload={(url, path) => { setTempImageUrl(url); setTempImagePath(path) }}
                  currentUrl={tempImageUrl || editingLeader?.image_url}
                  currentPath={tempImagePath || editingLeader?.image_path}
                />
                <Button type="submit" className="w-full">Save Leader</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Members</h2>
            <Button onClick={() => { setEditingMember(null); setIsMemberDialogOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          </div>
          <div className="bg-white rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">{member.name}</td>
                    <td className="p-3 text-gray-500">{member.role}</td>
                    <td className="p-3 text-gray-500">{member.joined_date}</td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMember(member); setIsMemberDialogOpen(true) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteMember(member.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingMember ? 'Edit Member' : 'Add Member'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveMember} className="space-y-4">
                <Input name="name" placeholder="Name" defaultValue={editingMember?.name} required />
                <Input name="role" placeholder="Role (e.g. Member, Treasurer)" defaultValue={editingMember?.role} />
                <Input name="email" placeholder="Email" defaultValue={editingMember?.email} />
                <div className="space-y-1">
                  <Label>Joined Date</Label>
                  <Input name="joined_date" type="date" defaultValue={editingMember?.joined_date} />
                </div>
                <Button type="submit" className="w-full">Save Member</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* SCHEDULE TAB */}
        <TabsContent value="schedule">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Weekly Schedule</h2>
            <Button onClick={() => { setEditingSchedule(null); setIsScheduleDialogOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Schedule Item
            </Button>
          </div>
          <div className="grid gap-4">
            {schedule.map(item => (
              <Card key={item.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{DAYS[item.day_of_week]}</Badge>
                      <span className="font-bold">{item.activity_name}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex gap-4">
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1"/> {item.start_time} - {item.end_time}</span>
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1"/> {item.location}</span>
                      {item.venue && (
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1"/> Venue: {item.venue}</span>
                      )}
                    </div>
                    {item.recurring && (
                      <p className="text-xs text-blue-600 mt-1">Recurring: {item.recurring}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingSchedule(item); setIsScheduleDialogOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteSchedule(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select name="day_of_week" defaultValue={editingSchedule?.day_of_week.toString()}>
                    <SelectTrigger><SelectValue placeholder="Select Day" /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input name="activity_name" placeholder="Activity Name (e.g. Bible Study)" defaultValue={editingSchedule?.activity_name} required />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Start Time</Label>
                    <Input name="start_time" type="time" defaultValue={editingSchedule?.start_time} required />
                  </div>
                  <div className="flex-1">
                    <Label>End Time</Label>
                    <Input name="end_time" type="time" defaultValue={editingSchedule?.end_time} required />
                  </div>
                </div>
                <Input name="location" placeholder="Location" defaultValue={editingSchedule?.location} />
                <div className="space-y-2">
                  <Label>Venue (Optional)</Label>
                  <Input 
                    name="venue" 
                    type="text" 
                    defaultValue={editingSchedule?.venue || ""}
                    placeholder="e.g., Main Hall, Chapel, Room 101"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Specific venue or room name where activity takes place
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Recurring (Optional)</Label>
                  <Input 
                    name="recurring" 
                    type="text" 
                    defaultValue={editingSchedule?.recurring || ""}
                    placeholder="e.g., Weekly, Monthly, Every Monday"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    For recurring schedules like "Weekly" or "Every Monday"
                  </p>
                </div>
                <Textarea name="description" placeholder="Description" defaultValue={editingSchedule?.description} />
                <Button type="submit" className="w-full">Save Schedule</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ACTIVITIES TAB */}
        <TabsContent value="activities">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Upcoming/Recent Activities</h2>
            <Button onClick={() => { setEditingActivity(null); setIsActivityDialogOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Activity
            </Button>
          </div>
          <div className="grid gap-4">
            {activities.map(activity => (
              <Card key={activity.id}>
                <CardContent className="p-4 flex gap-4">
                  {activity.image_url && (
                    <img src={activity.image_url} alt="" className="w-20 h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-bold">{activity.title}</h3>
                      <Badge>{activity.activity_date}</Badge>
                    </div>
                    {activity.venue && (
                      <p className="text-xs text-purple-600 mt-1">Venue: {activity.venue}</p>
                    )}
                    {activity.recurring && (
                      <p className="text-xs text-blue-600 mt-1">Recurring: {activity.recurring}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingActivity(activity); setTempImageUrl(activity.image_url); setTempImagePath(activity.image_path); setIsActivityDialogOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteActivity(activity.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingActivity ? 'Edit Activity' : 'Add Activity'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveActivity} className="space-y-4">
                <Input name="title" placeholder="Event Title" defaultValue={editingActivity?.title} required />
                <Input name="activity_date" type="date" defaultValue={editingActivity?.activity_date} required />
                <div className="space-y-2">
                  <Label>Venue (Optional)</Label>
                  <Input 
                    name="venue" 
                    type="text" 
                    defaultValue={editingActivity?.venue || ""}
                    placeholder="e.g., Main Hall, Chapel, Conference Room"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Specific venue or room name where activity takes place
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Recurring (Optional)</Label>
                  <Input 
                    name="recurring" 
                    type="text" 
                    defaultValue={editingActivity?.recurring || ""}
                    placeholder="e.g., Weekly, Monthly, Every Friday"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    For recurring activities like "Weekly" or "Every Friday"
                  </p>
                </div>
                <Textarea name="description" placeholder="Description" defaultValue={editingActivity?.description} />
                <FileUpload
                  label="Event Image (Optional)"
                  folder={`ministries/${ministryId}/activities`}
                  onUpload={(url, path) => { setTempImageUrl(url); setTempImagePath(path) }}
                  currentUrl={tempImageUrl || editingActivity?.image_url}
                  currentPath={tempImagePath || editingActivity?.image_path}
                />
                <Button type="submit" className="w-full">Save Activity</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* RESOURCES TAB */}
        <TabsContent value="resources">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Resources</h2>
            <Button onClick={() => { setEditingResource(null); setIsResourceDialogOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Resource
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map(resource => (
              <Card key={resource.id}>
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="p-2 bg-gray-100 rounded">
                    <Download className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{resource.title}</h3>
                    <p className="text-xs text-gray-500">{resource.resource_type}</p>
                    <p className="text-sm text-gray-600 truncate">{resource.description}</p>
                    {resource.file_url && (
                      <a href={resource.file_url} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center mt-2">
                        Download File
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingResource(resource); setTempFileUrl(resource.file_url); setTempFilePath(resource.file_path); setIsResourceDialogOpen(true) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteResource(resource.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveResource} className="space-y-4">
                <Input name="title" placeholder="Resource Title" defaultValue={editingResource?.title} required />
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="resource_type" defaultValue={editingResource?.resource_type || "document"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document (PDF/Doc)</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea name="description" placeholder="Description" defaultValue={editingResource?.description} />
                <FileUpload
                  label="Upload File"
                  folder={`ministries/${ministryId}/resources`}
                  allowedTypes={["application/pdf", "image/*", "audio/*", "video/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}
                  onUpload={(url, path) => { setTempFileUrl(url); setTempFilePath(path) }}
                  currentUrl={tempFileUrl || editingResource?.file_url}
                  currentPath={tempFilePath || editingResource?.file_path}
                />
                <Button type="submit" className="w-full">Save Resource</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

      </Tabs>
    </div>
  )
}
