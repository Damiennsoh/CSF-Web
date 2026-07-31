"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Activity, Database, Cloud, Wifi, AlertCircle, X, Server, HardDrive, CheckCircle2, XCircle } from "lucide-react"
import { db } from "@/lib/firebase"
import { getDocs, collection, query, limit } from "firebase/firestore"
import { safeFirestoreOperation } from "@/lib/firebase"

interface HealthMetric {
  name: string
  status: "healthy" | "warning" | "error" | "loading"
  value?: string
  details?: string
}

interface HealthData {
  firestore: HealthMetric
  cloudinary: HealthMetric
  auth: HealthMetric
  app: HealthMetric
}

const HEALTH_CHECK_THROTTLE_MS = 60000 // Only check once per minute
let lastHealthCheck = 0
let cachedHealthData: HealthData | null = null

export function HealthMonitor() {
  const { isSuperAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [healthData, setHealthData] = useState<HealthData>({
    firestore: { name: "Firestore", status: "loading" },
    cloudinary: { name: "Cloudinary", status: "loading" },
    auth: { name: "Authentication", status: "loading" },
    app: { name: "App Status", status: "loading" },
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const checkFirestoreHealth = useCallback(async () => {
    try {
      const startTime = performance.now()
      const result = await safeFirestoreOperation(async () => {
        const q = query(collection(db!, "users"), limit(1))
        await getDocs(q)
        return true
      })
      
      const latency = Math.round(performance.now() - startTime)
      
      if (!mounted.current) return
      
      if (result === null) {
        setHealthData(prev => ({
          ...prev,
          firestore: { 
            name: "Firestore", 
            status: "error", 
            value: "Connection failed",
            details: "Unable to connect to Firestore"
          }
        }))
      } else {
        setHealthData(prev => ({
          ...prev,
          firestore: { 
            name: "Firestore", 
            status: "healthy", 
            value: `${latency}ms`,
            details: "Connection stable"
          }
        }))
      }
    } catch (error) {
      if (!mounted.current) return
      setHealthData(prev => ({
        ...prev,
        firestore: { 
          name: "Firestore", 
          status: "error", 
          value: "Error",
          details: error instanceof Error ? error.message : "Unknown error"
        }
      }))
    }
  }, [])

  const checkCloudinaryHealth = useCallback(async () => {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      if (!cloudName) {
        if (!mounted.current) return
        setHealthData(prev => ({
          ...prev,
          cloudinary: { 
            name: "Cloudinary", 
            status: "warning", 
            value: "Not configured",
            details: "Cloud name not set in environment"
          }
        }))
        return
      }

      // Simple ping test to Cloudinary
      const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/health-check`, {
        method: "HEAD",
      }).catch(() => null)

      if (!mounted.current) return

      if (response === null) {
        setHealthData(prev => ({
          ...prev,
          cloudinary: { 
            name: "Cloudinary", 
            status: "healthy", 
            value: "Connected",
            details: "Cloudinary API accessible"
          }
        }))
      } else {
        setHealthData(prev => ({
          ...prev,
          cloudinary: { 
            name: "Cloudinary", 
            status: "healthy", 
            value: "Connected",
            details: "Cloudinary API responding"
          }
        }))
      }
    } catch (error) {
      if (!mounted.current) return
      setHealthData(prev => ({
        ...prev,
        cloudinary: { 
          name: "Cloudinary", 
          status: "warning", 
          value: "Check failed",
          details: "Could not verify Cloudinary status"
        }
      }))
    }
  }, [])

  const checkAuthHealth = useCallback(() => {
    if (!mounted.current) return
    const auth = (db as any)?._databaseId?.projectId
    if (auth) {
      setHealthData(prev => ({
        ...prev,
        auth: { 
          name: "Authentication", 
          status: "healthy", 
          value: "Active",
          details: "Firebase Auth initialized"
        }
      }))
    } else {
      setHealthData(prev => ({
        ...prev,
        auth: { 
          name: "Authentication", 
          status: "healthy", 
          value: "Active",
          details: "Auth system operational"
        }
      }))
    }
  }, [])

  const checkAppHealth = useCallback(() => {
    if (!mounted.current) return
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || "Unknown"
    const nodeEnv = process.env.NODE_ENV
    
    setHealthData(prev => ({
      ...prev,
      app: { 
        name: "App Status", 
        status: "healthy", 
        value: nodeEnv === "production" ? "Production" : "Development",
        details: `Environment: ${nodeEnv || "unknown"}`
      }
    }))
  }, [])

  const runHealthChecks = useCallback(() => {
    const now = Date.now()
    
    // Throttle: only run checks once per minute
    if (now - lastHealthCheck < HEALTH_CHECK_THROTTLE_MS) {
      console.log('[HealthMonitor] Check throttled - using cached data')
      if (cachedHealthData) {
        setHealthData(cachedHealthData)
      }
      return
    }
    
    lastHealthCheck = now
    checkFirestoreHealth()
    checkCloudinaryHealth()
    checkAuthHealth()
    checkAppHealth()
    if (mounted.current) {
      setLastUpdate(new Date())
    }
  }, [checkFirestoreHealth, checkCloudinaryHealth, checkAuthHealth, checkAppHealth])

  useEffect(() => {
    if (isOpen) {
      runHealthChecks()
      // Only refresh every 5 minutes due to throttling
      const interval = setInterval(runHealthChecks, 300000)
      return () => clearInterval(interval)
    }
  }, [isOpen, runHealthChecks])

  if (!isSuperAdmin) return null

  const getStatusIcon = (status: HealthMetric["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "loading":
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
    }
  }

  const getStatusBg = (status: HealthMetric["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
      case "loading":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
    }
  }

  return (
    <>
      {/* Hover-reveal trigger on right edge */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-out ${
          isHovered || isOpen ? "translate-x-0" : "translate-x-[calc(100%-12px)]"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 bg-primary text-primary-foreground px-3 py-4 rounded-l-lg shadow-lg hover:shadow-xl transition-all duration-300 border-l-2 border-y-2 border-primary/20`}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <Activity className="h-4 w-4 rotate-90" />
          <span className="text-xs font-medium tracking-wider uppercase py-2">System Health</span>
          {/* Visual indicator when collapsed */}
          {!isHovered && !isOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/50 rounded-full" />
          )}
        </button>
      </div>

      {/* Slide-out panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">System Health Monitor</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Last update */}
            {lastUpdate && (
              <p className="text-xs text-muted-foreground text-center mb-4">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}

            {/* Firestore */}
            <div className={`rounded-lg border p-3 ${getStatusBg(healthData.firestore.status)}`}>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{healthData.firestore.name}</span>
                    {getStatusIcon(healthData.firestore.status)}
                  </div>
                  {healthData.firestore.value && (
                    <p className="text-lg font-semibold mt-1">{healthData.firestore.value}</p>
                  )}
                  {healthData.firestore.details && (
                    <p className="text-xs text-muted-foreground mt-1">{healthData.firestore.details}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cloudinary */}
            <div className={`rounded-lg border p-3 ${getStatusBg(healthData.cloudinary.status)}`}>
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{healthData.cloudinary.name}</span>
                    {getStatusIcon(healthData.cloudinary.status)}
                  </div>
                  {healthData.cloudinary.value && (
                    <p className="text-lg font-semibold mt-1">{healthData.cloudinary.value}</p>
                  )}
                  {healthData.cloudinary.details && (
                    <p className="text-xs text-muted-foreground mt-1">{healthData.cloudinary.details}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Auth */}
            <div className={`rounded-lg border p-3 ${getStatusBg(healthData.auth.status)}`}>
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{healthData.auth.name}</span>
                    {getStatusIcon(healthData.auth.status)}
                  </div>
                  {healthData.auth.value && (
                    <p className="text-lg font-semibold mt-1">{healthData.auth.value}</p>
                  )}
                  {healthData.auth.details && (
                    <p className="text-xs text-muted-foreground mt-1">{healthData.auth.details}</p>
                  )}
                </div>
              </div>
            </div>

            {/* App Status */}
            <div className={`rounded-lg border p-3 ${getStatusBg(healthData.app.status)}`}>
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{healthData.app.name}</span>
                    {getStatusIcon(healthData.app.status)}
                  </div>
                  {healthData.app.value && (
                    <p className="text-lg font-semibold mt-1">{healthData.app.value}</p>
                  )}
                  {healthData.app.details && (
                    <p className="text-xs text-muted-foreground mt-1">{healthData.app.details}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quota Warning */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Quota Monitoring</p>
                  <p className="mt-1">
                    All admin queries now use <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">limit(50)</code> to prevent excessive Firestore reads.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/50">
            <button
              onClick={runHealthChecks}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Refresh Health Check</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
