"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, limit, orderBy, getDocs } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"

interface Event {
  id: string
  title: string
  description: string
  eventDate?: string
  recurringDate?: string
  time?: string
  timeRange?: string
  location: string
  venue?: string
  isFeatured: boolean
  isActive: boolean
  eventType: "regular" | "special" | "weekly" | "monthly"
  registrationRequired: boolean
  display_order?: number
}

export function EventsPreview() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let isSubscribed = true

    async function loadUpcomingEvents() {
      if (dataLoaded) return

      try {
        const data = await getCachedData(
          CACHE_KEYS.EVENTS,
          async () => {
            try {
              const q = query(
                collection(db!, "events"),
                where("isActive", "==", true),
                orderBy("display_order", "asc"),
                limit(5)
              )
              const querySnapshot = await getDocs(q)
              return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Event[]
            } catch (error) {
              // Fallback: try without ordering
              const fallbackQ = query(
                collection(db!, "events"),
                where("isActive", "==", true),
                limit(5)
              )
              const fallbackSnap = await getDocs(fallbackQ)
              return fallbackSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Event[]
            }
          },
          CACHE_TTL.HOMEPAGE_SECTIONS
        )
        
        if (isSubscribed) {
          // Filter for featured events and limit to 3
          const featuredEvents = data.filter(event => event.isFeatured === true)
          setEvents(featuredEvents.slice(0, 3))
          setDataLoaded(true)
        }
      } catch (error) {
        console.error("Error loading events:", error)
        if (isSubscribed) {
          setEvents([])
          setDataLoaded(true)
        }
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }

    loadUpcomingEvents()
    return () => { isSubscribed = false }
  }, [dataLoaded])

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded-xl w-64 mx-auto"></div>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-[32px]"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="h-3 w-3" />
                <span>Upcoming Gatherings</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                Don't Miss Our <span className="text-red-600">Events</span>
              </h2>
              <p className="mt-6 text-xl text-gray-600 font-light leading-relaxed">
                Join our community for worship, bible study, and special fellowship activities.
              </p>
            </div>
          </div>
          <div className="text-center py-16 bg-gray-50 rounded-[32px] border border-gray-100">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-6">No upcoming events at the moment.</p>
            <Link href="/events">
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 font-bold">
                View All Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="h-3 w-3" />
              <span>Upcoming Gatherings</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
              Don't Miss Our <span className="text-red-600">Events</span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 font-light leading-relaxed">
              Join our community for worship, bible study, and special fellowship activities.
            </p>
          </div>
          <Link href="/events">
            <Button variant="outline" className="group rounded-full px-8 py-6 border-2 hover:bg-gray-900 hover:text-white transition-all duration-300 font-bold">
              View All Events
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="group relative">
              <div className="absolute inset-0 bg-red-600 rounded-[32px] translate-y-2 translate-x-1 opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
              <Card className="relative h-full border-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] hover:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[32px] overflow-hidden bg-white border-t border-gray-50">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      {event.recurringDate ? (
                        <span className="text-lg font-black text-red-600">
                          {event.recurringDate}
                        </span>
                      ) : event.eventDate ? (
                        <>
                          <span className="text-3xl font-black text-red-600">
                            {format(new Date(event.eventDate), "dd")}
                          </span>
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {format(new Date(event.eventDate), "MMM yyyy")}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-black text-red-600">
                          Ongoing
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {event.isFeatured && (
                        <Badge className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                          Featured
                        </Badge>
                      )}
                      <Badge variant={event.eventType === "regular" ? "default" : "secondary"} className="text-[10px] px-2 py-1">
                        {event.eventType === "regular" ? "🔄" : event.eventType === "special" ? "⭐" : event.eventType === "weekly" ? "📅" : "📆"}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                    {event.title}
                  </h3>

                  <p className="text-gray-500 text-sm mb-8 line-clamp-3 leading-relaxed font-medium">
                    {event.description}
                  </p>

                  <div className="mt-auto space-y-4 pt-6 border-t border-gray-50">
                    <div className="flex items-center text-gray-400 group-hover:text-gray-600 transition-colors text-sm font-bold">
                      <Clock className="h-4 w-4 mr-3 text-red-500" />
                      {event.timeRange || event.time}
                    </div>
                    <div className="flex items-center text-gray-400 group-hover:text-gray-600 transition-colors text-sm font-bold">
                      <MapPin className="h-4 w-4 mr-3 text-red-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors text-sm font-bold">
                        <MapPin className="h-4 w-4 mr-3" />
                        <span className="truncate">Venue: {event.venue}</span>
                      </div>
                    )}
                  </div>

                  {event.registrationRequired && (
                    <div className="mt-8">
                      <Link href="/events">
                        <Button className="w-full bg-gray-900 hover:bg-red-600 text-white rounded-2xl py-6 font-bold transition-all duration-300">
                          Register Now
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
