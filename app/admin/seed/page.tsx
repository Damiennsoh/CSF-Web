"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from "firebase/firestore"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// Helper functions
function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

function getPastDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

// Seed data
const eventsData = [
  {
    title: "Easter Fellowship Celebration",
    description: "Join us for a special Easter celebration with worship, fellowship, and a shared meal.",
    eventDate: getFutureDate(14),
    time: "10:00 AM",
    location: "MMU Main Auditorium, Block A",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: true,
    eventType: "special",
  },
  {
    title: "Weekly Bible Study",
    description: "Deep dive into God's Word with our weekly Bible study sessions.",
    eventDate: getFutureDate(3),
    time: "6:00 PM",
    location: "CSF Prayer Room, Building C",
    imageUrl: "",
    imagePath: "",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
  },
  {
    title: "Youth Leadership Conference",
    description: "A two-day conference focused on developing student leaders for Christ.",
    eventDate: getFutureDate(30),
    time: "9:00 AM",
    location: "MMU Conference Hall",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: true,
    eventType: "special",
  },
  {
    title: "Morning Prayer Meeting",
    description: "Start your day with prayer and devotion every weekday morning.",
    eventDate: getFutureDate(1),
    time: "6:30 AM",
    location: "CSF Chapel",
    imageUrl: "",
    imagePath: "",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
  },
  {
    title: "Worship Night",
    description: "An evening dedicated to worship and praise with the CSF Choir.",
    eventDate: getFutureDate(7),
    time: "7:00 PM",
    location: "MMU Open Theatre",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: false,
    eventType: "special",
  }
]

const alumniData = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+91-98765-43210",
    graduation_year: 2023,
    degree: "B.Tech Computer Science",
    current_occupation: "Software Engineer",
    current_position: "Software Engineer",
    location: "Bangalore, India",
    company_organization: "Google India",
    bio: "Former CSF President who led the fellowship through significant growth.",
    testimony: "CSF taught me that faith and professional excellence can go hand in hand.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
  },
  {
    name: "David Kumar",
    email: "david.kumar@example.com",
    phone: "+91-87654-32109",
    graduation_year: 2022,
    degree: "MBBS",
    current_occupation: "Medical Resident",
    current_position: "Medical Resident",
    location: "Delhi, India",
    company_organization: "AIIMS Delhi",
    bio: "Passionate about medical missions, served as CSF's Outreach Coordinator.",
    testimony: "My time in CSF shaped my calling to serve the sick and marginalized.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91-76543-21098",
    graduation_year: 2021,
    degree: "MBA",
    current_occupation: "Business Analyst",
    current_position: "Business Analyst",
    location: "Mumbai, India",
    company_organization: "Deloitte",
    bio: "Former CSF Treasurer who brought financial discipline to the fellowship.",
    testimony: "CSF taught me that stewardship is worship.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
  }
]

const testimonialsData = [
  {
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    role: "Current Student",
    company: "B.Tech 3rd Year",
    content: "Joining CSF was the best decision I made at MMU. The fellowship has become my family away from home.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
  },
  {
    name: "Anita Patel",
    email: "anita.patel@example.com",
    role: "Alumni",
    company: "Class of 2022",
    content: "CSF prepared me for life after graduation in ways I never expected.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
  },
  {
    name: "Joseph Daniel",
    email: "joseph.daniel@example.com",
    role: "Current Student",
    company: "MBA 2nd Year",
    content: "As an international student, finding community was crucial. CSF welcomed me with open arms.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
  }
]

