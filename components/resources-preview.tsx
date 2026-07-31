"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, getDocs, orderBy } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Headphones, Video, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

export function ResourcesPreview() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let isSubscribed = true

    async function loadResources() {
      if (dataLoaded) return

      try {
        const data = await getCachedData(
          CACHE_KEYS.RESOURCES,
          async () => {
            const q = query(
              collection(db!, "spiritual_resources"),
              where("is_featured", "==", true),
              limit(3)
            )
            const snap = await getDocs(q)
            if (snap.empty) {
              // If no featured, just get the latest 3
              const q2 = query(collection(db!, "spiritual_resources"), orderBy("createdAt", "desc"), limit(3))
              const snap2 = await getDocs(q2)
              return snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            } else {
              return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            }
          },
          CACHE_TTL.HOMEPAGE_SECTIONS
        )
        if (isSubscribed) {
          setResources(data || [])
          setDataLoaded(true)
        }
      } catch (e) {
        console.error(e)
        if (isSubscribed) {
          setResources([])
          setDataLoaded(true)
        }
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    loadResources()
    return () => { isSubscribed = false }
  }, [dataLoaded])

  if (loading || resources.length === 0) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-4">
              <span className="text-red-600 font-black text-xs uppercase tracking-widest">Library</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Spiritual <span className="text-red-600">Resources</span></h2>
              <p className="text-lg text-gray-600 max-w-2xl">Materials to help you grow in your walk with Christ.</p>
            </div>
            <Link href="/spiritual-resources">
              <Button variant="outline" className="rounded-full border-gray-200 hover:border-red-600 hover:text-red-600 font-bold group">
                Explore Library <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          <div className="text-center py-16 bg-gray-50 rounded-[32px] border border-gray-100">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No resources available at the moment.</p>
            <Link href="/spiritual-resources">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                View All Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "audio": return <Headphones className="h-5 w-5" />
      case "video": return <Video className="h-5 w-5" />
      case "document": return <FileText className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
    }
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-4">
            <span className="text-red-600 font-black text-xs uppercase tracking-widest">Library</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Spiritual <span className="text-red-600">Resources</span></h2>
            <p className="text-lg text-gray-600 max-w-2xl">Materials to help you grow in your walk with Christ.</p>
          </div>
          <Link href="/spiritual-resources">
            <Button variant="outline" className="rounded-full border-gray-200 hover:border-red-600 hover:text-red-600 font-bold group">
              Explore Library <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {resources.map((res) => (
            <Card key={res.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px] group overflow-hidden bg-gray-50">
              <CardHeader className="p-8 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  {getIcon(res.type)}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 line-clamp-1">{res.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-gray-500 text-sm mb-6 line-clamp-2">{res.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-white text-gray-600 border-gray-100">{res.category}</Badge>
                  <Link href="/spiritual-resources" className="text-red-600 text-sm font-bold hover:underline">View</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
