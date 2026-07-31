import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import ScheduleManager from "@/components/schedule-manager"
import { ScheduleFloatingButton } from "@/components/schedule-floating-button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Christian Students Fellowship - MMU",
  description: "A community of faith and fellowship at Maharishi Markandeshwar University",
  generator: 'v0.dev',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CSF MMU",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="font-sans antialiased bg-gray-50 min-h-screen pb-16 lg:pb-0" suppressHydrationWarning>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-grow">
              {children}
            </main>
            <BottomNav />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
