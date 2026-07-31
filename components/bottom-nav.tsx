"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Calendar, User, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const { user, isAdmin } = useAuth()

  if (pathname?.startsWith("/admin")) {
    return null
  }

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Ministries", icon: Users, href: "/ministries" },
    { label: "Events", icon: Calendar, href: "/events" },
    { label: "Profile", icon: User, href: "/profile" },
  ]

  if (isAdmin) {
    navItems.push({ label: "Admin", icon: Shield, href: "/admin" })
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-4 pb-safe-area-inset-bottom">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors",
                isActive ? "text-red-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
