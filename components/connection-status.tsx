"use client"

import { useEffect, useState } from "react"
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    // Check network status
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Check Firestore connection
    const checkFirestoreConnection = async () => {
      setFirestoreStatus('checking')
      setIsConnecting(true)
      
      try {
        await enableNetwork(db)
        setFirestoreStatus('connected')
        console.log("Firestore connection check: SUCCESS")
      } catch (error) {
        setFirestoreStatus('disconnected')
        console.warn("Firestore connection check: FAILED", error)
      } finally {
        setIsConnecting(false)
      }
    }

    // Initial checks
    updateNetworkStatus()
    checkFirestoreConnection()

    // Listen for network changes
    const handleOnline = () => {
      setIsOnline(true)
      checkFirestoreConnection()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setFirestoreStatus('disconnected')
      disableNetwork(db).catch(console.warn)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic connection check
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkFirestoreConnection()
      }
    }, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="flex items-center gap-2 text-sm">
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            <span className="text-yellow-600">Checking connection...</span>
          </>
        ) : firestoreStatus === 'connected' ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Firestore Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Firestore Offline</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="text-xs text-gray-500 mt-1">Network offline</p>
      )}
    </div>
  )
}
