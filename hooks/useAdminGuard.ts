"use client"

import { useAuth } from "@/contexts/auth-context"

export function useAdminGuard() {
  const { isAdmin, adminStatusConfirmed, adminCheckInProgress, loading } = useAuth()

  // Normalized flags used across admin pages/components
  return {
    isAdmin,
    isAdminChecked: adminStatusConfirmed && !adminCheckInProgress,
    adminCheckInProgress,
    loading,
  }
}

export default useAdminGuard
