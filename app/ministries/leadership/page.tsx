"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Crown, Calendar } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"

interface Ministry {
  id: string
  name: string
  description: string
}

interface Leader {
  id: string
  name: string
  position: string
  bio: string
  is_current: boolean
  start_date: string
  end_date: string | null
  ministry: Ministry
}

interface Member {
  id: string
  name: string
  email: string
  year_joined: number
  is_active: boolean
  ministry: Ministry
}

export default function LeadershipPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeadershipData()
  }, [])

  const loadLeadershipData = async () => {
    try {
      // Load ministries first to resolve references
      const ministriesSnapshot = await getDocs(query(collection(db!, "ministries"), limit(50)))
      const ministriesData = ministriesSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() } as Ministry
        return acc
      }, {} as Record<string, Ministry>)

      // Load current leaders
      const leadersQuery = query(
        collection(db!, "ministry_leaders"),
        where("is_current", "==", true),
        orderBy("start_date", "desc"),
        limit(50)
      )
      const leadersSnapshot = await getDocs(leadersQuery)
      const leadersWithMinistry = leadersSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          ministry: ministriesData[data.ministry_id] || { id: data.ministry_id, name: "Unknown Ministry", description: "" }
        }
      }) as Leader[]

      // Load active members
      const membersQuery = query(
        collection(db!, "ministry_members"),
        where("is_active", "==", true),
        orderBy("year_joined", "desc"),
        limit(50)
      )
      const membersSnapshot = await getDocs(membersQuery)
      const membersWithMinistry = membersSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          ministry: ministriesData[data.ministry_id] || { id: data.ministry_id, name: "Unknown Ministry", description: "" }
        }
      }) as Member[]

      setLeaders(leadersWithMinistry)
      setMembers(membersWithMinistry)
    } catch (error) {
      console.error("Error loading leadership data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leadership information...</p>
          </div>
        </div>
      </div>
    )
  }

  const groupedLeaders = leaders.reduce(
    (acc, leader) => {
      const ministryName = leader.ministry.name
      if (!acc[ministryName]) {
        acc[ministryName] = []
      }
      acc[ministryName].push(leader)
      return acc
    },
    {} as Record<string, Leader[]>,
  )

  const groupedMembers = members.reduce(
    (acc, member) => {
      const ministryName = member.ministry.name
      if (!acc[ministryName]) {
        acc[ministryName] = []
      }
      acc[ministryName].push(member)
      return acc
    },
    {} as Record<string, Member[]>,
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <BackButton />

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Ministry Leadership & Members</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Meet the dedicated leaders and active members who make our ministries possible
          </p>
        </div>

        <Tabs defaultValue="leaders" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaders" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Current Leaders
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaders" className="space-y-8">
            {Object.entries(groupedLeaders).map(([ministryName, ministryLeaders]) => (
              <div key={ministryName} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">{ministryName}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ministryLeaders.map((leader) => (
                    <Card key={leader.id} className="border-l-4 border-l-blue-600">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{leader.name}</CardTitle>
                          <Badge variant="secondary">{leader.position}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4">{leader.bio}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Since {new Date(leader.start_date).getFullYear()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="members" className="space-y-8">
            {Object.entries(groupedMembers).map(([ministryName, ministryMembers]) => (
              <div key={ministryName} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
                  {ministryName} ({ministryMembers.length} members)
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ministryMembers.map((member) => (
                    <Card key={member.id} className="text-center">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{member.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{member.email}</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {member.year_joined}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