const galleryData = [
  {
    title: "Easter Celebration 2024",
    description: "Joyful moments from our Easter Sunday celebration.",
    image_url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80",
    image_path: "",
    category: "Events",
    is_featured: true,
    is_active: true,
    display_order: 1,
    event_date: getPastDate(60),
    location: "MMU Main Auditorium",
    photographer: "CSF Media Team",
    created_at: getPastDate(60),
  },
  {
    title: "Weekly Worship Night",
    description: "Students gathered in praise and worship.",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    image_path: "",
    category: "Worship",
    is_featured: true,
    is_active: true,
    display_order: 2,
    event_date: getPastDate(7),
    location: "CSF Chapel",
    photographer: "CSF Media Team",
    created_at: getPastDate(7),
  },
  {
    title: "Bible Study Session",
    description: "Students engaging deeply with Scripture.",
    image_url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80",
    image_path: "",
    category: "Bible Study",
    is_featured: false,
    is_active: true,
    display_order: 3,
    event_date: getPastDate(14),
    location: "CSF Prayer Room",
    photographer: "CSF Media Team",
    created_at: getPastDate(14),
  },
  {
    title: "Community Outreach",
    description: "CSF members serving the local community.",
    image_url: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    image_path: "",
    category: "Outreach",
    is_featured: true,
    is_active: true,
    display_order: 4,
    event_date: getPastDate(21),
    location: "Mullana Village",
    photographer: "CSF Media Team",
    created_at: getPastDate(21),
  },
  {
    title: "Leadership Retreat",
    description: "Our student leaders gathered for planning and prayer.",
    image_url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80",
    image_path: "",
    category: "Leadership",
    is_featured: false,
    is_active: true,
    display_order: 5,
    event_date: getPastDate(45),
    location: "Shimla Retreat Center",
    photographer: "CSF Media Team",
    created_at: getPastDate(45),
  },
  {
    title: "Christmas Celebration",
    description: "The joy of Christmas filled our fellowship.",
    image_url: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800&q=80",
    image_path: "",
    category: "Events",
    is_featured: true,
    is_active: true,
    display_order: 6,
    event_date: getPastDate(90),
    location: "MMU Auditorium",
    photographer: "CSF Media Team",
    created_at: getPastDate(90),
  },
  {
    title: "Prayer Meeting",
    description: "Early morning prayer warriors gathering.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    image_path: "",
    category: "Prayer",
    is_featured: false,
    is_active: true,
    display_order: 7,
    event_date: getPastDate(3),
    location: "CSF Chapel",
    photographer: "CSF Media Team",
    created_at: getPastDate(3),
  },
  {
    title: "New Students Welcome",
    description: "Welcoming new students to the CSF family.",
    image_url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
    image_path: "",
    category: "Events",
    is_featured: false,
    is_active: true,
    display_order: 8,
    event_date: getPastDate(120),
    location: "MMU Campus",
    photographer: "CSF Media Team",
    created_at: getPastDate(120),
  }
]

const ministriesData = [
  {
    name: "Women's Fellowship",
    description: "Empowering women through Bible study, prayer, and fellowship.",
    image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 1,
  },
  {
    name: "Men's Fellowship",
    description: "Building strong Christian men through discipleship and accountability.",
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 2,
  },
  {
    name: "CSF Choir",
    description: "Worship through music and song, leading congregation in praise.",
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 3,
  },
  {
    name: "Bible Study Group",
    description: "Deep dive into God's Word through systematic Bible study.",
    image_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 4,
  },
  {
    name: "Evangelism & Outreach",
    description: "Sharing the Gospel with campus and community.",
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 5,
  },
  {
    name: "Intercession Group",
    description: "Dedicated prayer warriors interceding for campus, nation, and world.",
    image_url: "https://images.unsplash.com/photo-1470229722913-7f419344ca51?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 6,
  }
]

const leadershipData = [
  {
    name: "Pastor Emmanuel John",
    position: "Spiritual Advisor",
    role: "Spiritual Advisor",
    email: "emmanuel.john@csf-mmu.org",
    phone: "+91-99887-76655",
    bio: "Pastor Emmanuel has been guiding CSF for over 10 years.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: true,
    is_active: true,
    display_order: 1,
    start_date: "2014-01-01",
  },
  {
    name: "Blessing Mathew",
    position: "President",
    role: "President",
    email: "blessing.mathew@csf-mmu.org",
    phone: "+91-88776-65544",
    bio: "Blessing is a final year B.Tech student passionate about building Christian community.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: true,
    is_active: true,
    display_order: 2,
    start_date: "2024-01-15",
  },
  {
    name: "Daniel Philip",
    position: "Vice President",
    role: "Vice President",
    email: "daniel.philip@csf-mmu.org",
    phone: "+91-77665-54433",
    bio: "Daniel coordinates all fellowship activities and supports ministry leaders.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 3,
    start_date: "2024-01-15",
  },
  {
    name: "Ruth Samuel",
    position: "Secretary",
    role: "Secretary",
    email: "ruth.samuel@csf-mmu.org",
    phone: "+91-66554-43322",
    bio: "Ruth manages all CSF communications, records, and administrative functions.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 4,
    start_date: "2024-01-15",
  },
  {
    name: "James Peter",
    position: "Treasurer",
    role: "Treasurer",
    email: "james.peter@csf-mmu.org",
    phone: "+91-55443-32211",
    bio: "James oversees CSF's finances with integrity and transparency.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 5,
    start_date: "2024-01-15",
  },
  {
    name: "Hannah Grace",
    position: "Worship Coordinator",
    role: "Worship Coordinator",
    email: "hannah.grace@csf-mmu.org",
    phone: "+91-44332-21100",
    bio: "Hannah leads the worship team and CSF Choir.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 6,
    start_date: "2024-01-15",
  }
]

