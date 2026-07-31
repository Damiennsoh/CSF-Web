"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera } from "lucide-react"

export function GalleryPreview() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGallery() {
      try {
        if (!db) return
        const colRef = collection(db, "gallery")
        const q = query(colRef, orderBy("createdAt", "desc"), limit(4))
        const snap = await getDocs(q)
        setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

  if (loading || items.length === 0) return null

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-4">
            <span className="text-red-600 font-black text-xs uppercase tracking-widest">Moments</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Our <span className="text-red-600">Gallery</span></h2>
            <p className="text-lg text-gray-600 max-w-2xl">A glimpse into the life and fellowship of CSF MMU.</p>
          </div>
          <Link href="/gallery">
            <Button variant="outline" className="rounded-full border-gray-200 hover:border-red-600 hover:text-red-600 font-bold group">
              View All Photos <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <div 
              key={item.id} 
              className={`relative rounded-[32px] overflow-hidden group aspect-square ${
                idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <Image 
                src={item.image_url || "/placeholder.svg"} 
                alt={item.title} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <p className="text-white font-bold text-sm">{item.title}</p>
                <p className="text-white/70 text-xs">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
