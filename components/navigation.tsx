"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Shield, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ClientOnly } from "@/components/client-only"
import { UserNavigation } from "@/components/user-navigation"
import { db, isFirebaseReady } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Ministry {
  id: string
  name: string
  slug?: string
  is_active?: boolean
  display_order?: number
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [ministriesLoaded, setMinistriesLoaded] = useState(false)
  const { user, isAdmin, loading, adminStatusConfirmed, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    if (user) {
      console.log("[Navigation] Current auth state:", { user: user.email, isAdmin, loading, adminStatusConfirmed })
    }
  }, [user, isAdmin, loading, adminStatusConfirmed])

  useEffect(() => {
    let isSubscribed = true;

    async function loadMinistries() {
      if (!mounted || !isFirebaseReady() || ministriesLoaded) return;

      try {
        console.log("[Navigation] Loading ministries for navigation...")
        const data = await getCachedData(
          CACHE_KEYS.NAVIGATION_MINISTRIES,
          async () => {
            const q = query(
              collection(db!, "ministries"),
              where("is_active", "==", true),
              orderBy("display_order", "asc")
            )
            const snap = await getDocs(q)
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ministry[]
          },
          CACHE_TTL.NAVIGATION
        )
        if (isSubscribed) {
          setMinistries(data || [])
          setMinistriesLoaded(true)
          console.log("[Navigation] Ministries loaded successfully:", data.length)
        }
      } catch (e) {
        console.error("Error loading ministries for nav:", e)
        if (isSubscribed) setMinistriesLoaded(true)
      }
    }

    loadMinistries()
    return () => { isSubscribed = false }
  }, [mounted, ministriesLoaded])

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleAdminDashboardClick = () => {
    if (isAdmin) {
      router.push("/admin")
    }
  }

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/csf-logo.png" alt="CSF Logo" width={40} height={40} className="rounded-full" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">Christian Students Fellowship</span>
              <span className="text-xl font-bold text-gray-900 sm:hidden">CSF MMU</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Home
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="px-2 py-1 flex items-center text-gray-700 hover:text-red-600 transition-colors font-medium outline-none">
                Ministries
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/ministries">All Ministries</Link>
                </DropdownMenuItem>
                {ministries.length > 0 && <DropdownMenuSeparator />}
                {ministries.map((ministry) => {
                  const normalizeSlug = (name: string): string => {
                    return name
                      .toLowerCase()
                      .replace(/\s+/g, '-')           // spaces to hyphens
                      .replace(/&/g, '')              // remove ampersands
                      .replace(/[^a-z0-9-]/g, '')     // remove special chars
                      .replace(/-+/g, '-')             // collapse multiple hyphens
                      .replace(/^-|-$/g, '')           // trim hyphens
                  }
                  const slug = ministry.slug ? normalizeSlug(ministry.slug) : normalizeSlug(ministry.name)
                  return (
                    <DropdownMenuItem key={ministry.id} asChild>
                      <Link href={`/ministries/${slug}`}>{ministry.name}</Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/events" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Events
            </Link>

            <Link href="/spiritual-resources" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Resources
            </Link>

            <Link href="/gallery" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Gallery
            </Link>

            <Link href="/alumni" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Alumni
            </Link>

            <Link href="/executives" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Executives
            </Link>

            <Link href="/about" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              About
            </Link>

            <Link href="/contact" className="px-2 py-1 text-gray-700 hover:text-red-600 transition-colors font-medium">
              Contact
            </Link>

            {isAdmin && (
              <Link href="/admin" className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors font-bold flex items-center">
                <Shield className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <ClientOnly fallback={<div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>}>
              <UserNavigation />
            </ClientOnly>
            
            {/* Mobile Menu Toggle - Only visible on small screens */}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleMenu}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Simplified, relies on BottomNav mostly */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 py-4 px-4 bg-white animate-in slide-in-from-top duration-300 max-h-96 overflow-y-auto">
          <div className="flex flex-col space-y-4">
            <Link href="/" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Home
            </Link>
            <div>
              <Link href="/ministries" className="text-gray-700 hover:text-red-600 font-medium block mb-2" onClick={toggleMenu}>
                Ministries
              </Link>
              {ministries.length > 0 && (
                <div className="pl-4 space-y-2 border-l-2 border-gray-200">
                  {ministries.map((ministry) => {
                    const slug = ministry.slug || ministry.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                    return (
                      <Link
                        key={ministry.id}
                        href={`/ministries/${slug}`}
                        className="text-sm text-gray-600 hover:text-red-600 block"
                        onClick={toggleMenu}
                      >
                        {ministry.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
            <Link href="/events" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Events
            </Link>
            <Link href="/spiritual-resources" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Resources
            </Link>
            <Link href="/gallery" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Gallery
            </Link>
            <Link href="/alumni" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Alumni
            </Link>
            <Link href="/executives" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Executives
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-red-600 font-medium" onClick={toggleMenu}>
              Contact
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-red-600 hover:text-red-700 font-bold flex items-center" onClick={toggleMenu}>
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
            
            {/* Mobile Logout Button - Only shown when user is authenticated */}
            {user && (
              <button 
                onClick={async () => {
                  toggleMenu()
                  await signOut()
                }}
                className="text-gray-700 hover:text-red-600 font-medium flex items-center w-full text-left"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
