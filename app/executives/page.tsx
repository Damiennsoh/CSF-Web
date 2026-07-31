"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  User,
  Users,
  Calendar
} from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore"
import Link from "next/link"

interface Executive {
  id: string
  name: string
  role: string
  profession?: string
  location?: string
  phone?: string
  photo?: string
  created_at: string
}

interface ExecutiveTenure {
  id: string
  yearName: string
  description?: string
  members: Executive[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ExecutivesPage() {
  const [tenures, setTenures] = useState<ExecutiveTenure[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const subscribed = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    loadTenures()
    return () => { mounted.current = false }
  }, [])

  const loadTenures = () => {
    if (!db) {
      console.warn("[ExecutivesPage] Firestore not initialized yet")
      setLoading(false)
      return
    }
    
    try {
      const q = query(
        collection(db!, "executive_tenures"),
        orderBy("yearName", "desc"),
        limit(50)
      )
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!mounted.current) return
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExecutiveTenure[]
        
        setTenures(data)
        setLoading(false)
      }, (error) => {
        if (!mounted.current) return
        console.error("Error loading tenures:", error)
        setLoading(false)
      })

      return () => {
        unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up tenures listener:", error)
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading executive tenures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <ShieldCheck className="w-8 h-8" />
                Fellowship Executives
              </h1>
              <p className="text-blue-100 text-sm mt-1">Past & Current Executive Members Gallery</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Accordion List */}
        <div className="space-y-4">
          {tenures.length === 0 && (
            <Card className="text-center py-20">
              <CardContent>
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Executive Tenures Recorded</h3>
                <p className="text-gray-500">
                  Executive tenures will appear here once added by administrators
                </p>
              </CardContent>
            </Card>
          )}

          {tenures.map((tenure) => (
            <Card 
              key={tenure.id} 
              className={`transition-all duration-300 overflow-hidden ${
                expandedId === tenure.id 
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Card Header (Folded Part) */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(tenure.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tenure.yearName}</h3>
                      <p className="text-sm text-gray-500">
                        {tenure.members?.length || 0} Executive Members
                        {tenure.is_active && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Active</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedId === tenure.id ? 
                      <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    }
                  </div>
                </div>
              </div>

              {/* Card Content (Expanded Part) */}
              {expandedId === tenure.id && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  {tenure.description && (
                    <p className="text-gray-600 mb-6 italic">{tenure.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tenure.members?.map((member) => (
                      <Card key={member.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="relative w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                  <span className="text-white font-bold text-lg">
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate">{member.name}</h4>
                              <p className="text-blue-600 text-sm font-semibold mb-2">{member.role}</p>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                {member.profession && (
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{member.profession}</span>
                                  </div>
                                )}
                                {member.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{member.location}</span>
                                  </div>
                                )}
                                {member.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-blue-600 font-medium">{member.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-12 py-10 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">"Remember your leaders, who spoke the word of God to you..."</p>
        <p className="text-gray-400 text-xs mt-1">Hebrews 13:7</p>
      </footer>
    </div>
  )
}
