"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Music, BookOpen, Heart, Play, UserCheck, Clock, MapPin, Mail, FileText } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore"

type Ministry = {
  id: string
  name: string
  description?: string
  image_url?: string
  resource_url?: string
  is_active?: boolean
  display_order?: number
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "ministries"), orderBy("display_order", "asc"), limit(6))
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Ministry[]
        setMinistries(data)
      } catch (e) {
        console.error("Error loading ministries:", e)
        setMinistries([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <BackButton />

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Ministries</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the various ways to grow in faith, serve others, and build meaningful relationships within our
            fellowship community.
          </p>
        </div>

        {/* Ministries Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : ministries.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Ministries Available</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Ministries information will be available soon. Please check back later or contact the admin to add ministries.
              </p>
            </div>
          ) : (
            ministries.map((m, idx) => (
              <Card key={m.id || idx} className="h-full border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getColorClasses(["pink","blue","purple","green","orange","indigo"][idx%6])}`}>
                    {idx === 0 && <Users className="h-8 w-8" />}
                    {idx === 1 && <UserCheck className="h-8 w-8" />}
                    {idx === 2 && <Music className="h-8 w-8" />}
                    {idx === 3 && <BookOpen className="h-8 w-8" />}
                    {idx === 4 && <Heart className="h-8 w-8" />}
                    {idx === 5 && <Play className="h-8 w-8" />}
                  </div>
                  <CardTitle className="text-xl">{m.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <p className="text-gray-600 text-sm leading-relaxed">{m.description}</p>
                  {m.resource_url && (
                    <a href={m.resource_url} className="inline-flex items-center justify-center text-blue-600 hover:underline text-sm" target="_blank">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Ministry Resource
                    </a>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Leadership Section */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ministry Leadership</h2>
            <p className="text-lg text-gray-600">Meet the dedicated leaders serving in our various ministries</p>
          </div>

          <div className="text-center">
            <Link href="/leadership">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Leaders
              </Button>
            </Link>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Involved?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join one of our ministries and start making a difference in your community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Contact Us
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                Join Fellowship
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
