"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, UserX, Crown, Mail, Calendar, Activity, Server, Database, Wifi, AlertTriangle, CheckCircle, MoreVertical } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { AdminBackButton } from "@/components/admin-back-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserAccount {
  id: string
  email: string
  displayName?: string
  isAdmin: boolean
  isSuperAdmin?: boolean
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
}

interface HealthStatus {
  database: 'healthy' | 'warning' | 'error'
  server: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  uptime: number
  lastCheck: string
}

export default function ProfileManagementPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [showHealthMonitoring, setShowHealthMonitoring] = useState(false)

  useEffect(() => {
    if (!isAdmin) return

    let isMounted = true

    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db!, "users"),
          orderBy("createdAt", "desc"),
          limit(50)
        )
        const querySnapshot = await getDocs(usersQuery)
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserAccount[]
        
        if (isMounted) {
          setUsers(usersData)
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching users:", error)
          toast({
            title: "Error",
            description: "Failed to load users",
            variant: "destructive"
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUsers()

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  useEffect(() => {
    if (isSuperAdmin) {
      let isMounted = true
      
      const checkSystemHealth = async () => {
        try {
          // Simulate health check - replace with actual health check logic
          const mockHealth: HealthStatus = {
            database: 'healthy',
            server: 'healthy', 
            storage: 'warning',
            uptime: 99.9,
            lastCheck: new Date().toISOString()
          }
          if (isMounted) {
            setHealthStatus(mockHealth)
          }
        } catch (error) {
          if (isMounted) {
            console.error("Health check failed:", error)
          }
        }
      }

      checkSystemHealth()
      const interval = setInterval(checkSystemHealth, 30000) // Check every 30 seconds
      
      return () => {
        clearInterval(interval)
        isMounted = false
      }
    }
  }, [isSuperAdmin])

  const toggleAdminRights = async (userId: string, currentAdminStatus: boolean) => {
    let isMounted = true
    
    const targetUser = users.find(u => u.id === userId)
    if (targetUser?.isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Super admin rights cannot be modified",
        variant: "destructive"
      })
      return
    }
    
    if (!isSuperAdmin && targetUser?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can modify other admin rights",
        variant: "destructive"
      })
      return
    }
    
    setUpdatingUserId(userId)
    try {
      const userRef = doc(db!, "users", userId)
      await updateDoc(userRef, {
        isAdmin: !currentAdminStatus,
        updatedAt: new Date().toISOString()
      })

      if (isMounted) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isAdmin: !currentAdminStatus }
              : user
          )
        )

        toast({
          title: "Success",
          description: `Admin rights ${!currentAdminStatus ? 'granted' : 'revoked'} successfully`
        })
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error toggling admin rights:", error)
        toast({
          title: "Error",
          description: "Failed to update admin rights",
          variant: "destructive"
        })
      }
    } finally {
      if (isMounted) {
        setUpdatingUserId(null)
      }
    }
  }

  const toggleSuperAdminRights = async (userId: string, currentSuperAdminStatus: boolean) => {
    let isMounted = true
    
    const targetUser = users.find(u => u.id === userId)
    
    // Prevent self-modification
    if (targetUser?.id === user?.uid) {
      toast({
        title: "Access Denied",
        description: "You cannot modify your own super admin status",
        variant: "destructive"
      })
      return
    }
    
    // Only super admins can modify super admin rights
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can modify super admin rights",
        variant: "destructive"
      })
      return
    }
    
    setUpdatingUserId(userId)
    try {
      const userRef = doc(db!, "users", userId)
      await updateDoc(userRef, {
        isSuperAdmin: !currentSuperAdminStatus,
        isAdmin: !currentSuperAdminStatus ? true : targetUser?.isAdmin, // Make admin if becoming super admin
        updatedAt: new Date().toISOString()
      })

      if (isMounted) {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { 
                  ...user, 
                  isSuperAdmin: !currentSuperAdminStatus,
                  isAdmin: !currentSuperAdminStatus ? true : user.isAdmin
                }
              : user
          )
        )

        toast({
          title: "Success",
          description: `Super admin rights ${!currentSuperAdminStatus ? 'granted' : 'revoked'} successfully`
        })
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error toggling super admin rights:", error)
        toast({
          title: "Error",
          description: "Failed to update super admin rights",
          variant: "destructive"
        })
      }
    } finally {
      if (isMounted) {
        setUpdatingUserId(null)
      }
    }
  }

  const removeUser = async (userId: string) => {
    let isMounted = true
    
    const targetUser = users.find(u => u.id === userId)
    if (targetUser?.isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Super admin accounts cannot be deleted",
        variant: "destructive"
      })
      return
    }
    
    if (!isSuperAdmin && targetUser?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can delete admin accounts",
        variant: "destructive"
      })
      return
    }
    
    try {
      await deleteDoc(doc(db!, "users", userId))
      
      if (isMounted) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))

        toast({
          title: "Success",
          description: "User removed successfully"
        })
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error removing user:", error)
        toast({
          title: "Error",
          description: "Failed to remove user",
          variant: "destructive"
        })
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getHealthIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
            <AdminBackButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AdminBackButton />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Users</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Manage user accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {users.length} users
              </Badge>
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHealthMonitoring(!showHealthMonitoring)}
                  className="hidden sm:flex"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Health
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health Monitoring - Super Admin Only */}
      {isSuperAdmin && showHealthMonitoring && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Health
              </CardTitle>
              <CardDescription>
                Real-time system monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Database className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database</p>
                    <div className="flex items-center gap-1">
                      {healthStatus && getHealthIcon(healthStatus.database)}
                      <span className="text-xs text-gray-600 capitalize">
                        {healthStatus?.database || 'Checking...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Server className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Server</p>
                    <div className="flex items-center gap-1">
                      {healthStatus && getHealthIcon(healthStatus.server)}
                      <span className="text-xs text-gray-600 capitalize">
                        {healthStatus?.server || 'Checking...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Wifi className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Storage</p>
                    <div className="flex items-center gap-1">
                      {healthStatus && getHealthIcon(healthStatus.storage)}
                      <span className="text-xs text-gray-600 capitalize">
                        {healthStatus?.storage || 'Checking...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-xs text-gray-600">
                      {healthStatus?.uptime || '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Health Button */}
      {isSuperAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHealthMonitoring(!showHealthMonitoring)}
            className="w-full"
          >
            <Activity className="w-4 h-4 mr-2" />
            {showHealthMonitoring ? 'Hide' : 'Show'} Health Monitoring
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">No user accounts have been created yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.displayName || 'Unknown User'}
                          </h3>
                          {user.isSuperAdmin && (
                            <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-2 py-0.5">
                              <Crown className="w-3 h-3 mr-1" />
                              Super Admin
                            </Badge>
                          )}
                          {!user.isSuperAdmin && user.isAdmin && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs">Joined {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSuperAdmin && !user.isSuperAdmin && (
                        <Button
                          variant={user.isSuperAdmin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleSuperAdminRights(user.id, user.isSuperAdmin || false)}
                          disabled={updatingUserId === user.id || user.id === user?.uid}
                          className="text-xs px-3 py-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white"
                          title={user.id === user?.uid ? "You cannot modify your own super admin status" : ""}
                        >
                          {updatingUserId === user.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              {user.isSuperAdmin ? 'Revoke SA' : 'Make SA'}
                            </>
                          )}
                        </Button>
                      )}
                      
                      {isSuperAdmin && (
                        <Button
                          variant={user.isAdmin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdminRights(user.id, user.isAdmin)}
                          disabled={updatingUserId === user.id || !!user.isSuperAdmin}
                          className="text-xs px-3 py-1.5 h-8"
                          title={user.isSuperAdmin ? "Super admin rights cannot be modified" : ""}
                        >
                          {updatingUserId === user.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                            </>
                          )}
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isSuperAdmin && (
                            <DropdownMenuItem
                              onClick={() => toggleSuperAdminRights(user.id, user.isSuperAdmin || false)}
                              disabled={updatingUserId === user.id || user.id === user?.uid}
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              {user.isSuperAdmin ? 'Revoke Super Admin' : 'Make Super Admin'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => toggleAdminRights(user.id, user.isAdmin)}
                            disabled={updatingUserId === user.id || !!user.isSuperAdmin || !isSuperAdmin}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-600"
                                disabled={!!user.isSuperAdmin || !isSuperAdmin}
                                onSelect={(e) => e.preventDefault()}
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remove User</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to remove {user.displayName || user.email}? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => removeUser(user.id)}
                                >
                                  Remove User
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
