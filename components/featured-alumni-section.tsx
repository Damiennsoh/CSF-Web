"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, MapPin, Briefcase, ArrowRight } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, orderBy, getDocs } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"
import Link from "next/link"
import Image from "next/image"

interface Alumni {
  id: string
  name: string
  graduation_year: number
  current_position: string
  company_organization: string
  location: string
  bio: string
  testimony: string
  image_url?: string
  image_path?: string
}

export function FeaturedAlumniSection() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (!dataLoaded) {
      loadFeaturedAlumni()
    }
  }, [dataLoaded])

  const loadFeaturedAlumni = async () => {
    if (dataLoaded) return
    
    try {
      const data = await getCachedData(
        CACHE_KEYS.ALUMNI,
        async () => {
          try {
            const q = query(
              collection(db!, "alumni"),
              where("is_featured", "==", true),
              orderBy("graduation_year", "desc"),
              limit(3)
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Alumni[]
          } catch (error) {
            // Fallback: try without featured filter
            const fallbackQ = query(
              collection(db!, "alumni"),
              orderBy("graduation_year", "desc"),
              limit(3)
            )
            const fallbackSnap = await getDocs(fallbackQ)
            return fallbackSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Alumni[]
          }
        },
        CACHE_TTL.HOMEPAGE_SECTIONS
      )

      setAlumni(data)
      setDataLoaded(true)
    } catch (error) {
      console.error("Error loading featured alumni:", error)
      setAlumni([])
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
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

  if (alumni.length === 0) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
              <span>Our Community</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Alumni <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Network</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Connecting our growing community of leaders making a global impact beyond Maharishi Markandeshwar University.
            </p>
          </div>
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No featured alumni at the moment.</p>
            <Link href="/alumni">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 font-bold">
                View All Alumni
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
            <span>Our Community</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Alumni <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Network</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            Connecting our growing community of leaders making a global impact beyond Maharishi Markandeshwar University.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-16 items-start">
          {/* Alumni Benefits */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Network Benefits</h3>
              <p className="text-gray-500 font-medium">Why stay connected with CSF after graduation?</p>
            </div>

            <div className="space-y-8">
              <div className="group flex items-start gap-6 transition-transform duration-300 hover:translate-x-2">
                <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900 mb-2">Networking</h4>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Connect with fellow alumni across various industries and build lasting professional relationships globally.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-6 transition-transform duration-300 hover:translate-x-2">
                <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                  <Briefcase className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900 mb-2">Mentorship</h4>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Get guidance from experienced alumni or mentor current students in their spiritual and career journey.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-6 transition-transform duration-300 hover:translate-x-2">
                <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <MapPin className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900 mb-2">Career Growth</h4>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Access exclusive opportunities, professional workshops, and resources tailored for our alumni.
                  </p>
                </div>
              </div>
            </div>

            <a 
              href="https://chat.whatsapp.com/GwAJHFSb6xG2LJm7BxCkfs?mode=gi_t" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-10 py-7 text-lg rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 font-bold"
            >
              Join the Network
            </a>
          </div>

          {/* Featured Alumni */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Featured Alumni</h3>
              <Link href="/alumni" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-6">
              {alumni.map((alum) => (
                <div
                  key={alum.id}
                  className="group relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                      {alum.image_url ? (
                        <Image
                          src={alum.image_url}
                          alt={`${alum.name} - Class of ${alum.graduation_year}`}
                          fill
                          className="object-cover rounded-full"
                          sizes="(max-width: 768px) 80px, 96px"
                        />
                      ) : (
                        <span className="text-white text-2xl font-black">
                          {alum.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-black text-xl text-gray-900 tracking-tight">
                          {alum.name}
                        </h4>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-black rounded-full uppercase tracking-widest">
                          Class of {alum.graduation_year}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm font-bold">
                        <span className="text-blue-600">{alum.current_position}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{alum.location}</span>
                      </div>

                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 italic">
                        "{alum.bio}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
