"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, CheckCircle, X, Clock, AlertTriangle } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"

interface PrayerRequest {
  id: string
  name: string
  email?: string
  request_text: string
  is_anonymous: boolean
  is_urgent: boolean
  status: "active" | "answered" | "archived"
  created_at: string
  updated_at: string
  response_text?: string
  responded_by?: string
  responded_at?: string
}

export default function PrayerRequestsManagement() {
  const { user, isAdmin } = useAuth()
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)
  const [responseText, setResponseText] = useState("")
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    if (user && isAdmin) {
      loadPrayerRequests()
    }
  }, [user, isAdmin])

  const loadPrayerRequests = async () => {
    setLoading(true)
    toast({
      title: "Loading...",
      description: "Please wait while we load prayer requests.",
    })

    try {
      const q = query(collection(db, "prayer_requests"), orderBy("createdAt", "desc"), limit(50))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Handle Firestore timestamp
        created_at: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
      })) as PrayerRequest[]

      setPrayerRequests(data)
    } catch (error) {
      console.error("Error loading prayer requests:", error)
      toast({
        title: "Error",
        description: "Failed to load prayer requests. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToRequest = async () => {
    if (!selectedRequest) return

    setIsResponding(true)
    toast({
      title: "Responding...",
      description: "Please wait while we respond to the prayer request.",
    })

    try {
      const requestRef = doc(db, "prayer_requests", selectedRequest.id)
      await updateDoc(requestRef, {
        status: "answered",
        response_text: responseText,
        responded_by: user?.displayName || user?.email,
        responded_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await loadPrayerRequests()
      setSelectedRequest(null)
      setResponseText("")
      setIsResponding(false)
      toast({
        title: "Success",
        description: "Prayer request responded successfully.",
      })
    } catch (error) {
      console.error("Error responding to prayer request:", error)
      toast({
        title: "Error",
        description: "Failed to respond to prayer request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (id: string, status: "answered" | "archived") => {
    try {
      const requestRef = doc(db, "prayer_requests", id)
      await updateDoc(requestRef, {
        status,
        updatedAt: serverTimestamp(),
      })

      await loadPrayerRequests()
      toast({
        title: "Success",
        description: `Prayer request ${status} successfully.`,
      })
    } catch (error) {
      console.error("Error updating prayer request status:", error)
      toast({
        title: "Error",
        description: "Failed to update prayer request status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prayer request? This action cannot be undone.")) return

    try {
      await deleteDoc(doc(db, "prayer_requests", id))

      await loadPrayerRequests()
      toast({
        title: "Success",
        description: "Prayer request deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting prayer request:", error)
      toast({
        title: "Error",
        description: "Failed to delete prayer request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "answered":
        return <Badge variant="secondary">Answered</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prayer requests...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Prayer Requests Management</h1>
          <p className="mt-2 text-gray-600">View and respond to prayer requests from the community</p>
        </div>

        <div className="space-y-3">
          {prayerRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center justify-between md:px-6"
                onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                aria-expanded={selectedRequest?.id === request.id}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{request.is_anonymous ? "Anonymous" : request.name}</span>
                      <span className="text-xs text-gray-500">{new Date(request.created_at).toLocaleString()}</span>
                    </div>
                    {request.is_urgent && (
                      <Badge variant="destructive" className="flex items-center gap-1 ml-2">
                        <AlertTriangle className="h-3 w-3" />
                        Urgent
                      </Badge>
                    )}
                    <div className="ml-3">{getStatusBadge(request.status)}</div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{request.request_text}</p>
                </div>
                <div className="ml-4 flex-shrink-0 text-xs text-gray-400">{selectedRequest?.id === request.id ? "Hide" : "View"}</div>
              </button>

              {selectedRequest?.id === request.id && (
                <div className="border-t px-4 py-3 md:px-6 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Prayer Request</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{request.request_text}</p>
                    </div>

                    {request.response_text && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-gray-900 mb-1">Response</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{request.response_text}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Responded by: {request.responded_by}</span>
                          <span className="ml-4">{request.responded_at && new Date(request.responded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {request.status === "active" && (
                        <Button size="sm" onClick={() => setSelectedRequest(request)}>
                          Respond
                        </Button>
                      )}
                      {request.status !== "archived" && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(request.id, "archived")}>Archive</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(request.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
