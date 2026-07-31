"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Quote, Star } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, orderBy, getDocs } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"
import Link from "next/link"

interface Testimonial {
  id: string
  name: string
  role?: string
  company?: string
  content: string
  rating?: number
  is_featured: boolean
  is_active: boolean
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (!dataLoaded) {
      loadTestimonials()
    }
  }, [dataLoaded])

  const loadTestimonials = async () => {
    if (dataLoaded) return
    
    try {
      const data = await getCachedData(
        CACHE_KEYS.TESTIMONIALS,
        async () => {
          try {
            const q = query(
              collection(db!, "testimonials"),
              where("is_featured", "==", true),
              orderBy("createdAt", "desc"),
              limit(3)
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Testimonial[]
          } catch (error) {
            // If compound query fails, try simpler query
            const fallbackQ = query(
              collection(db!, "testimonials"),
              orderBy("createdAt", "desc"),
              limit(3)
            )
            const fallbackSnap = await getDocs(fallbackQ)
            return fallbackSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Testimonial[]
          }
        },
        CACHE_TTL.HOMEPAGE_SECTIONS
      )

      setTestimonials(data)
      setDataLoaded(true)
    } catch (error) {
      console.error("Error loading testimonials:", error)
      setTestimonials([])
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

  if (testimonials.length === 0) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
              <span>Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Student <span className="text-red-600">Stories</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Hear from our students about how CSF has impacted their lives and faith journey
            </p>
          </div>
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Quote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No testimonials at the moment.</p>
            <Link href="/testimonials">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                View All Testimonials
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Student Testimonials</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Hear from our students about how CSF has impacted their lives and faith journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Quote className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <blockquote className="text-gray-700 text-center mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </blockquote>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">{testimonial.name}</h3>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-sm text-gray-600">
                      {testimonial.role}
                      {testimonial.role && testimonial.company && " • "}
                      {testimonial.company}
                    </p>
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        !testimonial.rating || i < testimonial.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/testimonials">
            <Button
              size="lg"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Read More Testimonials
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
