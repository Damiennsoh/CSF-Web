"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Quote, Star, Search } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"

interface Testimonial {
  id: string
  name: string
  role?: string
  company?: string
  content: string
  rating?: number
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTestimonials()
  }, [])

  useEffect(() => {
    filterTestimonials()
  }, [testimonials, searchTerm, roleFilter])

  const loadTestimonials = async () => {
    try {
      const q = query(
        collection(db!, "testimonials"),
        where("is_active", "==", true),
        orderBy("is_featured", "desc"),
        orderBy("createdAt", "desc"),
        limit(50)
      )
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
      })) as Testimonial[]

      setTestimonials(data)
    } catch (error) {
      console.error("Error loading testimonials with compound query:", error)
      // Fallback: load all testimonials without compound filters
      try {
        const fallbackQ = query(
          collection(db!, "testimonials"),
          orderBy("createdAt", "desc"),
          limit(50)
        )
        const fallbackSnap = await getDocs(fallbackQ)
        const fallbackData = fallbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
        })) as Testimonial[]
        setTestimonials(fallbackData)
      } catch (fallbackError) {
        console.error("Fallback testimonials query failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterTestimonials = () => {
    let filtered = testimonials

    if (searchTerm) {
      filtered = filtered.filter(
        (testimonial) =>
          testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          testimonial.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter) {
      filtered = filtered.filter((testimonial) => testimonial.role === roleFilter)
    }

    setFilteredTestimonials(filtered)
  }

  const getUniqueRoles = () => {
    const roles = testimonials.map((testimonial) => testimonial.role).filter(Boolean)
    return [...new Set(roles)]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading testimonials...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <BackButton />

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Student Testimonials</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Read inspiring stories from our students about how CSF has impacted their lives, faith, and academic
            journey.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 bg-gray-50 p-6 rounded-lg">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {getUniqueRoles().map((role) => (
                  <SelectItem key={role} value={role || ''}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setRoleFilter("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Testimonials Grid */}
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No testimonials found matching your search criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTestimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${
                  testimonial.is_featured ? "ring-2 ring-yellow-400" : ""
                }`}
              >
                <CardContent className="p-8">
                  {testimonial.is_featured && <Badge className="mb-4 bg-yellow-100 text-yellow-800">Featured</Badge>}

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
                    <p className="text-sm text-gray-600">
                      {testimonial.role} {testimonial.company && `• ${testimonial.company}`}
                    </p>
                  </div>

                  <div className="flex justify-center mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Share Your Story</h2>
          <p className="text-xl mb-8 text-blue-100">
            Has CSF impacted your life? We'd love to hear your testimony and share it with others!
          </p>
          <Button size="lg" variant="secondary">
            Submit Your Testimony
          </Button>
        </div>
      </div>
    </div>
  )
}
