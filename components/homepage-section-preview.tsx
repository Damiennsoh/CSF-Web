"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Edit, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface PreviewItem {
  id: string
  title?: string
  name?: string
  image_url?: string
  imageUrl?: string
  description?: string
  content?: string
  role?: string
  position?: string
  current_occupation?: string
  company?: string
  donor_name?: string
  amount?: number
  subject?: string
  email?: string
  status?: string
  is_active?: boolean
  isActive?: boolean
  is_featured?: boolean
  isFeatured?: boolean
}

interface HomepageSectionPreviewProps {
  section: "events" | "alumni" | "testimonials" | "gallery" | "leadership" | "resources" | "ministries" | "donations" | "messages" | "prayers"
  items: PreviewItem[]
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
  isViewOnly?: boolean
}

const sectionConfig = {
  events: {
    title: "Events",
    icon: "📅",
    editPath: "/admin/events",
    addPath: "/admin/events?action=add",
    showImage: true,
    itemLabel: (item: PreviewItem) => item.title || "Untitled Event",
  },
  alumni: {
    title: "Alumni Network",
    icon: "🎓",
    editPath: "/admin/alumni",
    addPath: "/admin/alumni?action=add",
    showImage: true,
    itemLabel: (item: PreviewItem) => item.name || "Unnamed Alumni",
    subtitle: (item: PreviewItem) => item.current_occupation || item.role || "",
  },
  testimonials: {
    title: "Student Stories",
    icon: "⭐",
    editPath: "/admin/testimonials",
    addPath: "/admin/testimonials?action=add",
    showImage: true,
    itemLabel: (item: PreviewItem) => item.name || "Anonymous",
    subtitle: (item: PreviewItem) => item.role || item.company || "",
  },
  gallery: {
    title: "Gallery",
    icon: "🖼️",
    editPath: "/admin/gallery",
    addPath: "/admin/gallery?action=add",
    showImage: true,
    itemLabel: (item: PreviewItem) => item.title || "Untitled Photo",
  },
  leadership: {
    title: "Leadership",
    icon: "👥",
    editPath: "/admin/leadership",
    addPath: "/admin/leadership?action=add",
    showImage: true,
    itemLabel: (item: PreviewItem) => item.name || "Unnamed Leader",
    subtitle: (item: PreviewItem) => item.position || item.role || "",
  },
  resources: {
    title: "Resources",
    icon: "📚",
    editPath: "/admin/resources",
    addPath: "/admin/resources?action=add",
    showImage: false,
    itemLabel: (item: PreviewItem) => item.title || "Untitled Resource",
  },
  ministries: {
    title: "Ministries",
    icon: "⛪",
    editPath: "/admin/ministries",
    addPath: "/admin/ministries?action=add",
    showImage: true,
    itemLabel: (item: PreviewItem) => item.name || "Unnamed Ministry",
    subtitle: (item: PreviewItem) => item.description?.substring(0, 40) || "",
  },
  donations: {
    title: "Donations",
    icon: "💝",
    editPath: "/admin/donations",
    addPath: "/admin/donations?action=add",
    showImage: false,
    itemLabel: (item: PreviewItem) => item.donor_name || "Anonymous Donor",
    subtitle: (item: PreviewItem) => `$${item.amount || 0}` || "",
  },
  messages: {
    title: "Messages",
    icon: "💬",
    editPath: "/admin/messages",
    addPath: "/admin/messages?action=add",
    showImage: false,
    itemLabel: (item: PreviewItem) => item.name || "Anonymous",
    subtitle: (item: PreviewItem) => item.subject || item.email || "",
  },
  prayers: {
    title: "Prayer Requests",
    icon: "🙏",
    editPath: "/admin/prayer-requests",
    addPath: "/admin/prayer-requests?action=add",
    showImage: false,
    itemLabel: (item: PreviewItem) => item.name || "Anonymous Prayer",
    subtitle: (item: PreviewItem) => item.status || "pending",
  },
}

export function HomepageSectionPreview({
  section,
  items,
  onDelete,
  isLoading = false,
  isViewOnly = false,
}: HomepageSectionPreviewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const config = sectionConfig[section]
  const displayItems = items.slice(0, 4) // Show max 4 items

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardContent className="p-4 sm:p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <h3 className="font-semibold text-lg">{config.title}</h3>
            {isViewOnly && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                View Only
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">
            {items.length} items
          </Badge>
        </div>

        {/* Items Preview */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 flex-1 flex items-center justify-center">
            <p className="text-sm">No {config.title.toLowerCase()} yet</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-2 bg-gray-50/50 rounded border border-gray-100 group hover:bg-gray-100/50 transition-colors"
              >
                {/* Thumbnail */}
                {config.showImage && (item.image_url || item.imageUrl) && (
                  <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                    <Image
                      src={item.image_url || item.imageUrl || ""}
                      alt={config.itemLabel(item)}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {config.itemLabel(item)}
                  </p>
                  {'subtitle' in config && config.subtitle && (
                    <p className="text-xs text-gray-600 truncate">
                      {config.subtitle(item)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!isViewOnly && (
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`${config.editPath}/${item.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show more indicator */}
        {items.length > 4 && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            +{items.length - 4} more items
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Link href={config.editPath} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              {isViewOnly ? "View All" : "Manage All"}
            </Button>
          </Link>
          {!isViewOnly && (
            <Link href={config.addPath} className="flex-1">
              <Button size="sm" className="w-full text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
