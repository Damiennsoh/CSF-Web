"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, MapPin, Camera, Star, Download } from "lucide-react"
import DownloadButton from "@/components/ui/download-button"
import { Navigation } from "@/components/navigation"
import { BackButton } from "@/components/back-button"
import { db, isFirebaseReady } from "@/lib/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import Image from "next/image"

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

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGallery()
  }, [])

  useEffect(() => {
    filterItems()
  }, [galleryItems, searchTerm, categoryFilter])

  const loadGallery = async () => {
    try {
      // Check if Firebase is ready before proceeding
      if (!isFirebaseReady() || !db) {
        console.error("Firebase is not initialized")
        setGalleryItems([])
        return
      }

      const q = query(collection(db, "gallery"), orderBy("display_order", "asc"))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc =>({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[]

      setGalleryItems(data)
    } catch (error) {
      console.error("Error loading gallery:", error)
      // Fallback: try ordering by created_at if display_order fails
      try {
        if (!isFirebaseReady() || !db) {
          console.error("Firebase is not initialized for fallback query")
          setGalleryItems([])
          return
        }

        const fallbackQ = query(collection(db, "gallery"), orderBy("created_at", "desc"))
        const fallbackSnap = await getDocs(fallbackQ)
        const fallbackData = fallbackSnap.docs.map(doc =>({
          id: doc.id,
          ...doc.data()
        })) as GalleryItem[]
        setGalleryItems(fallbackData)
      } catch (fallbackError) {
        console.error("Fallback gallery query failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = galleryItems

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    setFilteredItems(filtered)
  }

  const getUniqueCategories = () => {
    const categories = galleryItems.map((item) => item.category)
    return [...new Set(categories)]
  }

  const featuredItems = filteredItems.filter((item) => item.is_featured)
  const regularItems = filteredItems.filter((item) => !item.is_featured)

  const formatDate = (dateValue: string | undefined | any) => {
    if (!dateValue) return "No date available"
    
    try {
      // Handle Firebase Timestamp object
      if (typeof dateValue === 'object' && 'seconds' in dateValue) {
        const date = new Date(dateValue.seconds * 1000)
        if (isNaN(date.getTime())) return "Invalid date"
        
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }
      
      // Handle string date
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return "Invalid date"
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Invalid date"
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      events: "bg-blue-100 text-blue-800",
      ministries: "bg-green-100 text-green-800",
      worship: "bg-purple-100 text-purple-800",
      general: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement('a')
    
    // For Cloudinary URLs, add download flag with custom filename
    if (imageUrl.includes('cloudinary.com')) {
      // Create a clean filename from the title
      const cleanFilename = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      
      // Add fl_attachment flag with custom filename
      let downloadUrl = imageUrl
      
      // Check if fl_attachment is already present
      if (!imageUrl.includes('/fl_attachment')) {
        // Insert fl_attachment after /upload/ with custom filename
        if (imageUrl.includes('/upload/')) {
          downloadUrl = imageUrl.replace('/upload/', `/upload/fl_attachment:${cleanFilename}/`)
        }
      }
      
      link.href = downloadUrl
      link.download = `${cleanFilename}.jpg`
    } else {
      link.href = imageUrl
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
    }
    
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading gallery...</p>
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
            Photo <span className="text-red-200 underline decoration-red-300 decoration-8 underline-offset-8 italic">Gallery</span>
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed font-light animate-slide-up">
            Capturing moments of faith, fellowship, and service in our vibrant CSF community.
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
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Featured Photos */}
        {featuredItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Featured Photos
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow group">
                  <div className="relative h-64">
                    <Image src={item.image_url || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">Featured</Badge>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <DownloadButton
                        fileUrl={item.image_url}
                        fileName={item.title}
                        fileType="image"
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 border-0"
                      />
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{item.description}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Photos */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">All Photos ({filteredItems.length})</h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No photos found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative h-48">
                    <Image src={item.image_url || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <DownloadButton
                        fileUrl={item.image_url}
                        fileName={item.title}
                        fileType="image"
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 border-0"
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                      <Badge className={`text-xs ${getCategoryColor(item.category)}`}>{item.category}</Badge>
                    </div>
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">{item.description}</p>
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Share Your Photos</h2>
          <p className="text-xl mb-8 text-blue-100">
            Have photos from CSF events? We'd love to feature them in our gallery!
          </p>
          <Button size="lg" variant="secondary">
            Submit Photos
          </Button>
        </div>
      </div>
    </div>
  )
}
