"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Users, BookOpen, Target, Loader2 } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, doc, onSnapshot } from "firebase/firestore"

interface AboutContent {
  id: string
  mission: string
  vision: string
  love_value: string
  community_value: string
  truth_value: string
  updated_at: string
}

export default function AboutPage() {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const subscribed = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    if (subscribed.current) return
    subscribed.current = true

    if (!db) {
      console.warn("[AboutPage] Firestore not initialized yet")
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "about_content", "main"), (docSnapshot) => {
      if (!mounted.current) return
      if (docSnapshot.exists()) {
        setAboutContent({
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as AboutContent)
      } else {
        setAboutContent({
          id: "main",
          mission: "To create a welcoming community where Christian students can grow in their faith, build meaningful relationships, and develop as leaders who will make a positive impact in their communities and world.",
          vision: "To see every student on campus have the opportunity to encounter Jesus Christ and experience the transforming power of His love through authentic community, biblical teaching, and practical service.",
          love_value: "We believe in showing Christ's love through our actions, words, and relationships with one another.",
          community_value: "We value authentic relationships and believe that we grow best when we do life together.",
          truth_value: "We are committed to studying and living according to God's Word as our ultimate authority.",
          updated_at: new Date().toISOString()
        })
      }
      setLoading(false)
    }, (error) => {
      if (!mounted.current) return
      console.error("Error loading about content:", error)
      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscribed.current = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-6">
            <BackButton showHomeButton={true} className="text-white hover:text-gray-200" />
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Users className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">About Our Fellowship</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Learn more about our mission, vision, and community we're building together
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <Target className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {loading ? "Loading..." : aboutContent?.mission || "Our mission is to create a welcoming community where Christian students can grow in their faith, build meaningful relationships, and develop as leaders who will make a positive impact in their communities and world."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {loading ? "Loading..." : aboutContent?.vision || "Our vision is to see every student on campus have the opportunity to encounter Jesus Christ and experience the transforming power of His love through authentic community, biblical teaching, and practical service."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Love</h3>
              <p className="text-gray-600">
                {loading ? "Loading..." : aboutContent?.love_value || "We believe in showing Christ's love through our actions, words, and relationships with one another."}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-gray-600">
                {loading ? "Loading..." : aboutContent?.community_value || "We value authentic relationships and believe that we grow best when we do life together."}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Truth</h3>
              <p className="text-gray-600">
                {loading ? "Loading..." : aboutContent?.truth_value || "We are committed to studying and living according to God's Word as our ultimate authority."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Want to Learn More?</h2>
          <p className="text-xl text-blue-100 mb-8">
            We'd love to connect with you and answer any questions you might have
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Contact Us
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Visit Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
