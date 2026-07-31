"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, MapPin, Briefcase, Star, Search, Calendar } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"

interface Alumni {
  id: string
  name: string
  graduation_year: number
  degree: string
  current_position: string
  company_organization: string
  location: string
  bio: string
  testimony: string
  is_featured: boolean
  achievements: string
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [filteredAlumni, setFilteredAlumni] = useState<Alumni[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlumni()
  }, [])

  useEffect(() => {
    filterAlumni()
  }, [alumni, searchTerm, yearFilter])

  const loadAlumni = async () => {
    try {
      const q = query(
        collection(db, "alumni"),
        where("is_active", "==", true),
        orderBy("graduation_year", "desc")
      )
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alumni[]

      setAlumni(data)
    } catch (error) {
      console.error("Error loading alumni with filter:", error)
      // Fallback: load all alumni without is_active filter
      try {
        const fallbackQ = query(
          collection(db, "alumni"),
          orderBy("graduation_year", "desc")
        )
        const fallbackSnap = await getDocs(fallbackQ)
        const fallbackData = fallbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Alumni[]
        setAlumni(fallbackData)
      } catch (fallbackError) {
        console.error("Fallback alumni query failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterAlumni = () => {
    let filtered = alumni

    if (searchTerm) {
      filtered = filtered.filter(
        (alum) =>
          alum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alum.current_position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alum.company_organization.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (yearFilter) {
      filtered = filtered.filter((alum) => alum.graduation_year.toString() === yearFilter)
    }

    setFilteredAlumni(filtered)
  }

  const getUniqueYears = () => {
    const years = alumni.map((alum) => alum.graduation_year)
    return [...new Set(years)].sort((a, b) => b - a)
  }

  const featuredAlumni = filteredAlumni.filter((alum) => alum.is_featured)
  const regularAlumni = filteredAlumni.filter((alum) => !alum.is_featured)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading alumni information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header Banner */}
      <div className="bg-red-600 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight animate-fade-in">
            Our <span className="text-red-200 underline decoration-red-300 decoration-8 underline-offset-8 italic">Alumni</span>
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed font-light animate-slide-up">
            Celebrating the achievements of CSF graduates who are making a difference around the world.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-black/5 mb-12">
          <BackButton />
          
          {/* Search and Filter */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, position, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by graduation year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {getUniqueYears().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setYearFilter("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Featured Alumni */}
        {featuredAlumni.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Featured Alumni
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredAlumni.map((alum) => (
                <Card key={alum.id} className="border-l-4 border-l-yellow-500 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{alum.name}</CardTitle>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>
                          {alum.degree} • Class of {alum.graduation_year}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{alum.current_position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{alum.location}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">{alum.bio}</p>
                    {alum.testimony && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm italic text-blue-800">"{alum.testimony}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Alumni */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">All Alumni ({filteredAlumni.length})</h2>

          {filteredAlumni.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No alumni found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularAlumni.map((alum) => (
                <Card key={alum.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{alum.name}</CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Class of {alum.graduation_year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{alum.current_position}</span>
                      </div>
                      <p className="text-gray-500">{alum.company_organization}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{alum.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Are You a CSF Alumni?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join our alumni network and stay connected with the CSF community
          </p>
          <Button size="lg" variant="secondary">
            Update Your Information
          </Button>
        </div>
      </div>
    </div>
  )
}
