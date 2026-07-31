"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, Users } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"
import Image from "next/image"
import Link from "next/link"

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

interface LeadershipSectionProps {
  leaders?: Leader[] // Make prop optional
}

export function LeadershipSection({ leaders = [] }: LeadershipSectionProps) {
  const [loadedLeaders, setLoadedLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    // If leaders prop is provided, use it; otherwise load from database
    if (leaders && leaders.length > 0) {
      setLoadedLeaders(leaders)
      setLoading(false)
      setDataLoaded(true)
    } else if (!dataLoaded) {
      loadLeaders()
    }
  }, [leaders, dataLoaded])

  const loadLeaders = async () => {
    if (dataLoaded) return
    
    try {
      const data = await getCachedData(
        CACHE_KEYS.LEADERSHIP,
        async () => {
          try {
            // First try to get all current leaders
            const q = query(
              collection(db!, "executive_leaders"),
              where("is_current", "==", true)
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Leader[]
          } catch (error) {
            // Fallback: try without filtering
            const fallbackQ = query(collection(db!, "executive_leaders"))
            const fallbackSnap = await getDocs(fallbackQ)
            return fallbackSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Leader[]
          }
        },
        CACHE_TTL.HOMEPAGE_SECTIONS
      )

      // Filter for featured and sort by display_order on client side
      const featuredAndSorted = data
        .filter(leader => leader.is_featured === true && (leader.is_current === true || leader.is_current === undefined))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      
      setLoadedLeaders(featuredAndSorted.slice(0, 9))
      setDataLoaded(true)
    } catch (error) {
      console.error("Error loading leaders:", error)
      setLoadedLeaders([])
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  // Early return for loading state
  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Early return for empty state
  if (!loadedLeaders || loadedLeaders.length === 0) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
              <span>Our Team</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Meet Our <span className="text-red-600">Leadership</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Dedicated student leaders guiding our fellowship with wisdom, passion, and a commitment to spiritual growth.
            </p>
          </div>
          <div className="text-center py-16 bg-gray-50 rounded-[32px] border border-gray-100">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">Leadership information coming soon.</p>
            <Link href="/about">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                Learn More About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-50/50 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
            <span>Our Team</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Meet Our <span className="text-red-600">Leadership</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            Dedicated student leaders guiding our fellowship with wisdom, passion, and a commitment to spiritual growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loadedLeaders?.map((leader, index) => (
            <div
              key={leader.id || index}
              className="group relative bg-white rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 border border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              {/* Card Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

              <div className="relative mb-8">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-red-600 to-red-800 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
                  {leader.photo_url ? (
                    <Image
                      src={leader.photo_url}
                      alt={leader.name}
                      fill
                      className="object-cover rounded-full"
                      sizes="(max-width: 640px) 112px, 128px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white font-black text-2xl">
                        {leader.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )}
                </div>
                {/* Decorative Ring */}
                <div className="absolute -inset-3 border-2 border-red-500/10 rounded-full -z-10 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 truncate">{leader.name}</h4>
                  <p className="text-red-600 font-bold text-sm uppercase tracking-widest">
                    {leader.role}
                  </p>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                  {leader.bio}
                </p>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex flex-col gap-3">
                    {leader.email && (
                      <div className="flex items-center gap-3 text-gray-500">
                        <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium truncate">{leader.email}</span>
                      </div>
                    )}

                    {leader.phone && (
                      <div className="flex items-center gap-3 text-gray-500">
                        <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{leader.phone}</span>
                      </div>
                    )}

                    {leader.start_date && (
                      <div className="flex items-center gap-3 text-gray-500">
                        <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
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
      </div>
      
      {/* View More Button */}
      {loadedLeaders.length > 0 && (
        <div className="text-center mt-12">
          <Link href="/leadership">
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 rounded-full font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              View More Leaders
            </Button>
          </Link>
        </div>
      )}
    </section>
  )
}
