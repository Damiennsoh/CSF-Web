"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, Send, Shield } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { isFirebaseReady } from "@/lib/firebase"

export function PrayerRequestsSection() {
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [request, setRequest] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check if Firebase is ready before proceeding
      if (!isFirebaseReady() || !db) {
        throw new Error("Firebase is not initialized. Please refresh the page and try again.")
      }

      await addDoc(collection(db, "prayer_requests"), {
        name: isAnonymous ? "Anonymous" : name,
        email: isAnonymous ? null : email,
        request_text: request,
        is_anonymous: isAnonymous,
        is_urgent: isUrgent,
        status: "active",
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      setName("")
      setEmail("")
      setRequest("")
      setIsAnonymous(false)
      setIsUrgent(false)

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError("Failed to submit prayer request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    // Only render section on client-side to prevent hydration mismatch
    mounted ? (
      <section id="prayer-requests" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Prayer Requests</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Share your prayer needs with our community. We believe in the power of prayer and would be honored to pray
            for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Prayer Request Form */}
          {/* Only render form on client-side to prevent hydration mismatch */}
          {mounted ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Submit a Prayer Request
                </CardTitle>
                <CardDescription>
                  Share your prayer needs with our community. We're here to pray with you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success && (
                  <Alert className="mb-6">
                    <AlertDescription>
                      Your prayer request has been submitted successfully. Our prayer team will be praying for you.
                    </AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

              <form onSubmit={handleSubmit} className="space-y-6" data-lpignore="true" data-form-type="other">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                    data-lpignore="true"
                  />
                  <Label htmlFor="anonymous" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Submit anonymously
                  </Label>
                </div>

                {!isAnonymous && (
                  <>
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isAnonymous}
                        data-lpignore="true"
                        autoComplete="off"
                        data-form-type="other"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-lpignore="true"
                        autoComplete="off"
                        data-form-type="other"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="request">Prayer Request *</Label>
                  <Textarea
                    id="request"
                    placeholder="Please share your prayer request..."
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    rows={5}
                    required
                    data-lpignore="true"
                    autoComplete="off"
                    data-form-type="other"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded"
                    data-lpignore="true"
                  />
                  <Label htmlFor="urgent">This is an urgent prayer request</Label>
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Submitting..." : "Submit Prayer Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prayer Information */}
          <div className="space-y-8">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">How We Pray</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our dedicated prayer team meets regularly to lift up all submitted requests. We believe in the power
                  of collective prayer and the faithfulness of God to answer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Confidentiality</h3>
                <p className="text-gray-600 leading-relaxed">
                  All prayer requests are kept strictly confidential. Only our prayer team leaders have access to the
                  requests, and they are committed to maintaining privacy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Follow-up</h3>
                <p className="text-gray-600 leading-relaxed">
                  If you provide your contact information, we may follow up to see how God has been working in your
                  situation and to offer continued support.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Emergency Prayer</h3>
                <p className="text-blue-100 leading-relaxed mb-4">
                  For urgent prayer needs, you can also contact our prayer hotline or reach out to any of our ministry
                  leaders directly.
                </p>
                <p className="font-medium">Prayer Hotline: +91 98765 43210</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
    ) : (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  )
}
