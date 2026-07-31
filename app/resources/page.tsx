"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Download, Search, Loader2 } from "lucide-react"
import DownloadButton from "@/components/ui/download-button"
import { BackButton } from "@/components/back-button"
import { db, isFirebaseReady } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"

interface Resource {
  id: string
  title: string
  description: string
  file_url?: string
  file_type?: string
  category?: string
  author?: string
  date_uploaded?: string
  downloads?: number
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResources()
  }, [])

  useEffect(() => {
    filterResources()
  }, [resources, searchTerm, categoryFilter])

  const loadResources = async () => {
    try {
      // Check if Firebase is ready before proceeding
      if (!isFirebaseReady() || !db) {
        console.error("Firebase is not initialized")
        setResources([])
        return
      }

      const q = query(collection(db, "spiritual_resources"), orderBy("date_uploaded", "desc"))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[]

      setResources(data)
    } catch (error) {
      console.error("Error loading resources:", error)
      setResources([])
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
          resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.author?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((resource) => resource.category === categoryFilter)
    }

    setFilteredResources(filtered)
  }

  const getUniqueCategories = () => {
    const categories = resources
      .map((resource) => resource.category)
      .filter(Boolean)
    return [...new Set(categories)]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleDownload = (fileUrl: string, title: string, fileType?: string) => {
    const link = document.createElement('a')
    
    // For Cloudinary URLs, add download flag with custom filename
    if (fileUrl.includes('cloudinary.com')) {
      // Create a clean filename from the title
      const cleanFilename = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      
      // Add fl_attachment flag with custom filename
      let downloadUrl = fileUrl
      
      // Check if fl_attachment is already present
      if (!fileUrl.includes('/fl_attachment')) {
        // Insert fl_attachment after /upload/ with custom filename
        if (fileUrl.includes('/upload/')) {
          downloadUrl = fileUrl.replace('/upload/', `/upload/fl_attachment:${cleanFilename}/`)
        }
      }
      
      link.href = downloadUrl
      link.download = `${cleanFilename}.${getFileExtension(fileType)}`
    } else {
      link.href = fileUrl
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
    }
    
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileExtension = (fileType?: string): string => {
    const extensions: Record<string, string> = {
      'PDF': 'pdf',
      'Document': 'docx',
      'Video': 'mp4',
      'Audio': 'mp3',
      'Image': 'jpg',
      'PowerPoint': 'pptx',
      'Excel': 'xlsx',
      'Text': 'txt'
    }
    return extensions[fileType || 'Document'] || 'pdf'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-20">
          <Loader2 className="h-16 w-16 text-red-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-6">
            <BackButton showHomeButton={true} className="text-white hover:text-gray-200" />
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Spiritual Resources</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Materials to help you grow in faith and deepen your spiritual journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-12 bg-white p-6 rounded-lg shadow">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search resources..."
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
                  <SelectItem key={category} value={category || ""}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      {resource.category && (
                        <Badge variant="secondary" className="mt-2">
                          {resource.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{resource.description}</p>
                  
                  <div className="space-y-2 text-xs text-gray-500">
                    {resource.author && (
                      <p><span className="font-semibold">Author:</span> {resource.author}</p>
                    )}
                    {resource.date_uploaded && (
                      <p><span className="font-semibold">Uploaded:</span> {formatDate(resource.date_uploaded)}</p>
                    )}
                    {resource.downloads !== undefined && (
                      <p><span className="font-semibold">Downloads:</span> {resource.downloads}</p>
                    )}
                  </div>

                  {resource.file_url && (
                    <DownloadButton
                      fileUrl={resource.file_url}
                      fileName={resource.title}
                      fileType={resource.file_type}
                      className="w-full mt-4"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Resources Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {resources.length === 0
                ? "No spiritual resources have been uploaded yet. Check back soon!"
                : "No resources match your search filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
