"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock, Heart, X } from "lucide-react"
import Link from "next/link"
import { db, isFirebaseReady } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneValue, setPhoneValue] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [wantsNewsletter, setWantsNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prayer request modal state
  const [showPrayerModal, setShowPrayerModal] = useState(false)
  const [prayerName, setPrayerName] = useState("")
  const [prayerEmail, setPrayerEmail] = useState("")
  const [prayerRequest, setPrayerRequest] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [prayerSubmitting, setPrayerSubmitting] = useState(false)
  const [prayerSuccess, setPrayerSuccess] = useState(false)
  const [prayerError, setPrayerError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Check if Firebase is ready before proceeding
      if (!isFirebaseReady() || !db) {
        throw new Error("Firebase is not initialized. Please refresh the page and try again.")
      }

      await addDoc(collection(db, "contact_messages"), {
        firstName,
        lastName,
        email,
        phone: phoneValue,
        subject,
        message,
        wantsNewsletter,
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      })
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhoneValue("")
      setSubject("")
      setMessage("")
      setWantsNewsletter(false)

      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error("Error submitting contact message:", err)
      setError("Failed to send your message. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPrayerSubmitting(true)
    setPrayerError("")

    try {
      // Check if Firebase is ready before proceeding
      if (!isFirebaseReady() || !db) {
        throw new Error("Firebase is not initialized. Please refresh the page and try again.")
      }

      await addDoc(collection(db, "prayer_requests"), {
        name: isAnonymous ? "Anonymous" : prayerName,
        email: isAnonymous ? null : prayerEmail,
        request_text: prayerRequest,
        is_anonymous: isAnonymous,
        is_urgent: isUrgent,
        status: "active",
        createdAt: serverTimestamp(),
      })

      setPrayerSuccess(true)
      setPrayerName("")
      setPrayerEmail("")
      setPrayerRequest("")
      setIsAnonymous(false)
      setIsUrgent(false)

      setTimeout(() => {
        setPrayerSuccess(false)
        setShowPrayerModal(false)
      }, 3000)
    } catch (err) {
      setPrayerError("Failed to submit prayer request. Please try again.")
    } finally {
      setPrayerSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Christian Students Fellowship</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link href="/events" className="text-gray-700 hover:text-blue-600 font-medium">
                Events
              </Link>
              <Link href="/ministries" className="text-gray-700 hover:text-blue-600 font-medium">
                Ministries
              </Link>
              <Link href="/gallery" className="text-gray-700 hover:text-blue-600 font-medium">
                Gallery
              </Link>
              <Link href="/alumni" className="text-gray-700 hover:text-blue-600 font-medium">
                Alumni
              </Link>
              <Link href="/contact" className="text-blue-600 font-medium">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Get In Touch</h1>
          <p className="text-xl text-blue-100">
            We'd love to hear from you! Reach out with questions, prayer requests, or just to say hello.
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>

              <div className="space-y-6">
                <Card className="border-l-4 border-l-blue-600">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Location</h3>
                        <p className="text-gray-600">
                          Christian Students Fellowship
                          <br />
                          Maharishi Markandeshwar University
                          <br />
                          Mullana, Ambala, Haryana 133207
                          <br />
                          India
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Phone & WhatsApp</h3>
                        <p className="text-gray-600">
                          Office: +91 1731-274140
                          <br />
                          WhatsApp: +91 98765 43210
                          <br />
                          Emergency: +91 87654 32109
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-purple-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Email</h3>
                        <p className="text-gray-600">
                          General: csf@mmumullana.org
                          <br />
                          Events: events@csfmmu.org
                          <br />
                          Prayer Requests: prayer@csfmmu.org
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-600">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Clock className="h-6 w-6 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Office Hours</h3>
                        <p className="text-gray-600">
                          Monday - Friday: 10:00 AM - 6:00 PM
                          <br />
                          Saturday: 10:00 AM - 2:00 PM
                          <br />
                          Sunday: After Fellowship Lunch
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Send Us a Message</h2>

              <Card className="shadow-lg">
                <CardContent className="p-8">
                  {success && (
                    <Alert className="mb-6">
                      <AlertDescription>
                        Thank you for reaching out. Your message has been received and our team will respond soon.
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <Input
                          id="firstName"
                          placeholder="Your first name"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <Input
                          id="lastName"
                          placeholder="Your last name"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        placeholder="What is this regarding?"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help you or what you'd like to know..."
                        rows={6}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="newsletter"
                        className="rounded"
                        checked={wantsNewsletter}
                        onChange={(e) => setWantsNewsletter(e.target.checked)}
                      />
                      <label htmlFor="newsletter" className="text-sm text-gray-600">
                        I'd like to receive updates about CSF events and activities
                      </label>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Join Our WhatsApp</h3>
                <p className="text-gray-600 mb-4">Get instant updates about events and fellowship activities</p>
                <Link href="https://chat.whatsapp.com/IrzWD6865Tk3ylHGL686Qs?mode=gi_t" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700">Join WhatsApp Group</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Prayer Request</h3>
                <p className="text-gray-600 mb-4">Submit a prayer request and let our community pray for you</p>
                <Button variant="outline" onClick={() => setShowPrayerModal(true)}>Submit Prayer Request</Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Visit Us</h3>
                <p className="text-gray-600 mb-4">Come to any of our events - no appointment necessary!</p>
                <Link href="/events">
                  <Button variant="outline">View Event Schedule</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Prayer Request Modal */}
      {showPrayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Submit Prayer Request</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrayerModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {prayerSuccess && (
                <Alert className="mb-6">
                  <AlertDescription>
                    Your prayer request has been submitted successfully. Our prayer team will be praying for you.
                  </AlertDescription>
                </Alert>
              )}
              {prayerError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{prayerError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePrayerSubmit} className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="anonymous" className="text-sm text-gray-600">
                    Submit anonymously
                  </label>
                </div>

                {!isAnonymous && (
                  <>
                    <div>
                      <label htmlFor="prayerName" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <Input
                        id="prayerName"
                        placeholder="Enter your name"
                        value={prayerName}
                        onChange={(e) => setPrayerName(e.target.value)}
                        required={!isAnonymous}
                      />
                    </div>

                    <div>
                      <label htmlFor="prayerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        id="prayerEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={prayerEmail}
                        onChange={(e) => setPrayerEmail(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="prayerRequest" className="block text-sm font-medium text-gray-700 mb-2">
                    Prayer Request *
                  </label>
                  <Textarea
                    id="prayerRequest"
                    placeholder="Please share your prayer request..."
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="urgent" className="text-sm text-gray-600">
                    This is an urgent prayer request
                  </label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPrayerModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={prayerSubmitting}
                  >
                    {prayerSubmitting ? "Submitting..." : "Submit Prayer Request"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
