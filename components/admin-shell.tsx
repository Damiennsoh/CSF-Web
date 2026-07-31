"use client"

import { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ConnectionStatus } from "@/components/connection-status"
import { HealthMonitor } from "@/components/health-monitor"

interface AdminShellProps {
  children: ReactNode
}

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const showBack = pathname !== "/admin"

  const titles: Record<string, string> = {
    "": "Dashboard",
    gallery: "Gallery",
    alumni: "Alumni Management",
    testimonials: "Testimonials",
    resources: "Resources",
    "profile-management": "Profile Management",
    events: "Events",
    "prayer-requests": "Prayer Requests",
    donations: "Donations",
  }
  const segment = pathname.split("/").pop() || ""
  const headerTitle = titles[segment] || "Admin"

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center gap-2 p-2 sm:p-4 shadow-md bg-primary/10 dark:bg-primary/20">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md hover:bg-primary/20 focus:outline-none"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-primary-foreground" />
          </button>
        )}
        <h1 className="text-lg font-semibold">{headerTitle}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>

      <ConnectionStatus />
      <HealthMonitor />
    </div>
  )
}

