"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Download, Play, FileText, Headphones, Video, ImageIcon, Search, Star, ExternalLink } from "lucide-react"
import DownloadButton from "@/components/ui/download-button"
import { Navigation } from "@/components/navigation"
import { BackButton } from "@/components/back-button"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"

interface Resource {
  id: string
  title: string
  description: string
  resource_type: string
  content_url: string
  file_url: string
  file_type: string
  author: string
  category: string
  is_featured: boolean
  date_published: string
}

export default function SpiritualResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResources()
  }, [])

  useEffect(() => {
    filterResources()
  }, [resources, searchTerm, typeFilter, categoryFilter])

  const loadResources = async () => {
    try {
      if (!db) {
        console.error('Firestore database not initialized')
        return
      }
      const q = query(collection(db, "spiritual_resources"), orderBy("date_published", "desc"))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[]

      setResources(data)
    } catch (error) {
      console.error("Error loading resources:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = resources

    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.author.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter) {
      filtered = filtered.filter((resource) => resource.resource_type === typeFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter((resource) => resource.category === categoryFilter)
    }

    setFilteredResources(filtered)
  }

  const getUniqueTypes = () => {
    const types = resources.map((resource) => resource.resource_type)
    return [...new Set(types)]
  }

  const getUniqueCategories = () => {
    const categories = resources.map((resource) => resource.category)
    return [...new Set(categories)]
  }

  const getResourceIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-5 w-5" />
      case "audio":
        return <Headphones className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      case "image":
        return <ImageIcon className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      devotional: "bg-blue-100 text-blue-800",
      sermon: "bg-green-100 text-green-800",
      study_guide: "bg-purple-100 text-purple-800",
      book: "bg-orange-100 text-orange-800",
      music: "bg-pink-100 text-pink-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const featuredResources = filteredResources.filter((resource) => resource.is_featured)
  const regularResources = filteredResources.filter((resource) => !resource.is_featured)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading spiritual resources...</p>
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
            Spiritual <span className="text-red-200 underline decoration-red-300 decoration-8 underline-offset-8 italic">Resources</span>
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed font-light animate-slide-up">
            Deepen your faith with our curated collection of devotionals, sermons, and study guides.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-black/5 mb-12">
          <BackButton />
          
          {/* Search and Filter */}
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getUniqueTypes().map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setTypeFilter("")
                setCategoryFilter("")
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Bible Study Tool Button */}
          <div className="mt-6">
            <Button
              onClick={() => window.open('https://scripture-lens.vercel.app/', '_blank')}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 group"
            >
              <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
              <span className="sm:inline">Bible Study Tool</span>
              <ExternalLink className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
              Access advanced Bible study tools and resources
            </p>
          </div>
        </div>

        {/* Featured Resources */}
        {featuredResources.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Featured Resources
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredResources.map((resource) => (
                <Card key={resource.id} className="border-l-4 border-l-yellow-500 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getResourceIcon(resource.file_type)}
                        {resource.title}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    </div>
                    <CardDescription>By {resource.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">{resource.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={getTypeColor(resource.resource_type)}>
                        {resource.resource_type.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-gray-500">{resource.category}</span>
                    </div>
                    <div className="flex gap-2">
                      {resource.content_url && (
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          View
                        </Button>
                      )}
                      {resource.file_url && (
                        <DownloadButton 
                          fileUrl={resource.file_url}
                          fileName={resource.title}
                          fileType={resource.file_type}
                          size="sm"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Resources */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">All Resources ({filteredResources.length})</h2>

          {filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No resources found matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getResourceIcon(resource.file_type)}
                      {resource.title}
                    </CardTitle>
                    <CardDescription>By {resource.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed line-clamp-3">{resource.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={getTypeColor(resource.resource_type)}>
                        {resource.resource_type.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-gray-500">{resource.category}</span>
                    </div>
                    <div className="flex gap-2">
                      {resource.content_url && (
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          View
                        </Button>
                      )}
                      {resource.file_url && (
                        <DownloadButton 
                          fileUrl={resource.file_url}
                          fileName={resource.title}
                          fileType={resource.file_type}
                          size="sm"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Submit Resource Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Share Your Resources</h2>
          <p className="text-xl mb-8 text-blue-100">
            Have spiritual content that could bless others? Submit your resources to be featured!
          </p>
          <Button size="lg" variant="secondary">
            Submit Resource
          </Button>
        </div>
      </div>
    </div>
  )
}
