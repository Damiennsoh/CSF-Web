"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BackButton } from "@/components/back-button"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Edit, Save, X, Shield, Loader2, Key, Lock, CheckCircle2 } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  address?: string
  course?: string
  yearOfStudy?: string
  interests?: string
  skills?: string
  bio?: string
  isAdmin: boolean
  createdAt: string
  updatedAt?: string
}

export default function ProfilePage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    course: "",
    yearOfStudy: "",
    interests: "",
    skills: "",
    bio: "",
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      loadProfile()
    }
  }, [user, authLoading, router])

  const loadProfile = async () => {
    if (!user) return
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile
        setProfile({ ...data, id: userDoc.id })
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          address: data.address || "",
          course: data.course || "",
          yearOfStudy: data.yearOfStudy || "",
          interests: data.interests || "",
          skills: data.skills || "",
          bio: data.bio || "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      setResetSent(true)
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions.",
      })
      setTimeout(() => setResetSent(false), 5000)
    } catch (error: any) {
      console.error("Reset error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      })
    } finally {
      setResetLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      })
      await loadProfile()
      setEditing(false)
      toast({ title: "Profile Updated" })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({ title: "Update failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 mb-20 lg:mb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />

        <div className="mb-6 sm:mb-8 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                {profile.fullName ? profile.fullName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.fullName || 'User Profile'}</h1>
                <p className="text-xs sm:text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && <Badge variant="destructive" className="text-[10px]">Admin</Badge>}
              {!editing ? (
                <Button onClick={() => setEditing(true)} size="sm" className="bg-red-600">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleSave} size="sm" disabled={saving} className="flex-1 sm:flex-none">
                    <Save className="h-4 w-4 mr-2" /> {saving ? '...' : 'Save'}
                  </Button>
                  <Button onClick={() => setEditing(false)} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Personal info */}
            <Card className="shadow-sm overflow-hidden border-t-4 border-t-red-600">
              <CardHeader className="p-4 sm:p-6 bg-red-50/50">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" /> Security
                </CardTitle>
                <CardDescription className="text-xs">Manage your account protection</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Lock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Password</p>
                      <p className="text-[10px] text-gray-500 font-medium">Last updated recently</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl text-xs font-bold border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300"
                    onClick={handleResetPassword}
                    disabled={resetLoading || resetSent}
                  >
                    {resetLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : resetSent ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    {resetSent ? "Reset Email Sent!" : "Change Password"}
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center italic font-medium px-2 leading-relaxed">
                    * This will send a secure password reset link to your registered email address.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2"><User className="h-5 w-5 text-red-600" /> Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Full Name</Label>
                    {editing ? <Input value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} /> : <p className="text-sm font-medium">{profile.fullName || '—'}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Phone</Label>
                    {editing ? <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} /> : <p className="text-sm font-medium">{profile.phone || '—'}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Address</Label>
                  {editing ? <Input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} /> : <p className="text-sm font-medium">{profile.address || '—'}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Academic info */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-red-600" /> Academic Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Course</Label>
                    {editing ? <Input value={formData.course} onChange={e => handleInputChange('course', e.target.value)} /> : <p className="text-sm font-medium">{profile.course || '—'}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Year</Label>
                    {editing ? (
                      <Select value={formData.yearOfStudy} onValueChange={v => handleInputChange('yearOfStudy', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <p className="text-sm font-medium">{profile.yearOfStudy || '—'}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio & interests */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Bio & Interests</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">About Me</Label>
                  {editing ? <Textarea value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} rows={3} /> : <p className="text-sm text-gray-700 leading-relaxed">{profile.bio || 'No bio yet.'}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2">
                <Button variant="outline" className="w-full justify-start h-10 text-xs" asChild><a href="/ministries">Ministries</a></Button>
                <Button variant="outline" className="w-full justify-start h-10 text-xs" asChild><a href="/events">Events</a></Button>
                {isAdmin && (
                  <>
                    <Separator className="my-2" />
                    <Button variant="destructive" className="w-full justify-start h-10 text-xs" asChild><a href="/admin">Admin Dashboard</a></Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
