"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { logAdminAction } from "@/lib/admin-logger"
import { AdminBackButton } from "@/components/admin-back-button"
import { FileUpload } from "@/components/file-upload"

interface Event {
  id: string
  title: string
  description: string
  eventDate?: string
  recurringDate?: string
  time?: string
  timeRange?: string
  location: string
  venue?: string
  imageUrl?: string
  imagePath?: string
  isFeatured: boolean
  isActive: boolean
  registrationRequired?: boolean
  eventType: "regular" | "special" | "weekly" | "monthly"
  display_order?: number
  createdAt: any
}

export default function EventsManagement() {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [eventImageUrl, setEventImageUrl] = useState<string | undefined>(undefined)
  const [eventImagePath, setEventImagePath] = useState<string | undefined>(undefined)
  const [eventType, setEventType] = useState<"regular" | "special" | "weekly" | "monthly">("regular")

  useEffect(() => {
    if (user && isAdmin) {
      setLoading(true)
      toast({
        title: "Loading...",
        description: "Please wait while we load the events.",
      })
      loadEvents()
    }
  }, [user, isAdmin])

  const loadEvents = async () => {
    try {
      const q = query(collection(db, "events"), orderBy("eventDate", "asc"), limit(50))
      const querySnapshot = await getDocs(q)
      const list: Event[] = []
      querySnapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Event))
      setEvents(list)
    } catch (error) {
      console.error("Error loading events:", error)
      toast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    setIsUpdating(true)
    try {
      await addDoc(collection(db, "events"), {
        title: formData.get("title"),
        description: formData.get("description"),
        eventDate: eventType === "special" ? formData.get("date") : null,
        recurringDate: formData.get("recurringDate") || null,
        time: eventType === "special" ? formData.get("time") : null,
        timeRange: eventType !== "special" ? formData.get("timeRange") : null,
        location: formData.get("location"),
        venue: formData.get("venue") || null,
        imageUrl: eventImageUrl || "",
        imagePath: eventImagePath || "",
        isFeatured: formData.get("isFeatured") === "on",
        isActive: formData.get("isActive") === "on",
        registrationRequired: formData.get("registrationRequired") === "on",
        eventType: eventType,
        display_order: Number(formData.get("display_order")) || 0,
        createdAt: serverTimestamp()
      })

      await loadEvents()
      
      if (user) {
        await logAdminAction(
          user.uid,
          user.email || "Unknown",
          "CREATE_EVENT",
          `Created event: ${formData.get("title")}`
        )
      }

      setIsAddingEvent(false)
      setEventImageUrl(undefined)
      setEventImagePath(undefined)
      toast({
        title: "Success",
        description: "Event added successfully.",
      })
    } catch (error) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: "Failed to add event.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentEvent) return

    setIsUpdating(true)
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      await updateDoc(doc(db, "events", currentEvent.id), {
        title: formData.get("title"),
        description: formData.get("description"),
        eventDate: currentEvent.eventType === "special" ? formData.get("date") : null,
        recurringDate: formData.get("recurringDate") || null,
        time: currentEvent.eventType === "special" ? formData.get("time") : null,
        timeRange: currentEvent.eventType !== "special" ? formData.get("timeRange") : null,
        location: formData.get("location"),
        venue: formData.get("venue") || null,
        imageUrl: eventImageUrl || currentEvent.imageUrl || "",
        imagePath: eventImagePath || currentEvent.imagePath || "",
        isFeatured: formData.get("isFeatured") === "on",
        isActive: formData.get("isActive") === "on",
        registrationRequired: formData.get("registrationRequired") === "on",
        eventType: currentEvent.eventType,
        display_order: Number(formData.get("display_order")) || 0,
        updatedAt: serverTimestamp()
      })

      await loadEvents()
      setIsEditingEvent(false)
      setCurrentEvent(null)
      setEventImageUrl(undefined)
      setEventImagePath(undefined)
      toast({
        title: "Success",
        description: "Event updated successfully.",
      })
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "Failed to update event.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    setIsUpdating(true)
    toast({
      title: "Deleting...",
      description: "Please wait while we delete the event.",
    })

    try {
      await deleteDoc(doc(db, "events", id))
      await loadEvents()
      toast({
        title: "Success",
        description: "Event deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBackButton iconOnly />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="mt-2 text-gray-600">Manage church events and activities</p>
        </div>

        <div className="mb-6">
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="space-y-4">
                  <Label>Event Type</Label>
                  <Select value={eventType} onValueChange={(value) => setEventType(value as "regular" | "special" | "weekly" | "monthly")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Event</SelectItem>
                      <SelectItem value="special">Special Event</SelectItem>
                      <SelectItem value="weekly">Weekly Event</SelectItem>
                      <SelectItem value="monthly">Monthly Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {eventType === "regular" ? "For recurring activities like Bible study, prayer meetings" : "For one-time special events like conferences, revivals"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input 
                      name="display_order" 
                      type="number" 
                      placeholder="1, 2, 3..." 
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Order in which events appear on homepage (lower numbers appear first)
                    </p>
                  </div>
                  {eventType === "special" && (
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input name="date" type="date" required />
                    </div>
                  )}
                  {eventType !== "special" && (
                    <div className="space-y-2">
                      <Label>Recurring (Optional)</Label>
                      <Input 
                        name="recurringDate" 
                        type="text" 
                        placeholder="e.g., Everyday, Every Monday, Weekly"
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        For recurring events like "Everyday" or "Every Monday"
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eventType === "special" ? (
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input name="time" type="time" required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Time Range</Label>
                      <Input 
                        name="timeRange" 
                        type="text" 
                        placeholder="e.g., 5:00pm - 6:00pm"
                        className="text-sm"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Format: "5:00pm - 6:00pm" for regular events
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input name="location" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Venue (Optional)</Label>
                    <Input 
                      name="venue" 
                      type="text" 
                      placeholder="e.g., Main Auditorium, Chapel, Conference Room"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Specific venue or hall name where event will take place
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select name="eventType" defaultValue={eventType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="special">Special Event</SelectItem>
                        <SelectItem value="weekly">Weekly Event</SelectItem>
                        <SelectItem value="monthly">Monthly Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" rows={3} required />
                </div>
                <FileUpload
                  label="Event Image"
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
                    setEventImageUrl(url)
                    setEventImagePath(path)
                  }}
                  folder="events"
                />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isFeatured" className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="registrationRequired" className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Registration Required</span>
                  </label>
                </div>
                <Button type="submit" disabled={isUpdating} className="w-full bg-red-600">
                  {isUpdating ? "Processing..." : "Add Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden shadow-sm">
              {event.imageUrl && (
                <div className="h-40 sm:h-48 bg-gray-200">
                  <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base sm:text-lg">{event.title}</CardTitle>
                  <div className="flex gap-1">
                    {event.isFeatured && <Badge className="bg-red-600 text-[10px]">Featured</Badge>}
                    <Badge variant={event.eventType === "regular" ? "default" : "secondary"} className="ml-2">
                      {event.eventType === "regular" ? "🔄 Regular" : event.eventType === "special" ? "⭐ Special" : event.eventType === "weekly" ? "📅 Weekly" : "📆 Monthly"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {event.eventDate && (
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.eventDate).toLocaleDateString()}</p>
                  )}
                  {event.recurringDate && (
                    <p className="text-xs text-blue-600 flex items-center gap-1"><Calendar className="h-3 w-3" /> {event.recurringDate}</p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {event.timeRange || event.time}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</p>
                  {event.venue && (
                    <p className="text-xs text-purple-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> Venue: {event.venue}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setCurrentEvent(event); setIsEditingEvent(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DeleteButton
                    itemId={event.id}
                    onDelete={handleDeleteEvent}
                    itemName={`event "${event.title}"`}
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

      {/* Edit Dialog */}
      <Dialog open={isEditingEvent} onOpenChange={setIsEditingEvent}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          {currentEvent && (
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="space-y-4">
                <Label>Event Type</Label>
                <Select value={currentEvent.eventType} onValueChange={(value) => setCurrentEvent(prev => prev ? {...prev, eventType: value as "regular" | "special" | "weekly" | "monthly"} : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Event</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                    <SelectItem value="weekly">Weekly Event</SelectItem>
                    <SelectItem value="monthly">Monthly Event</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {currentEvent.eventType === "regular" ? "For recurring activities like Bible study, prayer meetings" : "For one-time special events like conferences, revivals"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input name="title" defaultValue={currentEvent.title} required />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    name="display_order" 
                    type="number" 
                    defaultValue={currentEvent.display_order || 0}
                    placeholder="1, 2, 3..." 
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Order in which events appear on homepage (lower numbers appear first)
                  </p>
                </div>
                {currentEvent.eventType === "special" && (
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input name="date" type="date" defaultValue={currentEvent.eventDate} required />
                  </div>
                )}
                {currentEvent.eventType !== "special" && (
                  <div className="space-y-2">
                    <Label>Recurring (Optional)</Label>
                    <Input 
                      name="recurringDate" 
                      type="text" 
                      defaultValue={currentEvent.recurringDate || ""}
                      placeholder="e.g., Everyday, Every Monday, Weekly"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      For recurring events like "Everyday" or "Every Monday"
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentEvent.eventType === "special" ? (
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input name="time" type="time" defaultValue={currentEvent.time} required />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Time Range</Label>
                    <Input 
                      name="timeRange" 
                      type="text" 
                      defaultValue={currentEvent.timeRange || ""}
                      placeholder="e.g., 5:00pm - 6:00pm"
                      className="text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Format: "5:00pm - 6:00pm" for regular events
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input name="location" defaultValue={currentEvent.location} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Venue (Optional)</Label>
                  <Input 
                    name="venue" 
                    type="text" 
                    defaultValue={currentEvent.venue || ""}
                    placeholder="e.g., Main Auditorium, Chapel, Conference Room"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Specific venue or hall name where event will take place
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" rows={3} defaultValue={currentEvent.description} required />
              </div>
              <FileUpload
                label="Event Image"
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
                  setEventImageUrl(url)
                  setEventImagePath(path)
                }}
                currentUrl={eventImageUrl || currentEvent.imageUrl}
                currentPath={eventImagePath || currentEvent.imagePath}
                folder="events"
              />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isActive" defaultChecked={currentEvent.isActive} className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="isFeatured" defaultChecked={currentEvent.isFeatured} className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="registrationRequired" defaultChecked={currentEvent.registrationRequired} className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Registration Required</span>
                </label>
              </div>
              <Button type="submit" disabled={isUpdating} className="w-full bg-red-600">
                {isUpdating ? "Updating..." : "Update Event"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