export default function SeedPage() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    events: number
    alumni: number
    testimonials: number
    gallery: number
    leaders: number
    ministries: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingData, setHasExistingData] = useState(false)

  const checkExistingData = async () => {
    try {
      if (!db) return
      const eventsCheck = await getDocs(query(collection(db, "events"), limit(1)))
      setHasExistingData(!eventsCheck.empty)
    } catch (e) {
      console.error("Error checking data:", e)
    }
  }

  const seedDatabase = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const seedResults = {
        events: 0,
        alumni: 0,
        testimonials: 0,
        gallery: 0,
        leaders: 0,
        ministries: 0
      }

      // Seed Events
      if (!db) throw new Error("Firestore db not initialized")
      for (const event of eventsData) {
        await addDoc(collection(db, "events"), {
          ...event,
          createdAt: serverTimestamp()
        })
        seedResults.events++
      }

      // Seed Alumni
      for (const alum of alumniData) {
        await addDoc(collection(db, "alumni"), {
          ...alum,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        seedResults.alumni++
      }

      // Seed Testimonials
      for (const testimonial of testimonialsData) {
        await addDoc(collection(db, "testimonials"), {
          ...testimonial,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        seedResults.testimonials++
      }

      // Seed Gallery
      for (const item of galleryData) {
        await addDoc(collection(db, "gallery"), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        seedResults.gallery++
      }

      // Seed Leadership
      for (const leader of leadershipData) {
        await addDoc(collection(db, "executive_leaders"), {
          ...leader,
          createdAt: serverTimestamp()
        })
        seedResults.leaders++
      }

      // Seed Ministries
      for (const ministry of ministriesData) {
        await addDoc(collection(db, "ministries"), {
          ...ministry,
          createdAt: serverTimestamp()
        })
        seedResults.ministries++
      }

      setResults(seedResults)
      setHasExistingData(true)
      toast({
        title: "Seed Complete",
        description: `Added ${seedResults.events} events, ${seedResults.alumni} alumni, ${seedResults.testimonials} testimonials, ${seedResults.gallery} gallery items, ${seedResults.leaders} leaders, and ${seedResults.ministries} ministries.`
      })
    } catch (e: any) {
      setError(e.message)
      toast({
        title: "Error",
        description: "Failed to seed database. " + e.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    checkExistingData()
  })

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Seed Tool</h1>
          <p className="mt-2 text-gray-600">
            Add sample mockup data to your database for testing and demonstration purposes.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                What will be seeded?
              </CardTitle>
              <CardDescription>
                The following collections will receive sample data:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{eventsData.length}</div>
                  <div className="text-sm text-gray-600">Events</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{alumniData.length}</div>
                  <div className="text-sm text-gray-600">Alumni</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{testimonialsData.length}</div>
                  <div className="text-sm text-gray-600">Testimonials</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{galleryData.length}</div>
                  <div className="text-sm text-gray-600">Gallery Items</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{leadershipData.length}</div>
                  <div className="text-sm text-gray-600">Leaders</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{ministriesData.length}</div>
                  <div className="text-sm text-gray-600">Ministries</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 md:col-span-3">
                  <div className="text-sm font-semibold text-gray-700 mb-2">View-Only (from users)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-lg font-bold text-gray-400">∞</div>
                      <div className="text-xs text-gray-400">Donations</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-400">∞</div>
                      <div className="text-xs text-gray-400">Messages</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-400">∞</div>
                      <div className="text-xs text-gray-400">Prayers</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Seed Database</CardTitle>
              <CardDescription>
                Click the button below to add sample data. This data can be edited or removed from the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasExistingData && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">
                    Database already contains data. Seeding will add additional records.
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {results && (
                <div className="flex items-start gap-2 p-4 bg-green-50 text-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Seed completed successfully!</p>
                    <p className="mt-1">
                      Added: {results.events} events, {results.alumni} alumni, {results.testimonials} testimonials, {results.gallery} gallery items, {results.leaders} leaders, {results.ministries} ministries
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={seedDatabase}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding Database...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Seed Database with Mockup Data
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Note: Resources are not seeded. Add real resources from the Resources Management page.
              </p>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Seeded Data</CardTitle>
              <CardDescription>
                After seeding, you can edit, update, or delete the data from these pages:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link href="/admin/events">
                  <Button variant="outline" className="w-full">Events</Button>
                </Link>
                <Link href="/admin/alumni">
                  <Button variant="outline" className="w-full">Alumni</Button>
                </Link>
                <Link href="/admin/testimonials">
                  <Button variant="outline" className="w-full">Testimonials</Button>
                </Link>
                <Link href="/admin/gallery">
                  <Button variant="outline" className="w-full">Gallery</Button>
                </Link>
                <Link href="/admin/leadership">
                  <Button variant="outline" className="w-full">Leadership</Button>
                </Link>
                <Link href="/admin/ministries">
                  <Button variant="outline" className="w-full">Ministries</Button>
                </Link>
                <Link href="/admin/resources">
                  <Button variant="outline" className="w-full">Resources</Button>
                </Link>
                <Link href="/admin/homepage">
                  <Button variant="outline" className="w-full font-semibold">Homepage Manager</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
