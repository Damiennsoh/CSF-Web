"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Music, BookOpen, Heart, PlayIcon as Pray, UserCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"

interface Ministry {
  id: string
  name: string
  description?: string
  slug?: string
  is_active?: boolean
  display_order?: number
}

export function MinistriesSection() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let isSubscribed = true

    async function loadMinistries() {
      if (dataLoaded) return

      try {
        const data = await getCachedData(
          CACHE_KEYS.MINISTRIES,
          async () => {
            const q = query(
              collection(db!, "ministries"),
              where("is_active", "==", true),
              orderBy("display_order", "asc"),
              limit(8)
            )
            const snap = await getDocs(q)
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ministry[]
          },
          CACHE_TTL.HOMEPAGE_SECTIONS
        )
        if (isSubscribed) {
          setMinistries(data || [])
          setDataLoaded(true)
        }
      } catch (e) {
        console.error("Error loading ministries:", e)
        if (isSubscribed) {
          setMinistries([])
          setDataLoaded(true)
        }
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    loadMinistries()
    return () => { isSubscribed = false }
  }, [dataLoaded])

  if (loading) {
    return (
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-32 mx-auto mb-4"></div>
              <div className="h-12 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-[32px] animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (ministries.length === 0) {
    return (
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-red-600/5 blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-24 space-y-4">
            <span className="text-red-600 font-black text-xs uppercase tracking-widest">Get Involved</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">Find Your <span className="text-red-600">Family</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Our ministries are coming soon. Check back for opportunities to get involved!
            </p>
          </div>
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No ministries available at the moment.</p>
            <Link href="/ministries">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                View All Ministries
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const getIcon = (index: number) => {
    const icons = [Users, UserCheck, Music, BookOpen, Heart, Pray]
    return icons[index % icons.length]
  }

  const getColor = (index: number) => {
    const colors = ["pink", "blue", "purple", "green", "orange", "indigo"]
    return colors[index % colors.length]
  }

  const getColorClasses = (color: string) => {
    const colors = {
      pink: "bg-pink-100 text-pink-600",
      blue: "bg-blue-100 text-blue-600",
      purple: "bg-purple-100 text-purple-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      indigo: "bg-indigo-100 text-indigo-600",
    }
    return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-600"
  }

  const normalizeSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')           // spaces to hyphens
      .replace(/&/g, '')              // remove ampersands
      .replace(/[^a-z0-9-]/g, '')     // remove special chars
      .replace(/-+/g, '-')             // collapse multiple hyphens
      .replace(/^-|-$/g, '')           // trim hyphens
  }

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-red-600/5 blur-[120px] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-24 space-y-4">
          <span className="text-red-600 font-black text-xs uppercase tracking-widest">Get Involved</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">Find Your <span className="text-red-600">Family</span></h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            With {ministries.length} ministries, there's a place for your gifts and a community for your heart.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ministries.map((ministry, idx) => {
            const Icon = getIcon(idx)
            const color = getColor(idx)
            const slug = ministry.slug ? normalizeSlug(ministry.slug) : normalizeSlug(ministry.name)
            
            return (
              <Link key={ministry.id} href={`/ministries/${slug}`}>
                <Card className="h-full border-0 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-white rounded-[32px] overflow-hidden">
                  <CardHeader className="p-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:rotate-6 ${getColorClasses(color)}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors">{ministry.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <p className="text-gray-500 leading-relaxed mb-6">{ministry.description}</p>
                    <div className="flex items-center text-sm font-bold text-gray-900 group-hover:translate-x-2 transition-transform">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-20">
          <Link href="/ministries">
            <Button size="lg" className="bg-gray-900 hover:bg-black text-white px-12 py-7 rounded-full text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
              View All Ministries
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
