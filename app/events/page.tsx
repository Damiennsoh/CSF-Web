"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react'
import { BackButton } from "@/components/back-button"

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
  eventType: "regular" | "special" | "weekly" | "monthly"
  registrationRequired: boolean
  color?: string
}


export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const q = query(collection(db!, "events"), where("isActive", "==", true), orderBy("eventDate", "asc"), limit(50))
      const querySnapshot = await getDocs(q)
      const list: Event[] = []
      querySnapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Event))
      setEvents(list)
    } catch (error) {
      console.error("Error loading events with filter:", error)
      // Fallback: load all events without isActive filter
      try {
        const fallbackQ = query(collection(db!, "events"), orderBy("eventDate", "asc"), limit(50))
        const fallbackSnap = await getDocs(fallbackQ)
        const fallbackList: Event[] = []
        fallbackSnap.forEach(doc => fallbackList.push({ id: doc.id, ...doc.data() } as Event))
        setEvents(fallbackList)
      } catch (fallbackError) {
        console.error("Fallback events query failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const regularEventsFromDb = events.filter(e => e.eventType === "regular")
  const specialEventsFromDb = events.filter(e => e.eventType !== "regular")

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="mb-4 sm:mb-6">
            <BackButton showHomeButton={true} className="text-white hover:text-gray-200" />
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4">Events & Activities</h1>
            <p className="text-base sm:text-xl text-red-100 max-w-2xl mx-auto">
              Join us for worship, fellowship, and service
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-16">
            {/* Special Events */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-red-600" />
                Upcoming Special Events
              </h2>
              {specialEventsFromDb.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {specialEventsFromDb.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow border-t-4 border-t-red-600">
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <CardTitle className="text-lg sm:text-xl">{event.title}</CardTitle>
                            <CardDescription className="mt-1 text-xs sm:text-sm line-clamp-2">{event.description}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            {event.isFeatured && (
                              <Badge className="bg-red-600 shrink-0 text-[10px] sm:text-xs">Featured</Badge>
                            )}
                            <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                              {event.eventType === "special" ? "⭐ Special" : event.eventType === "weekly" ? "📅 Weekly" : "📆 Monthly"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="space-y-2 sm:space-y-3">
                          {event.eventDate && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-red-600" />
                              {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </div>
                          )}
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 text-red-600" />
                            {event.timeRange || event.time}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-red-600" />
                            {event.location}
                          </div>
                          {event.venue && (
                            <div className="flex items-center text-xs sm:text-sm text-purple-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              Venue: {event.venue}
                            </div>
                          )}
                          {event.registrationRequired && (
                            <div className="mt-4">
                              <Button className="w-full bg-red-600 hover:bg-red-700 h-9 sm:h-10 text-sm">Register Now</Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg text-center border">
                  <p className="text-gray-500 text-sm">No special events currently scheduled. Check back soon!</p>
                </div>
              )}
            </section>

            {/* Regular Events */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                <Clock className="h-6 w-6 text-red-600" />
                Regular Gatherings
              </h2>
              {regularEventsFromDb.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {regularEventsFromDb.map((event: any) => (
                    <Card key={event.id} className={`border-l-4 border-l-${event.color || 'red'}-500 shadow-sm`}>
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <CardTitle className="text-base sm:text-lg">{event.title}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              {event.eventType === "regular" ? "🔄 Regular Event" : event.eventType === "weekly" ? "📅 Weekly" : "📆 Monthly"}
                            </CardDescription>
                          </div>
                          {event.isFeatured && (
                            <Badge className="bg-red-600 shrink-0 text-[10px] sm:text-xs">Featured</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="space-y-2">
                          {event.recurringDate && (
                            <div className="flex items-center text-xs sm:text-sm text-blue-600 font-medium">
                              <Calendar className="h-4 w-4 mr-2" />
                              {event.recurringDate}
                            </div>
                          )}
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {event.timeRange || event.time}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {event.location}
                          </div>
                          {event.venue && (
                            <div className="flex items-center text-xs sm:text-sm text-purple-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              Venue: {event.venue}
                            </div>
                          )}
                          <p className="text-xs sm:text-sm text-gray-700 mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg text-center border">
                  <p className="text-gray-500 text-sm">No regular events scheduled. Contact admin to add regular gatherings!</p>
                </div>
              )}
            </section>

            {/* Call to Action - Mobile Optimized */}
            <section className="bg-red-50 rounded-2xl p-6 sm:p-10 text-center border border-red-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Stay Connected</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto">
                Don't miss out on our upcoming events. Join our community to stay updated!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-red-600 hover:bg-red-700 h-11 px-8">
                  <a href="/contact">Contact Us</a>
                </Button>
                <Button variant="outline" asChild className="h-11 px-8 border-red-200 text-red-600 hover:bg-red-50">
                  <a href="/auth/register">Join CSF</a>
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
