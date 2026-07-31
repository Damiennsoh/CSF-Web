'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BackButton } from '@/components/back-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { 
  Users, MapPin, Clock, Mail, FileText, Music, BookOpen, Heart, Play, UserCheck,
  Calendar, Activity, Download, Phone, ChevronRight, Loader2, User
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Ministry Interface
interface Ministry {
  id: string
  name: string
  description?: string
  long_description?: string
  image_url?: string
  banner_image?: string
  resource_url?: string
  is_active?: boolean
  display_order?: number
  schedule?: string
  meeting_time?: string
  location?: string
  meeting_location?: string
  contact_email?: string
  contact_phone?: string
  leader_name?: string
  leader_id?: string
  slug?: string
  mission?: string
  vision?: string
  founded_date?: string
}

// Sub-collection interfaces
interface MinistryLeader {
  id: string
  name: string
  role: string
  photo_url?: string
  bio?: string
  email?: string
  phone?: string
  is_primary?: boolean
}

interface MinistryMember {
  id: string
  name: string
  role?: string
  photo_url?: string
  join_date?: string
  is_active?: boolean
}

interface MinistryEvent {
  id: string
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  location?: string
  is_recurring?: boolean
  recurring_pattern?: string
}

interface MinistryActivity {
  id: string
  title: string
  description?: string
  activity_date: string
  image_url?: string
  category?: string
}

interface MinistryResource {
  id: string
  title: string
  description?: string
  file_url?: string
  file_type?: string
  category?: string
  created_at: string
}

const getIcon = (index: number) => {
  const icons = [Users, UserCheck, Music, BookOpen, Heart, Play]
  return icons[index % icons.length]
}

const getColorClasses = (color: string) => {
  const colors: Record<string, string> = {
    pink: 'bg-pink-100 text-pink-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    teal: 'bg-teal-100 text-teal-600',
  }
  return colors[color] || 'bg-gray-100 text-gray-600'
}

const handleDownload = (fileUrl: string, title: string, fileType?: string) => {
  const link = document.createElement('a')
  
  // For Cloudinary URLs, add download flag with custom filename
  if (fileUrl.includes('cloudinary.com')) {
    // Create a clean filename from the title
    const cleanFilename = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    
    // Add fl_attachment flag with custom filename
    let downloadUrl = fileUrl
    
    // Check if fl_attachment is already present
    if (!fileUrl.includes('/fl_attachment')) {
      // Insert fl_attachment after /upload/ with custom filename
      if (fileUrl.includes('/upload/')) {
        downloadUrl = fileUrl.replace('/upload/', `/upload/fl_attachment:${cleanFilename}/`)
      }
    }
    
    link.href = downloadUrl
    link.download = `${cleanFilename}.${getFileExtension(fileType)}`
  } else {
    link.href = fileUrl
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
  }
  
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const getFileExtension = (fileType?: string): string => {
  const extensions: Record<string, string> = {
    'PDF': 'pdf',
    'Document': 'docx',
    'Video': 'mp4',
    'Audio': 'mp3',
    'Image': 'jpg',
    'PowerPoint': 'pptx',
    'Excel': 'xlsx',
    'Text': 'txt'
  }
  return extensions[fileType || 'Document'] || 'pdf'
}

export default function MinistryDetailPage() {
  const params = useParams()
  const [ministry, setMinistry] = useState<Ministry | null>(null)
  const [leaders, setLeaders] = useState<MinistryLeader[]>([])
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [events, setEvents] = useState<MinistryEvent[]>([])
  const [activities, setActivities] = useState<MinistryActivity[]>([])
  const [resources, setResources] = useState<MinistryResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function loadMinistryData() {
      try {
        const id = params?.id as string
        if (!id) {
          setError(true)
          setLoading(false)
          return
        }

        // Helper function to normalize slug
        const normalizeSlug = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/&/g, '')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        }

        // Fetch all ministries
        const allSnap = await getDocs(query(collection(db!, 'ministries'), limit(50)))
        
        // Find matching ministry
        const ministryDoc = allSnap.docs.find(doc => {
          const data = doc.data()
          const storedSlug = data.slug ? normalizeSlug(data.slug) : null
          const generatedSlug = normalizeSlug(data.name || '')
          const normalizedId = normalizeSlug(id)
          
          return (
            doc.id === id ||
            storedSlug === normalizedId ||
            generatedSlug === normalizedId
          )
        })

        if (!ministryDoc) {
          setError(true)
          setLoading(false)
          return
        }

        const ministryData = { id: ministryDoc.id, ...ministryDoc.data() } as Ministry
        setMinistry(ministryData)

        // Fetch sub-collections
        const ministryId = ministryDoc.id

        // Fetch Leaders
        try {
          const leadersQuery = query(
            collection(db!, 'ministries', ministryId, 'leaders'),
            orderBy('is_primary', 'desc'),
            orderBy('name', 'asc'),
            limit(50)
          )
          const leadersSnap = await getDocs(leadersQuery)
          setLeaders(leadersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinistryLeader)))
        } catch (e) {
          console.log('No leaders sub-collection or permission denied')
          setLeaders([])
        }

        // Fetch Members
        try {
          const membersQuery = query(
            collection(db!, 'ministries', ministryId, 'members'),
            orderBy('name', 'asc'),
            limit(50)
          )
          const membersSnap = await getDocs(membersQuery)
          setMembers(membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinistryMember)))
        } catch (e) {
          console.log('No members sub-collection or permission denied')
          setMembers([])
        }

        // Fetch Events/Schedule
        try {
          const eventsQuery = query(
            collection(db!, 'ministries', ministryId, 'events'),
            orderBy('event_date', 'asc'),
            limit(50)
          )
          const eventsSnap = await getDocs(eventsQuery)
          setEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinistryEvent)))
        } catch (e) {
          console.log('No events sub-collection or permission denied')
          setEvents([])
        }

        // Fetch Activities
        try {
          const activitiesQuery = query(
            collection(db!, 'ministries', ministryId, 'activities'),
            orderBy('activity_date', 'desc'),
            limit(50)
          )
          const activitiesSnap = await getDocs(activitiesQuery)
          setActivities(activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinistryActivity)))
        } catch (e) {
          console.log('No activities sub-collection or permission denied')
          setActivities([])
        }

        // Fetch Resources
        try {
          const resourcesQuery = query(
            collection(db!, 'ministries', ministryId, 'resources'),
            orderBy('created_at', 'desc'),
            limit(50)
          )
          const resourcesSnap = await getDocs(resourcesQuery)
          setResources(resourcesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinistryResource)))
        } catch (e) {
          console.log('No resources sub-collection or permission denied')
          setResources([])
        }

      } catch (err) {
        console.error('Error loading ministry:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadMinistryData()
  }, [params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ministry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <BackButton />
          <div className="text-center py-24">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Ministry Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">
              The ministry you are looking for does not exist or has been removed.
            </p>
            <Link href="/ministries">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                Back to Ministries
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const colorIndex = ministry.display_order || 0
  const colors = ['pink', 'blue', 'purple', 'green', 'orange', 'indigo', 'red', 'teal', 'yellow']
  const color = colors[colorIndex % colors.length]
  const Icon = getIcon(colorIndex)

  const hasData = {
    leaders: leaders.length > 0 || ministry.leader_name,
    members: members.length > 0,
    schedule: events.length > 0 || ministry.schedule || ministry.meeting_time,
    activities: activities.length > 0,
    resources: resources.length > 0 || ministry.resource_url
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <BackButton />

        {/* Hero Section */}
        <div className="mt-8 mb-8 text-center">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto ${getColorClasses(color)}`}>
            <Icon className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{ministry.name}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {ministry.description}
          </p>

          {/* Quick Contact Info */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-gray-600 text-sm">
            {(ministry.schedule || ministry.meeting_time) && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Clock className="h-4 w-4 text-red-600" />
                <span>{ministry.schedule || ministry.meeting_time}</span>
              </div>
            )}
            {(ministry.location || ministry.meeting_location) && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <MapPin className="h-4 w-4 text-red-600" />
                <span>{ministry.location || ministry.meeting_location}</span>
              </div>
            )}
            {ministry.contact_email && (
              <a 
                href={`mailto:${ministry.contact_email}`}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:bg-red-50 transition-colors"
              >
                <Mail className="h-4 w-4 text-red-600" />
                <span>{ministry.contact_email}</span>
              </a>
            )}
            {ministry.contact_phone && (
              <a 
                href={`tel:${ministry.contact_phone}`}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:bg-red-50 transition-colors"
              >
                <Phone className="h-4 w-4 text-red-600" />
                <span>{ministry.contact_phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Banner Image */}
        {(ministry.banner_image || ministry.image_url) && (
          <div className="mb-8 rounded-3xl overflow-hidden shadow-xl">
            <Image
              src={ministry.banner_image || ministry.image_url || ''}
              alt={ministry.name}
              width={1200}
              height={400}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-white p-1 rounded-2xl shadow-sm mb-8 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            {hasData.leaders && (
              <TabsTrigger value="leadership" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Leadership
              </TabsTrigger>
            )}
            {hasData.members && (
              <TabsTrigger value="members" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Members
              </TabsTrigger>
            )}
            {hasData.schedule && (
              <TabsTrigger value="schedule" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Schedule
              </TabsTrigger>
            )}
            {hasData.activities && (
              <TabsTrigger value="activities" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Activities
              </TabsTrigger>
            )}
            {hasData.resources && (
              <TabsTrigger value="resources" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Resources
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Mission & Vision */}
            {(ministry.mission || ministry.vision || ministry.long_description) && (
              <div className="grid md:grid-cols-2 gap-6">
                {ministry.mission && (
                  <Card className="border-0 shadow-lg rounded-3xl">
                    <CardHeader className={`${getColorClasses(color)} rounded-t-3xl`}>
                      <CardTitle className="text-xl font-bold">Our Mission</CardTitle>
                    </CardHeader>
                    <CardContent className="py-6">
                      <p className="text-gray-600 leading-relaxed">{ministry.mission}</p>
                    </CardContent>
                  </Card>
                )}
                {ministry.vision && (
                  <Card className="border-0 shadow-lg rounded-3xl">
                    <CardHeader className={`${getColorClasses(color)} rounded-t-3xl`}>
                      <CardTitle className="text-xl font-bold">Our Vision</CardTitle>
                    </CardHeader>
                    <CardContent className="py-6">
                      <p className="text-gray-600 leading-relaxed">{ministry.vision}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Long Description */}
            {ministry.long_description && (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardHeader className="bg-gray-100 rounded-t-3xl">
                  <CardTitle className="text-xl font-bold">About {ministry.name}</CardTitle>
                </CardHeader>
                <CardContent className="py-6">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{ministry.long_description}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {leaders.length > 0 && (
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <Users className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{leaders.length}</p>
                  <p className="text-sm text-gray-500">Leaders</p>
                </div>
              )}
              {members.length > 0 && (
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <User className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-500">Members</p>
                </div>
              )}
              {events.length > 0 && (
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <Calendar className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  <p className="text-sm text-gray-500">Events</p>
                </div>
              )}
              {activities.length > 0 && (
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                  <Activity className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
                  <p className="text-sm text-gray-500">Activities</p>
                </div>
              )}
            </div>

            {/* Contact CTA */}
            <div className="bg-red-600 rounded-3xl p-8 sm:p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Involved?</h2>
              <p className="text-lg mb-8 opacity-90">
                Join us and become part of our vibrant community of faith and service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {ministry.contact_email && (
                  <a href={`mailto:${ministry.contact_email}`}>
                    <Button
                      size="lg"
                      className="bg-white hover:bg-gray-100 text-red-600 px-8 py-6 rounded-full font-bold text-lg"
                    >
                      <Mail className="mr-2 h-5 w-5" />
                      Contact Us
                    </Button>
                  </a>
                )}
                <Link href="/ministries">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-red-600 px-8 py-6 rounded-full font-bold text-lg"
                  >
                    View All Ministries
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* Leadership Tab */}
          <TabsContent value="leadership" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(color)}`}>
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Leadership Team</h2>
                <p className="text-gray-500">Meet our dedicated leaders</p>
              </div>
            </div>

            {leaders.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaders.map((leader) => (
                  <Card key={leader.id} className="border-0 shadow-lg rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={leader.photo_url} alt={leader.name} />
                          <AvatarFallback className={`text-lg ${getColorClasses(color)}`}>
                            {leader.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{leader.name}</h3>
                          <p className="text-red-600 text-sm font-medium">{leader.role}</p>
                          {leader.is_primary && (
                            <Badge className="mt-2 bg-red-100 text-red-700">Primary Leader</Badge>
                          )}
                        </div>
                      </div>
                      {leader.bio && (
                        <p className="mt-4 text-gray-600 text-sm leading-relaxed">{leader.bio}</p>
                      )}
                      {(leader.email || leader.phone) && (
                        <div className="mt-4 flex gap-2">
                          {leader.email && (
                            <a href={`mailto:${leader.email}`} className="text-sm text-red-600 hover:underline">
                              {leader.email}
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ministry.leader_name ? (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getColorClasses(color)}`}>
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{ministry.leader_name}</h3>
                      <p className="text-red-600">Ministry Leader</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Leadership information coming soon</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(color)}`}>
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                <p className="text-gray-500">{members.length} active members</p>
              </div>
            </div>

            {members.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <Card key={member.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.photo_url} alt={member.name} />
                        <AvatarFallback className={getColorClasses(color)}>
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                        {member.role && (
                          <p className="text-sm text-gray-500">{member.role}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardContent className="p-12 text-center">
                  <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Member information coming soon</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(color)}`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule & Events</h2>
                <p className="text-gray-500">Upcoming events and meeting times</p>
              </div>
            </div>

            {/* Regular Meeting Time */}
            {(ministry.schedule || ministry.meeting_time) && (
              <Card className="border-0 shadow-lg rounded-3xl bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                      <Clock className="h-7 w-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Regular Meeting</h3>
                      <p className="text-gray-600">{ministry.schedule || ministry.meeting_time}</p>
                      {(ministry.location || ministry.meeting_location) && (
                        <p className="text-gray-500 text-sm mt-1">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          {ministry.location || ministry.meeting_location}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events List */}
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gray-100 flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-500 uppercase">
                            {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            {new Date(event.event_date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{event.title}</h3>
                          {event.description && (
                            <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {event.start_time}{event.end_time && ` - ${event.end_time}`}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {event.is_recurring && (
                          <Badge variant="outline" className="border-red-200 text-red-600">
                            {event.recurring_pattern || 'Recurring'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming events scheduled</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(color)}`}>
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Activities</h2>
                <p className="text-gray-500">What we do</p>
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {activities.map((activity) => (
                  <Card key={activity.id} className="border-0 shadow-lg rounded-3xl overflow-hidden">
                    {activity.image_url && (
                      <div className="h-48 overflow-hidden">
                        <Image
                          src={activity.image_url}
                          alt={activity.title}
                          width={400}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {activity.category && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.category}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(activity.activity_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">{activity.title}</h3>
                      {activity.description && (
                        <p className="text-gray-600 mt-2 text-sm">{activity.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardContent className="p-12 text-center">
                  <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Activities information coming soon</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(color)}`}>
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resources</h2>
                <p className="text-gray-500">Documents, materials, and downloads</p>
              </div>
            </div>

            {/* Main Resource URL */}
            {ministry.resource_url && (
              <Card className="border-0 shadow-lg rounded-3xl bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                        <Download className="h-7 w-7 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Ministry Resources</h3>
                        <p className="text-gray-600">Download available resources</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-3 font-bold"
                      onClick={() => handleDownload(ministry.resource_url!, `${ministry.name}_Resources`, 'Document')}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resources List */}
            {resources.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map((resource) => (
                  <Card key={resource.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
                          {resource.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-3">
                            {resource.file_type && (
                              <Badge variant="outline" className="text-xs">
                                {resource.file_type.toUpperCase()}
                              </Badge>
                            )}
                            {resource.category && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {resource.file_url && (
                          <button
                            onClick={() => handleDownload(resource.file_url!, resource.title, resource.file_type)}
                            className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <Download className="h-5 w-5 text-red-600" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !ministry.resource_url && (
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Resources coming soon</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
