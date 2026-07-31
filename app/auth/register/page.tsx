"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, Eye, EyeOff, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore"
import { BackButton } from "@/components/back-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [adminCount, setAdminCount] = useState(0)
  const [role, setRole] = useState<"user" | "admin">("user")
  const [adminSecret, setAdminSecret] = useState("")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchAdminCount()
  }, [])

  const fetchAdminCount = async () => {
    try {
      const q = query(collection(db, "users"), where("isAdmin", "==", true))
      const querySnapshot = await getDocs(q)
      console.log("[Register] Current admin count in database:", querySnapshot.size)
      setAdminCount(querySnapshot.size)
    } catch (err) {
      console.error("[Register] Error checking admin count:", err)
      setAdminCount(2) // Fallback to safe limit
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    console.log("[Register] Starting registration process for:", email, "with role:", role)

    if (password !== confirmPassword) {
      console.warn("[Register] Password mismatch")
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Security check for admin role
    const finalIsAdmin = role === "admin" && adminCount < 2
    if (role === "admin") {
      console.log("[Register] Verifying admin credentials. Current admin count:", adminCount)
      if (adminCount >= 2) {
        console.warn("[Register] Admin limit reached. Registration denied.")
        setError("Maximum number of administrators reached.")
        setLoading(false)
        return
      }
      if (adminSecret !== "CSF-ADMIN-2026") { // Example secret code
        console.warn("[Register] Invalid secret code provided for admin role")
        setError("Invalid Admin Secret Code.")
        setLoading(false)
        return
      }
      console.log("[Register] Admin secret verified successfully")
    }

    try {
      // Create user in Firebase Auth
      console.log("[Register] Creating Firebase Auth account...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("[Register] Firebase Auth account created:", user.uid)

      // Update display name
      await updateProfile(user, { displayName: fullName })
      console.log("[Register] Profile display name updated to:", fullName)

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email: email,
        fullName: fullName,
        isAdmin: finalIsAdmin,
        role: role,
        createdAt: new Date().toISOString(),
      }

      console.log("[Register] Creating Firestore user document...", userData)
      await setDoc(doc(db, "users", user.uid), userData)
      console.log("[Register] Firestore document created successfully")

      setSuccess(finalIsAdmin 
        ? "🎉 Congratulations! You have been registered as an Administrator."
        : "Registration successful! Welcome to the CSF community.")

      // Redirect to login after a short delay
      console.log("[Register] Redirecting to login page in 2s...")
      setTimeout(() => router.push('/auth/login'), 2000)

    } catch (err: any) {
      console.error("[Register] Detailed error information:", {
        code: err.code,
        message: err.message,
        email: email
      })
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.")
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak.")
      } else {
        setError(`Registration failed: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <BackButton />
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {role === "admin" ? <Crown className="h-8 w-8 text-yellow-300" /> : <Heart className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold">{role === "admin" ? "Register as Admin" : "Join CSF"}</CardTitle>
            <CardDescription>
              {role === "admin"
                ? "Gain administrative access to manage CSF content"
                : "Create your account to get connected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleRegister} 
              className="space-y-4"
              suppressHydrationWarning
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className={role === "admin" ? "border-yellow-500 bg-yellow-50" : "border-green-500 bg-green-50"}>
                  <AlertDescription className={role === "admin" ? "text-yellow-800" : "text-green-800"}>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Account Role</Label>
                <Select 
                  value={role} 
                  onValueChange={(val: "user" | "admin") => setRole(val)}
                  disabled={loading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Student / Regular User</SelectItem>
                    {adminCount < 2 && (
                      <SelectItem value="admin">Executive Leader (Admin)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {adminCount >= 2 && (
                  <p className="text-[10px] text-muted-foreground italic">
                    * Admin registration is closed (limit reached).
                  </p>
                )}
              </div>

              {role === "admin" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="adminSecret">Admin Secret Code</Label>
                  <Input
                    id="adminSecret"
                    type="password"
                    placeholder="Enter the code provided by the fellowship"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required={role === "admin"}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : role === "admin" ? "Create Admin Account" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
