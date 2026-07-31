"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Image, Eye, ArrowRight, Camera } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"

interface GalleryItem {
  id: string
  title: string
  description: string
  image_url: string
  image_path: string
  category: string
  is_featured: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export function GalleryHomepageSection() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let isSubscribed = true

    async function loadGalleryItems() {
      if (dataLoaded) return

      try {
        const data = await getCachedData(
          CACHE_KEYS.GALLERY,
          async () => {
            try {
              // Prioritize featured items, then by display_order
              const q = query(
                collection(db!, "gallery"),
                where("is_active", "==", true),
                orderBy("is_featured", "desc"), // Featured items first
                orderBy("display_order", "asc"), // Then by order
                limit(8)
              )
              const snap = await getDocs(q)
              return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[]
            } catch (e) {
              // Fallback: try without featured ordering if index doesn't exist
              const fallbackQ = query(
                collection(db!, "gallery"),
                where("is_active", "==", true),
                orderBy("display_order", "asc"),
                limit(8)
              )
              const fallbackSnap = await getDocs(fallbackQ)
              return fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[]
            }
          },
          CACHE_TTL.HOMEPAGE_SECTIONS
        )
        if (isSubscribed) {
          setGalleryItems(data || [])
          setDataLoaded(true)
        }
      } catch (e) {
        console.error("Error loading gallery items:", e)
        if (isSubscribed) {
          setGalleryItems([])
          setDataLoaded(true)
        }
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    loadGalleryItems()
    return () => { isSubscribed = false }
  }, [dataLoaded])

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-32 mx-auto mb-4"></div>
              <div className="h-12 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (galleryItems.length === 0) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <span className="text-red-600 font-black text-xs uppercase tracking-widest">Gallery</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Our <span className="text-red-600">Memories</span></h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Gallery photos coming soon. Check back for moments from our fellowship!
            </p>
          </div>
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No gallery images available at the moment.</p>
            <Link href="/gallery">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                Visit Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <span className="text-red-600 font-black text-xs uppercase tracking-widest">Gallery</span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Our <span className="text-red-600">Memories</span></h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Browse through {galleryItems.length}+ moments from our fellowship events and activities
          </p>
        </div>

        {/* Mobile-first Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
          {galleryItems.slice(0, 8).map((item, index) => (
            <Link key={item.id} href={`/gallery#${item.id}`}>
              <Card className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center justify-center text-white text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </div>
                    </div>
                  </div>
                  {item.is_featured && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-black">
                        Featured
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  {item.category && (
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <Link href="/gallery">
            <Button size="lg" className="bg-gray-900 hover:bg-black text-white px-12 py-7 rounded-full text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
              View Full Gallery
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
