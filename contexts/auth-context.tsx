"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  adminStatusConfirmed: boolean
  adminCheckInProgress: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  adminStatusConfirmed: false,
  adminCheckInProgress: false,
  signOut: async () => {},
  refreshAuth: async () => {},
})

interface CachedAdminStatus {
  userId: string
  isAdmin: boolean
  isSuperAdmin: boolean
  timestamp: number
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminStatusConfirmed, setAdminStatusConfirmed] = useState(false)
  const [adminCheckInProgress, setAdminCheckInProgress] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const getCachedAdminStatus = (): CachedAdminStatus | null => {
    if (!mounted) return null
    try {
      const cached = localStorage.getItem("adminStatus")
      if (!cached) return null
      
      const parsed: CachedAdminStatus = JSON.parse(cached)
      const now = Date.now()
      
      if (now - parsed.timestamp < CACHE_DURATION) {
        return parsed
      }
      
      localStorage.removeItem("adminStatus")
      return null
    } catch (error) {
      console.error("Error reading cached admin status:", error)
      return null
    }
  }

  const setCachedAdminStatus = (userId: string, adminStatus: boolean, superAdminStatus: boolean = false) => {
    if (!mounted) return
    try {
      const cached: CachedAdminStatus = {
        userId,
        isAdmin: adminStatus,
        isSuperAdmin: superAdminStatus,
        timestamp: Date.now()
      }
      localStorage.setItem("adminStatus", JSON.stringify(cached))
    } catch (error) {
      console.error("Error setting cached admin status:", error)
    }
  }

  const authCheckInitiated = useRef(false)

  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    if (authCheckInitiated.current) {
      console.log("[AuthContext] Admin check already in progress, skipping...")
      return isAdmin
    }
    
    try {
      authCheckInitiated.current = true
      console.log("[AuthContext] Checking admin status for UID:", userId)
      setAdminCheckInProgress(true)
      const userDoc = await getDoc(doc(db!, "users", userId))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        const adminStatus = Boolean(data.isAdmin)
        const superAdminStatus = Boolean(data.isSuperAdmin)
        console.log("[AuthContext] Firestore record found. isAdmin:", adminStatus, "isSuperAdmin:", superAdminStatus)
        setIsAdmin(adminStatus)
        setIsSuperAdmin(superAdminStatus)
        setAdminStatusConfirmed(true)
        setCachedAdminStatus(userId, adminStatus, superAdminStatus)
        return adminStatus
      } else {
        console.log("[AuthContext] No Firestore record found for UID:", userId)
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setAdminStatusConfirmed(false)
        return false
      }
    } catch (error) {
      console.error("[AuthContext] Error checking admin status:", error)
      setIsAdmin(false)
      setIsSuperAdmin(false)
      setAdminStatusConfirmed(true)
      return false
    } finally {
      setAdminCheckInProgress(false)
      authCheckInitiated.current = false
    }
  }, []) // ❌ REMOVED isAdmin dependency to prevent infinite loop

  useEffect(() => {
    if (!mounted) return

    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      console.log("[AuthContext] Auth state changed. User logged in:", !!firebaseUser)
      if (firebaseUser) {
        // Only update user if it's different
        setUser(prev => {
          if (prev?.uid === firebaseUser.uid) {
            console.log("[AuthContext] Same user, skipping user state update")
            return prev
          }
          return firebaseUser
        })
        
        const cached = getCachedAdminStatus()
        if (cached && cached.userId === firebaseUser.uid) {
          console.log("[AuthContext] Using cached admin status:", cached.isAdmin, "superAdmin:", cached.isSuperAdmin)
          setIsAdmin(cached.isAdmin)
          setIsSuperAdmin(cached.isSuperAdmin)
          setAdminStatusConfirmed(true)
          setLoading(false)
        } else {
          await checkAdminStatus(firebaseUser.uid)
          setLoading(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        setIsSuperAdmin(false)
        setAdminStatusConfirmed(true)
        setCachedAdminStatus("", false, false)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [mounted, checkAdminStatus])

  const signOut = async () => {
    try {
      setLoading(true)
      await firebaseSignOut(auth!)
      setUser(null)
      setIsAdmin(false)
      setIsSuperAdmin(false)
      setAdminStatusConfirmed(true)
      if (mounted) localStorage.removeItem("adminStatus")
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAuth = async () => {
    if (auth!.currentUser) {
      console.log("[AuthContext] Manually refreshing auth status...")
      // Clear cache first to force a fresh fetch
      if (mounted) localStorage.removeItem("adminStatus")
      await checkAdminStatus(auth!.currentUser.uid)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        loading,
        adminStatusConfirmed,
        adminCheckInProgress,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
