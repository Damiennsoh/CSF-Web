"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Phone, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  User,
  Edit,
  Camera,
  Users,
  Calendar
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"
import { CloudinaryStorageService } from "@/lib/cloudinary-storage"
import { AdminBackButton } from "@/components/admin-back-button"

interface Executive {
  id: string
  name: string
  role: string
  profession?: string
  location?: string
  phone?: string
  photo?: string
  photo_path?: string
  photo_resource_type?: string
  created_at: string
}

interface ExecutiveTenure {
  id: string
  yearName: string
  description?: string
  members: Executive[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ExecutivesManagement() {
  const { user, isAdmin } = useAuth()
  const [tenures, setTenures] = useState<ExecutiveTenure[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [isAddingTenure, setIsAddingTenure] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isEditingMember, setIsEditingMember] = useState(false)
  const [isEditingTenure, setIsEditingTenure] = useState(false)
  
  // Form states
  const [newTenureName, setNewTenureName] = useState("")
  const [newTenureDescription, setNewTenureDescription] = useState("")
  const [currentTenure, setCurrentTenure] = useState<ExecutiveTenure | null>(null)
  const [currentMember, setCurrentMember] = useState<Executive | null>(null)
  const [currentTenureId, setCurrentTenureId] = useState<string>("")
  
  // Member form states
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [memberProfession, setMemberProfession] = useState("")
  const [memberLocation, setMemberLocation] = useState("")
  const [memberPhone, setMemberPhone] = useState("")
  const [memberPhotoUrl, setMemberPhotoUrl] = useState<string | undefined>(undefined)
  const [memberPhotoPath, setMemberPhotoPath] = useState<string | undefined>(undefined)
  const [memberPhotoResourceType, setMemberPhotoResourceType] = useState<string | undefined>(undefined)
  const [isUpdating, setIsUpdating] = useState(false)
  const subscribed = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!isAdmin) return
    mounted.current = true
    loadTenures()
    return () => { mounted.current = false }
  }, [isAdmin])

  const loadTenures = () => {
    if (!isAdmin) return
    if (subscribed.current) return
    subscribed.current = true
    
    try {
      const q = query(
        collection(db!, "executive_tenures"),
        orderBy("yearName", "desc"),
        limit(50)
      )
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!mounted.current) return
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExecutiveTenure[]
        
        setTenures(data)
        setLoading(false)
      }, (error) => {
        if (!mounted.current) return
        console.error("Error loading tenures:", error)
        toast({
          title: "Error",
          description: "Failed to load executive tenures",
          variant: "destructive"
        })
        setLoading(false)
      })

      return () => {
        subscribed.current = false
        unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up tenures listener:", error)
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleTenureActive = async (tenureId: string, currentStatus: boolean) => {
    setIsUpdating(true)
    try {
      // If activating this tenure, deactivate all others first
      if (!currentStatus) {
        const deactivatePromises = tenures
          .filter(t => t.id !== tenureId && t.is_active)
          .map(t => updateDoc(doc(db!, "executive_tenures", t.id), {
            is_active: false,
            updated_at: new Date().toISOString()
          }))
        
        await Promise.all(deactivatePromises)
      }

      // Then toggle the current tenure
      await updateDoc(doc(db!, "executive_tenures", tenureId), {
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      })

      toast({
        title: "Success",
        description: `Tenure status has been updated`
      })
    } catch (error) {
      console.error("Error toggling tenure status:", error)
      toast({
        title: "Error",
        description: "Failed to update tenure status",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const addNewTenure = async () => {
    if (!newTenureName.trim()) return
    
    setIsUpdating(true)
    try {
      await addDoc(collection(db!, "executive_tenures"), {
        yearName: newTenureName.trim(),
        description: newTenureDescription.trim(),
        members: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      toast({
        title: "Success",
        description: `Tenure "${newTenureName}" has been created`
      })
      
      setNewTenureName("")
      setNewTenureDescription("")
      setIsAddingTenure(false)
    } catch (error) {
      console.error("Error adding tenure:", error)
      toast({
        title: "Error",
        description: "Failed to create tenure",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteTenure = async (tenureId: string) => {
    if (!confirm("Are you sure you want to delete this entire executive tenure? This action cannot be undone.")) {
      return
    }
    
    try {
      await deleteDoc(doc(db!, "executive_tenures", tenureId))
      toast({
        title: "Success",
        description: "Tenure has been deleted"
      })
    } catch (error) {
      console.error("Error deleting tenure:", error)
      toast({
        title: "Error",
        description: "Failed to delete tenure",
        variant: "destructive"
      })
    }
  }

  const updateTenure = async () => {
    if (!newTenureName.trim() || !currentTenureId) return
    
    setIsUpdating(true)
    try {
      const tenureRef = doc(db!, "executive_tenures", currentTenureId)
      
      await updateDoc(tenureRef, {
        yearName: newTenureName.trim(),
        description: newTenureDescription.trim(),
        updated_at: new Date().toISOString()
      })
      
      toast({
        title: "Success",
        description: "Tenure has been updated"
      })
      
      // Reset form
      setNewTenureName("")
      setNewTenureDescription("")
      setCurrentTenureId("")
      setIsEditingTenure(false)
    } catch (error) {
      console.error("Error updating tenure:", error)
      toast({
        title: "Error",
        description: "Failed to update tenure",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const addMemberToTenure = async () => {
    if (!memberName.trim() || !memberRole.trim() || !currentTenureId) return
    
    setIsUpdating(true)
    try {
      const newMember: Executive = {
        id: crypto.randomUUID(),
        name: memberName.trim(),
        role: memberRole.trim(),
        created_at: new Date().toISOString()
      }
      
      // Only add fields that have values
      if (memberProfession.trim()) {
        newMember.profession = memberProfession.trim()
      }
      if (memberLocation.trim()) {
        newMember.location = memberLocation.trim()
      }
      if (memberPhone.trim()) {
        newMember.phone = memberPhone.trim()
      }
      if (memberPhotoUrl) {
        newMember.photo = memberPhotoUrl
      }
      if (memberPhotoPath) {
        newMember.photo_path = memberPhotoPath
      }
      if (memberPhotoResourceType) {
        newMember.photo_resource_type = memberPhotoResourceType
      }
      
      const tenureRef = doc(db!, "executive_tenures", currentTenureId)
      const tenure = tenures.find(t => t.id === currentTenureId)
      
      if (tenure) {
        await updateDoc(tenureRef, {
          members: [...tenure.members, newMember],
          updated_at: new Date().toISOString()
        })
        
        toast({
          title: "Success",
          description: `${memberName} has been added to the executive team`
        })
        
        // Reset form
        setMemberName("")
        setMemberRole("")
        setMemberProfession("")
        setMemberLocation("")
        setMemberPhone("")
        setMemberPhotoUrl(undefined)
        setMemberPhotoPath(undefined)
        setMemberPhotoResourceType(undefined)
        setIsAddingMember(false)
        setCurrentTenureId("")
      }
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: "Failed to add executive member",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateMember = async () => {
    if (!currentMember || !currentTenureId) return
    
    setIsUpdating(true)
    try {
      const updatedMember: Executive = {
        id: currentMember.id,
        name: memberName.trim(),
        role: memberRole.trim(),
        created_at: currentMember.created_at
      }
      
      // Only update fields that have values
      if (memberProfession.trim()) {
        updatedMember.profession = memberProfession.trim()
      }
      if (memberLocation.trim()) {
        updatedMember.location = memberLocation.trim()
      }
      if (memberPhone.trim()) {
        updatedMember.phone = memberPhone.trim()
      }
      if (memberPhotoUrl) {
        updatedMember.photo = memberPhotoUrl
      }
      if (memberPhotoPath) {
        updatedMember.photo_path = memberPhotoPath
      }
      
      const tenureRef = doc(db!, "executive_tenures", currentTenureId)
      const tenure = tenures.find(t => t.id === currentTenureId)
      
      if (tenure) {
        const updatedMembers = tenure.members.map(m => 
          m.id === currentMember.id ? updatedMember : m
        )
        
        await updateDoc(tenureRef, {
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        
        toast({
          title: "Success",
          description: `${memberName} has been updated`
        })
        
        // Reset form
        setMemberName("")
        setMemberRole("")
        setMemberProfession("")
        setMemberLocation("")
        setMemberPhone("")
        setMemberPhotoUrl(undefined)
        setMemberPhotoPath(undefined)
        setIsEditingMember(false)
        setCurrentMember(null)
        setCurrentTenureId("")
      }
    } catch (error) {
      console.error("Error updating member:", error)
      toast({
        title: "Error",
        description: "Failed to update executive member",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const removeMember = async (tenureId: string, memberId: string) => {
    if (!confirm("Are you sure you want to remove this executive member?")) {
      return
    }
    
    try {
      const tenureRef = doc(db!, "executive_tenures", tenureId)
      const tenure = tenures.find(t => t.id === tenureId)
      
      if (tenure) {
        const updatedMembers = tenure.members.filter(m => m.id !== memberId)
        
        await updateDoc(tenureRef, {
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        
        toast({
          title: "Success",
          description: "Executive member has been removed"
        })
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove executive member",
        variant: "destructive"
      })
    }
  }

  const openAddMemberDialog = (tenureId: string) => {
    setCurrentTenureId(tenureId)
    setIsAddingMember(true)
  }

  const openEditMemberDialog = (tenureId: string, member: Executive) => {
    setCurrentTenureId(tenureId)
    setCurrentMember(member)
    setMemberName(member.name)
    setMemberRole(member.role)
    setMemberProfession(member.profession || "")
    setMemberLocation(member.location || "")
    setMemberPhone(member.phone || "")
    setMemberPhotoUrl(member.photo)
    setMemberPhotoPath(member.photo_path)
    setIsEditingMember(true)
  }

  const openEditTenureDialog = (tenure: ExecutiveTenure) => {
    setCurrentTenureId(tenure.id)
    setNewTenureName(tenure.yearName)
    setNewTenureDescription(tenure.description || "")
    setIsEditingTenure(true)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
            <AdminBackButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading executive tenures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <AdminBackButton />
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mt-4">
            <ShieldCheck className="w-8 h-8" />
            Executives Management
          </h1>
          <p className="text-gray-600 mt-2">Manage executive tenures and member profiles</p>
        </div>

        {/* Add Tenure Button */}
        <div className="mb-8">
          <Dialog open={isAddingTenure} onOpenChange={setIsAddingTenure}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add New Tenure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw]">
              <DialogHeader>
                <DialogTitle>Add New Executive Tenure</DialogTitle>
                <DialogDescription>
                  Create a new executive tenure period (e.g., 2023/2024)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tenure-name">Tenure Name</Label>
                  <Input
                    id="tenure-name"
                    placeholder="e.g., 2023/2024 Tenure"
                    value={newTenureName}
                    onChange={(e) => setNewTenureName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenure-description">Description (Optional)</Label>
                  <Textarea
                    id="tenure-description"
                    placeholder="Brief description of this tenure period..."
                    value={newTenureDescription}
                    onChange={(e) => setNewTenureDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingTenure(false)}>
                  Cancel
                </Button>
                <Button onClick={addNewTenure} disabled={isUpdating}>
                  {isUpdating ? "Creating..." : "Create Tenure"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tenures List */}
        <div className="space-y-4">
          {tenures.length === 0 && (
            <Card className="text-center py-20">
              <CardContent>
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Executive Tenures</h3>
                <p className="text-gray-500 mb-4">Start by adding your first executive tenure</p>
                <Button onClick={() => setIsAddingTenure(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Tenure
                </Button>
              </CardContent>
            </Card>
          )}

          {tenures.map((tenure) => (
            <Card 
              key={tenure.id} 
              className={`transition-all duration-300 overflow-hidden ${
                expandedId === tenure.id 
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Card Header (Folded Part) */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(tenure.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tenure.yearName}</h3>
                      <div className="text-sm text-gray-500">
                        {tenure.members?.length || 0} Executive Members
                        {tenure.is_active && (
                          <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                      <div className="sm:hidden flex items-center gap-2 mt-2">
                        <Label htmlFor={`active-mobile-${tenure.id}`} className="text-xs text-gray-600">Active</Label>
                        <Switch
                          id={`active-mobile-${tenure.id}`}
                          checked={tenure.is_active}
                          onCheckedChange={(checked: boolean) => toggleTenureActive(tenure.id, tenure.is_active)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2">
                      <Label htmlFor={`active-${tenure.id}`} className="text-xs text-gray-600">Active</Label>
                      <Switch
                        id={`active-${tenure.id}`}
                        checked={tenure.is_active}
                        onCheckedChange={(checked: boolean) => toggleTenureActive(tenure.id, tenure.is_active)}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditTenureDialog(tenure)
                        }}
                        className="bg-white shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddMemberDialog(tenure.id)
                        }}
                        className="bg-white shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTenure(tenure.id)
                        }}
                        className="bg-white shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {expandedId === tenure.id ? 
                      <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    }
                  </div>
                </div>
              </div>

              {/* Card Content (Expanded Part) */}
              {expandedId === tenure.id && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  {tenure.description && (
                    <p className="text-gray-600 mb-6 italic">{tenure.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tenure.members?.map((member) => (
                      <Card key={member.id} className="group relative">
                        <CardContent className="p-4">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 lg:opacity-100 lg:group-hover:opacity-100">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => openEditMemberDialog(tenure.id, member)}
                              className="bg-white shadow-sm"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => removeMember(tenure.id, member.id)}
                              className="bg-white shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex gap-4">
                            <div className="relative w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                  <span className="text-white font-bold text-lg">
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate">{member.name}</h4>
                              <p className="text-blue-600 text-sm font-semibold mb-2">{member.role}</p>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                {member.profession && (
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{member.profession}</span>
                                  </div>
                                )}
                                {member.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{member.location}</span>
                                  </div>
                                )}
                                {member.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-blue-600 font-medium">{member.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button 
                      variant="outline"
                      onClick={() => openAddMemberDialog(tenure.id)}
                      className="border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50/50 h-auto py-8"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Plus className="w-6 h-6" />
                        <span className="text-sm font-medium">Add Executive Member</span>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Add Executive Member</DialogTitle>
            <DialogDescription>
              Add a new executive member to the tenure
            </DialogDescription>
          </DialogHeader>
          <form id="executive-member-form" onSubmit={(e) => { e.preventDefault(); addMemberToTenure(); }} className="px-6 pb-6 overflow-y-auto flex-1 max-h-[60vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="member-name">Full Name *</Label>
                  <Input
                    id="member-name"
                    placeholder="Enter full name"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="member-role">Role/Position *</Label>
                  <Input
                    id="member-role"
                    placeholder="e.g., President, Secretary, Treasurer"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="member-profession">Current Profession</Label>
                  <Input
                    id="member-profession"
                    placeholder="e.g., Software Engineer, Doctor, Teacher"
                    value={memberProfession}
                    onChange={(e) => setMemberProfession(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="member-location">Current Location</Label>
                  <Input
                    id="member-location"
                    placeholder="e.g., Lagos, Nigeria; London, UK"
                    value={memberLocation}
                    onChange={(e) => setMemberLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="member-phone">Phone Number</Label>
                <Input
                  id="member-phone"
                  placeholder="e.g., +234 801 234 5678"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
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
                  setMemberPhotoUrl(url)
                  setMemberPhotoPath(path)
                }}
                onRemove={() => {
                  setMemberPhotoUrl(undefined)
                  setMemberPhotoPath(undefined)
                }}
                currentUrl={memberPhotoUrl}
                currentPath={memberPhotoPath}
                folder="executives"
                bucket="uploads"
                overwritePath={currentMember?.photo_path} // Use existing path for overwrite
                showDelete={false} // Disable delete to avoid Cloudinary errors
              />
            </div>
          </form>
          <DialogFooter className="p-6 pt-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsAddingMember(false)}>
              Cancel
            </Button>
            <Button type="submit" form="executive-member-form" disabled={isUpdating}>
              {isUpdating ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditingMember} onOpenChange={setIsEditingMember}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Edit Executive Member</DialogTitle>
            <DialogDescription>
              Update executive member information
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto flex-1 max-h-[60vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-member-name">Full Name *</Label>
                  <Input
                    id="edit-member-name"
                    placeholder="Enter full name"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-member-role">Role/Position *</Label>
                  <Input
                    id="edit-member-role"
                    placeholder="e.g., President, Secretary, Treasurer"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-member-profession">Current Profession</Label>
                  <Input
                    id="edit-member-profession"
                    placeholder="e.g., Software Engineer, Doctor, Teacher"
                    value={memberProfession}
                    onChange={(e) => setMemberProfession(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-member-location">Current Location</Label>
                  <Input
                    id="edit-member-location"
                    placeholder="e.g., Lagos, Nigeria; London, UK"
                    value={memberLocation}
                    onChange={(e) => setMemberLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-member-phone">Phone Number</Label>
                <Input
                  id="edit-member-phone"
                  placeholder="e.g., +234 801 234 5678"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
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
                  setMemberPhotoUrl(url)
                  setMemberPhotoPath(path)
                }}
                onRemove={() => {
                  setMemberPhotoUrl(undefined)
                  setMemberPhotoPath(undefined)
                }}
                currentUrl={memberPhotoUrl}
                currentPath={memberPhotoPath}
                folder="executives"
                bucket="uploads"
                overwritePath={currentMember?.photo_path} // Use existing path for overwrite
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditingMember(false)}>
              Cancel
            </Button>
            <Button onClick={updateMember} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenure Dialog */}
      <Dialog open={isEditingTenure} onOpenChange={setIsEditingTenure}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Edit Executive Tenure</DialogTitle>
            <DialogDescription>
              Update executive tenure information
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto flex-1 max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-tenure-name">Tenure Name *</Label>
                <Input
                  id="edit-tenure-name"
                  placeholder="e.g., 2024/2025 Tenure"
                  value={newTenureName}
                  onChange={(e) => setNewTenureName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-tenure-description">Description</Label>
                <Textarea
                  id="edit-tenure-description"
                  placeholder="Brief description of this executive tenure..."
                  value={newTenureDescription}
                  onChange={(e) => setNewTenureDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditingTenure(false)}>
              Cancel
            </Button>
            <Button onClick={updateTenure} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Tenure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
