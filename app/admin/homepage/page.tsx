"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AdminBackButton } from "@/components/admin-back-button"
import { HomepageSectionPreview } from "@/components/homepage-section-preview"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"

interface SectionData {
  events: any[]
  alumni: any[]
  testimonials: any[]
  gallery: any[]
  leadership: any[]
  resources: any[]
  ministries: any[]
  donations: any[]
  messages: any[]
  prayers: any[]
}

export default function HomepageManager() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState<SectionData>({
    events: [],
    alumni: [],
    testimonials: [],
    gallery: [],
    leadership: [],
    resources: [],
    ministries: [],
    donations: [],
    messages: [],
    prayers: [],
  })
  const [loading, setLoading] = useState(true)
  const [loadingSection, setLoadingSection] = useState<string | null>(null)

  useEffect(() => {
    if (user && isAdmin) {
      loadAllSections()
    }
  }, [user, isAdmin])

  const loadAllSections = async () => {
    setLoading(true)
    try {
      const [
        eventsSnap,
        alumniSnap,
        testimonialSnap,
        gallerySnap,
        leadershipSnap,
        resourcesSnap,
        ministriesSnap,
        donationsSnap,
        messagesSnap,
        prayersSnap,
      ] = await Promise.all([
        getDocs(
          query(
            collection(db, "events"),
            where("isActive", "==", true),
            orderBy("eventDate", "asc")
          )
        ),
        getDocs(
          query(
            collection(db, "alumni"),
            where("is_active", "==", true),
            orderBy("graduation_year", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, "testimonials"),
            where("is_active", "==", true),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, "gallery"),
            where("is_active", "==", true),
            orderBy("display_order", "asc")
          )
        ),
        getDocs(
          query(
            collection(db, "executive_leaders"),
            where("is_active", "==", true),
            orderBy("name", "asc")
          )
        ),
        getDocs(collection(db, "spiritual_resources")),
        getDocs(
          query(
            collection(db, "ministries"),
            where("is_active", "==", true),
            orderBy("display_order", "asc")
          )
        ),
        getDocs(
          query(
            collection(db, "donations"),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, "contact_messages"),
            orderBy("createdAt", "desc")
          )
        ),
        getDocs(
          query(
            collection(db, "prayer_requests"),
            orderBy("createdAt", "desc")
          )
        ),
      ])

      setData({
        events: eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        alumni: alumniSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        testimonials: testimonialSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
        gallery: gallerySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        leadership: leadershipSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        resources: resourcesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ministries: ministriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        donations: donationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        messages: messagesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        prayers: prayersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      })
    } catch (error) {
      console.error("Error loading sections:", error)
      toast({
        title: "Error",
        description: "Failed to load homepage sections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (
    section: keyof SectionData
  ) => async (id: string) => {
    const collections: Record<string, string> = {
      events: "events",
      alumni: "alumni",
      testimonials: "testimonials",
      gallery: "gallery",
      leadership: "executive_leaders",
      resources: "spiritual_resources",
      ministries: "ministries",
      donations: "donations",
      messages: "contact_messages",
      prayers: "prayer_requests",
    }

    setLoadingSection(id)
    try {
      await deleteDoc(doc(db, collections[section], id))
      setData((prev) => ({
        ...prev,
        [section]: prev[section].filter((item) => item.id !== id),
      }))
    } finally {
      setLoadingSection(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access denied</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <AdminBackButton />
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Homepage & Community Sections Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all homepage sections and community content in one place. Edit Events, Alumni, Testimonials, Gallery, Leadership, Ministries, and Resources. View submissions from Donations, Messages, and Prayer Requests.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HomepageSectionPreview
            section="events"
            items={data.events}
            onDelete={handleDelete("events")}
            isLoading={loadingSection === "events"}
          />
          <HomepageSectionPreview
            section="alumni"
            items={data.alumni}
            onDelete={handleDelete("alumni")}
            isLoading={loadingSection === "alumni"}
          />
          <HomepageSectionPreview
            section="testimonials"
            items={data.testimonials}
            onDelete={handleDelete("testimonials")}
            isLoading={loadingSection === "testimonials"}
          />
          <HomepageSectionPreview
            section="gallery"
            items={data.gallery}
            onDelete={handleDelete("gallery")}
            isLoading={loadingSection === "gallery"}
          />
          <HomepageSectionPreview
            section="leadership"
            items={data.leadership}
            onDelete={handleDelete("leadership")}
            isLoading={loadingSection === "leadership"}
          />
          <HomepageSectionPreview
            section="resources"
            items={data.resources}
            onDelete={handleDelete("resources")}
            isLoading={loadingSection === "resources"}
          />
          <HomepageSectionPreview
            section="ministries"
            items={data.ministries}
            onDelete={handleDelete("ministries")}
            isLoading={loadingSection === "ministries"}
          />
          <HomepageSectionPreview
            section="donations"
            items={data.donations}
            onDelete={handleDelete("donations")}
            isLoading={loadingSection === "donations"}
            isViewOnly={true}
          />
          <HomepageSectionPreview
            section="messages"
            items={data.messages}
            onDelete={handleDelete("messages")}
            isLoading={loadingSection === "messages"}
            isViewOnly={true}
          />
          <HomepageSectionPreview
            section="prayers"
            items={data.prayers}
            onDelete={handleDelete("prayers")}
            isLoading={loadingSection === "prayers"}
            isViewOnly={true}
          />
        </div>
      )}
    </div>
  )
}
