"use client"

import { useEffect, useState, useRef } from "react"
import { db, safeFirestoreOperation } from "@/lib/firebase"
import { collection, getDocs, getCountFromServer } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Calendar, MessageSquare, DollarSign, AlertTriangle, Image as ImageIcon, FileText, Star, Database, Layout, ShieldCheck } from 'lucide-react'
import Link from "next/link"
import { BackButton } from "@/components/back-button"

interface AdminStats {
  totalUsers: number
  totalEvents: number
  totalPrayerRequests: number
  totalDonations: number
  recentMessages: number
  totalAlumni: number
  totalLeaders: number
  totalGallery: number
  totalResources: number
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, adminStatusConfirmed } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalEvents: 0,
    totalPrayerRequests: 0,
    totalDonations: 0,
    recentMessages: 0,
    totalAlumni: 0,
    totalLeaders: 0,
    totalGallery: 0,
    totalResources: 0,
  })
  const statsLoaded = useRef(false)

  useEffect(() => {
    if (authLoading || !adminStatusConfirmed) {
      return
    }

    if (!authLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/auth/login")
        return
      }

      if (!isAdmin) {
        console.log("User is not admin, redirecting to home")
        router.push("/")
        return
      }

      // Guard to prevent duplicate stats loading (quota protection)
      if (statsLoaded.current) return
      statsLoaded.current = true

      console.log("User is admin, loading dashboard data")
      loadStats()
    }
  }, [isAdmin, authLoading, adminStatusConfirmed])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const statsData = await getCachedData(
        CACHE_KEYS.ADMIN_STATS,
        async () => {
          // Helper function to safely get collection count with better error handling
          const safeGetCount = async (collectionName: string): Promise<number> => {
            try {
              const result = await safeFirestoreOperation(async () => {
                const snapshot = await getCountFromServer(collection(db!, collectionName))
                return snapshot.data().count
              }, 3, 1000)
              return result ?? 0
            } catch (error: any) {
              console.warn(`Collection "${collectionName}" not accessible or doesn't exist:`, error?.message || error)
              return 0
            }
          }

          // Get all counts in parallel with error handling
          const [
            totalUsers,
            totalEvents,
            totalPrayerRequests,
            totalDonations,
            recentMessages,
            totalAlumni,
            totalLeaders,
            totalGallery,
            totalResources
          ] = await Promise.all([
            safeGetCount("users"),
            safeGetCount("events"),
            safeGetCount("prayer_requests"),
            safeGetCount("donations"),
            safeGetCount("contact_messages"),
            safeGetCount("alumni"),
            safeGetCount("executive_leaders"),
            safeGetCount("gallery"),
            safeGetCount("spiritual_resources")
          ])

          return {
            totalUsers,
            totalEvents,
            totalPrayerRequests,
            totalDonations,
            recentMessages,
            totalAlumni,
            totalLeaders,
            totalGallery,
            totalResources,
          }
        },
        CACHE_TTL.ADMIN_STATS
      )

      setStats(statsData)

      console.log("Stats loaded successfully:", statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background py-4 sm:py-8 mb-20 lg:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton showHomeButton={true} customText="Back to Site" />

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Manage your Christian Students Fellowship website</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="destructive" className="text-xs">
              Administrator Access
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Total events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prayer Requests</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrayerRequests}</div>
              <p className="text-xs text-muted-foreground">Total prayers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentMessages}</div>
              <p className="text-xs text-muted-foreground">Contact messages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alumni</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlumni}</div>
              <p className="text-xs text-muted-foreground">Registered alumni</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leaders</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeaders}</div>
              <p className="text-xs text-muted-foreground">Leadership team</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gallery</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGallery}</div>
              <p className="text-xs text-muted-foreground">Gallery images</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResources}</div>
              <p className="text-xs text-muted-foreground">Spiritual resources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDonations}</div>
              <p className="text-xs text-muted-foreground">Total donations</p>
            </CardContent>
          </Card>
        </div>

        {/* Homepage Manager Card */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-50/50 border-blue-200">
            <Link href="/admin/homepage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Layout className="h-5 w-5" />
                  Homepage Sections Manager
                </CardTitle>
                <CardDescription className="text-blue-700">Manage all homepage content in one place. View, edit, and delete Events, Alumni, Testimonials, Gallery, Leadership, and Resources.</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/profile-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage users and permissions</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/events">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Management
                </CardTitle>
                <CardDescription>Create and manage events</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/alumni">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Alumni Management
                </CardTitle>
                <CardDescription>Manage alumni profiles</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/resources">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resources
                </CardTitle>
                <CardDescription>Upload and organize resources</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/gallery">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Gallery
                </CardTitle>
                <CardDescription>Manage images and albums</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/testimonials">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Testimonials
                </CardTitle>
                <CardDescription>Collect and feature stories</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/prayer-requests">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Prayer Requests
                </CardTitle>
                <CardDescription>Review and manage requests</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/donations">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Donations
                </CardTitle>
                <CardDescription>Manage campaigns and gifts</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/ministries">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ministries
                </CardTitle>
                <CardDescription>Create and manage ministries</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/leadership">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Leadership
                </CardTitle>
                <CardDescription>Manage executive leaders</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/executives">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Fellowship Executives
                </CardTitle>
                <CardDescription>Manage executive tenures and members</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/about-content">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  About Page Content
                </CardTitle>
                <CardDescription>Manage mission, vision, and core values</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/messages">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>Contact form submissions</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-orange-200 bg-orange-50/50">
            <Link href="/admin/seed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Database className="h-5 w-5" />
                  Seed Database
                </CardTitle>
                <CardDescription>Add mockup data for testing</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
