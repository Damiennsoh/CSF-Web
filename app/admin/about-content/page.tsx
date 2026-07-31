"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Shield, Save, Eye, RefreshCw } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"

interface AboutContent {
  id: string
  mission: string
  vision: string
  love_value: string
  community_value: string
  truth_value: string
  updated_at: string
}

export default function AboutContentPage() {
  const { isAdmin } = useAuth()
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form states
  const [mission, setMission] = useState("")
  const [vision, setVision] = useState("")
  const [loveValue, setLoveValue] = useState("")
  const [communityValue, setCommunityValue] = useState("")
  const [truthValue, setTruthValue] = useState("")
  const subscribed = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!isAdmin) return
    mounted.current = true
    if (subscribed.current) return
    subscribed.current = true

    if (!db) {
      console.warn("[AdminAboutContent] Firestore not initialized yet")
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "about_content", "main"), (docSnapshot) => {
      if (!mounted.current) return
      if (docSnapshot.exists()) {
        const data = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as AboutContent
        setAboutContent(data)
        
        // Set form values
        setMission(data.mission || "")
        setVision(data.vision || "")
        setLoveValue(data.love_value || "")
        setCommunityValue(data.community_value || "")
        setTruthValue(data.truth_value || "")
      } else {
        // Set default content if document doesn't exist
        const defaultContent: AboutContent = {
          id: "main",
          mission: "To create a welcoming community where Christian students can grow in their faith, build meaningful relationships, and develop as leaders who will make a positive impact in their communities and world.",
          vision: "To see every student on campus have the opportunity to encounter Jesus Christ and experience the transforming power of His love through authentic community, biblical teaching, and practical service.",
          love_value: "We believe in showing Christ's love through our actions, words, and relationships with one another.",
          community_value: "We value authentic relationships and believe that we grow best when we do life together.",
          truth_value: "We are committed to studying and living according to God's Word as our ultimate authority.",
          updated_at: new Date().toISOString()
        }
        setAboutContent(defaultContent)
        setMission(defaultContent.mission)
        setVision(defaultContent.vision)
        setLoveValue(defaultContent.love_value)
        setCommunityValue(defaultContent.community_value)
        setTruthValue(defaultContent.truth_value)
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
  }, [isAdmin])

  const updateAboutContent = async () => {
    if (!mission.trim() || !vision.trim() || !loveValue.trim() || !communityValue.trim() || !truthValue.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      const updatedContent: Partial<AboutContent> = {
        mission: mission.trim(),
        vision: vision.trim(),
        love_value: loveValue.trim(),
        community_value: communityValue.trim(),
        truth_value: truthValue.trim(),
        updated_at: new Date().toISOString()
      }

      const contentRef = doc(db, "about_content", "main")
      await updateDoc(contentRef, updatedContent)

      toast({
        title: "Success",
        description: "About page content has been updated"
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating about content:", error)
      toast({
        title: "Error",
        description: "Failed to update about content",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openEditDialog = () => {
    if (aboutContent) {
      setMission(aboutContent.mission)
      setVision(aboutContent.vision)
      setLoveValue(aboutContent.love_value)
      setCommunityValue(aboutContent.community_value)
      setTruthValue(aboutContent.truth_value)
      setIsEditing(true)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
            <AdminBackButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">About Page Content</h1>
              <p className="text-gray-600">Manage mission, vision, and core values</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.open("/about", "_blank")}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={openEditDialog}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Content
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : aboutContent ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  🎯 Mission
                </CardTitle>
                <CardDescription>Your organization's purpose and direction</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aboutContent.mission}</p>
              </CardContent>
            </Card>

            {/* Vision Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  👁️ Vision
                </CardTitle>
                <CardDescription>Future aspirations and goals</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aboutContent.vision}</p>
              </CardContent>
            </Card>

            {/* Love Value Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  ❤️ Love
                </CardTitle>
                <CardDescription>Core value: Love</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aboutContent.love_value}</p>
              </CardContent>
            </Card>

            {/* Community Value Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  👥 Community
                </CardTitle>
                <CardDescription>Core value: Community</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aboutContent.community_value}</p>
              </CardContent>
            </Card>

            {/* Truth Value Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  📖 Truth
                </CardTitle>
                <CardDescription>Core value: Truth</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aboutContent.truth_value}</p>
              </CardContent>
            </Card>

            {/* Last Updated Card */}
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Last updated: {new Date(aboutContent.updated_at).toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={openEditDialog}>
                    <Edit className="w-3 h-3 mr-1" />
                    Quick Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-20">
            <CardContent>
              <p className="text-gray-500 text-lg mb-4">No content found</p>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle>Edit About Page Content</DialogTitle>
            <DialogDescription>
              Update the mission, vision, and core values displayed on the About page
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto flex-grow">
            <div className="space-y-6">
              {/* Mission */}
              <div>
                <Label htmlFor="mission" className="text-base font-semibold">Mission *</Label>
                <Textarea
                  id="mission"
                  placeholder="Describe your organization's mission..."
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Vision */}
              <div>
                <Label htmlFor="vision" className="text-base font-semibold">Vision *</Label>
                <Textarea
                  id="vision"
                  placeholder="Describe your organization's vision..."
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Core Values */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Core Values *</Label>
                
                <div>
                  <Label htmlFor="love_value" className="text-sm font-medium">❤️ Love</Label>
                  <Textarea
                    id="love_value"
                    placeholder="Describe the value of love..."
                    value={loveValue}
                    onChange={(e) => setLoveValue(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="community_value" className="text-sm font-medium">👥 Community</Label>
                  <Textarea
                    id="community_value"
                    placeholder="Describe the value of community..."
                    value={communityValue}
                    onChange={(e) => setCommunityValue(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="truth_value" className="text-sm font-medium">📖 Truth</Label>
                  <Textarea
                    id="truth_value"
                    placeholder="Describe the value of truth..."
                    value={truthValue}
                    onChange={(e) => setTruthValue(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={updateAboutContent} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
