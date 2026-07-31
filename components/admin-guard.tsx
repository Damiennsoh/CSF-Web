"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { FullPageLoader } from "@/components/full-page-loader"

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAdmin, adminStatusConfirmed, adminCheckInProgress, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      console.log("AdminGuard: No user found, redirecting to login")
      router.push("/auth/login")
      return
    }

    // If admin status is confirmed and user is not admin, redirect to home
    if (adminStatusConfirmed && user && !isAdmin) {
      console.log("AdminGuard: User is not admin, redirecting to home")
      router.push("/")
      return
    }
  }, [user, isAdmin, adminStatusConfirmed, loading, router])

  // Show loading while auth is being checked
  if (loading || adminCheckInProgress || !adminStatusConfirmed) {
    console.log("AdminGuard: Showing loader", { loading, adminCheckInProgress, adminStatusConfirmed })
    return <FullPageLoader />
  }

  // If no user, don't render anything (will redirect)
  if (!user) {
    return null
  }

  // If user is not admin, don't render anything (will redirect)
  if (!isAdmin) {
    return null
  }

  // User is admin and status is confirmed, render children
  console.log("AdminGuard: Rendering admin content")
  return <>{children}</>
} 