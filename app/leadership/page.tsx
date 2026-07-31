"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/back-button"
import { Users, Mail, Phone, Calendar, Shield, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"

interface Leader {
  id: string
  name: string
  role: string
  position?: string
  email?: string
  phone?: string
  bio?: string
  photo_url?: string
  photo_path?: string
  profile_picture_url?: string
  is_active: boolean
  is_current?: boolean
  is_featured?: boolean
  display_order?: number
  start_date?: string
  created_at?: string
  updated_at?: string
}

export default function LeadershipPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaders()
  }, [])

  const loadLeaders = async () => {
    try {
      // Get all current leaders (without ordering to avoid index requirement)
      const q = query(
        collection(db, "executive_leaders"),
        where("is_current", "==", true)
      )
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Leader[]

      console.log("Leaders data fetched:", data) // Debug log
      console.log("Number of leaders:", data.length) // Debug log
      
      // Sort by display_order on client side
      const sortedData = data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      setLeaders(sortedData)
    } catch (error) {
      console.error("Error loading leaders:", error) // Debug log
      // Fallback: load all leaders without is_current filter
      try {
        const fallbackQ = query(collection(db, "executive_leaders"))
        const fallbackSnap = await getDocs(fallbackQ)
        const fallbackData = fallbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Leader[]
        
        // Sort client-side and filter for current
        const sortedAndFiltered = fallbackData
          .filter(leader => leader.is_current === true)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        
        console.log("Fallback leaders data:", sortedAndFiltered) // Debug log
        setLeaders(sortedAndFiltered)
      } catch (fallbackError) {
        console.error("Fallback leaders query also failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-20">
          <Loader2 className="h-16 w-16 text-red-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading leadership information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-6">
            <BackButton showHomeButton={true} className="text-white hover:text-gray-200" />
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Users className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Leadership</h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Meet the dedicated leaders serving our CSF community
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {leaders.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="group relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                    {leader.photo_url ? (
                      <Image
                        src={leader.photo_url}
                        alt={leader.name}
                        fill
                        className="object-cover rounded-full"
                        sizes="(max-width: 768px) 128px, 160px"
                      />
                    ) : (
                      <span className="text-white text-4xl font-black">
                        {leader.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xl text-gray-900 truncate">{leader.name}</h4>
                      <p className="text-red-600 font-bold text-sm uppercase tracking-widest">
                        {leader.role}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center flex-wrap">
                      <Badge className="bg-red-100 text-red-800">{leader.role}</Badge>
                      {leader.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">⭐ Featured</Badge>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                      {leader.bio}
                    </p>

                    <div className="pt-6 border-t border-gray-50 space-y-3">
                      {leader.email && (
                        <div className="flex items-center justify-center gap-3 text-gray-400 group-hover:text-gray-600 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <Mail className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium truncate">{leader.email}</span>
                        </div>
                      )}

                      {leader.phone && (
                        <div className="flex items-center justify-center gap-3 text-gray-400 group-hover:text-gray-600 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <Phone className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{leader.phone}</span>
                        </div>
                      )}

                      {leader.start_date && (
                        <div className="flex items-center justify-center gap-3 text-gray-400 group-hover:text-gray-600 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">Serving since {new Date(leader.start_date).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Leadership Team Coming Soon</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Our leadership team information will be available soon. Please check back later!
            </p>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <a href="/contact">Contact Us</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
