"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("[ForgotPassword] Sending reset email to:", email)
      await sendPasswordResetEmail(auth, email)
      console.log("[ForgotPassword] Reset email sent successfully")
      setSuccess(true)
    } catch (err: any) {
      console.error("[ForgotPassword] Error sending reset email:", err)
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email address.")
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else {
        setError(`Failed to send reset link: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <BackButton showHomeButton={true} />
        </div>

        <Card className="border-0 shadow-xl rounded-[32px] overflow-hidden">
          <div className="h-2 bg-red-600 w-full"></div>
          <CardHeader className="text-center pb-8 pt-10 px-8">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium mt-2">
              No worries! Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            {error && (
              <Alert variant="destructive" className="mb-6 rounded-2xl border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Check Your Email</h3>
                  <p className="text-gray-500 leading-relaxed">
                    We've sent a password reset link to <br />
                    <span className="font-bold text-gray-900">{email}</span>
                  </p>
                </div>
                <Link href="/auth/login" className="block">
                  <Button className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl py-6 font-bold">
                    Return to Login
                  </Button>
                </Link>
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-sm font-bold text-red-600 hover:underline"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-red-600 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-7 text-lg font-black shadow-xl shadow-red-600/20 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Sending Link...
                    </div>
                  ) : "Send Reset Link"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
