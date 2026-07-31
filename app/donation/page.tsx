"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Heart, CreditCard, Smartphone, Building, CheckCircle, ArrowLeft } from 'lucide-react'
import { BackButton } from "@/components/back-button"
import { toast } from "@/hooks/use-toast"

const donationCategories = [
  { id: "general", name: "General Fund", description: "Support overall ministry activities" },
  { id: "missions", name: "Missions", description: "Support missionary work and outreach" },
  { id: "youth", name: "Youth Ministry", description: "Support youth programs and activities" },
  { id: "worship", name: "Worship Ministry", description: "Support music and worship equipment" },
  { id: "building", name: "Building Fund", description: "Support facility maintenance and improvements" },
  { id: "scholarship", name: "Scholarship Fund", description: "Support student scholarships and education" },
]

const suggestedAmounts = [500, 1000, 2500, 5000, 10000]

export default function DonationPage() {
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [category, setCategory] = useState("")
  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const [donorPhone, setDonorPhone] = useState("")
  const [message, setMessage] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString())
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setAmount("")
  }

  const getFinalAmount = () => {
    return customAmount ? parseFloat(customAmount) : parseFloat(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const finalAmount = getFinalAmount()

    if (!finalAmount || finalAmount <= 0) {
      setError("Please enter a valid donation amount")
      setLoading(false)
      return
    }

    if (!category) {
      setError("Please select a donation category")
      setLoading(false)
      return
    }

    if (!donorName || !donorEmail) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "donations"), {
        amount: finalAmount,
        category,
        donor_name: donorName,
        donor_email: donorEmail,
        donor_phone: donorPhone || null,
        message: message || null,
        payment_method: paymentMethod,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      toast({
        title: "Donation Submitted",
        description: "Thank you for your generous donation! You will receive a confirmation email shortly.",
      })

      // Reset form
      setAmount("")
      setCustomAmount("")
      setCategory("")
      setDonorName("")
      setDonorEmail("")
      setDonorPhone("")
      setMessage("")
      setPaymentMethod("")
    } catch (error) {
      console.error("Error submitting donation:", error)
      setError("Failed to submit donation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your donation has been submitted successfully. You will receive a confirmation email shortly.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setSuccess(false)} className="w-full">
                Make Another Donation
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton showHomeButton={true} />
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Our Ministry</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your generous donations help us continue our mission of spreading God's love and building a strong Christian community.
            </p>
          </div>
        </div>
      </div>

      {/* Donation Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Make a Donation</CardTitle>
                <CardDescription>
                  Choose your donation amount and category to support our ministry
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-6 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-semibold">Donation Amount (₹)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {suggestedAmounts.map((suggestedAmount) => (
                        <Button
                          key={suggestedAmount}
                          type="button"
                          variant={amount === suggestedAmount.toString() ? "default" : "outline"}
                          onClick={() => handleAmountSelect(suggestedAmount)}
                          className="h-12"
                        >
                          ₹{suggestedAmount.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="custom-amount">Custom Amount</Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        className="mt-1"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <Label htmlFor="category" className="text-base font-semibold">
                      Donation Category *
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {donationCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div>
                              <div className="font-medium">{cat.name}</div>
                              <div className="text-sm text-gray-500">{cat.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Donor Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Donor Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="donor-name">Full Name *</Label>
                        <Input
                          id="donor-name"
                          type="text"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="donor-email">Email Address *</Label>
                        <Input
                          id="donor-email"
                          type="email"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="donor-phone">Phone Number (Optional)</Label>
                      <Input
                        id="donor-phone"
                        type="tel"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base font-semibold">Preferred Payment Method</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <Button
                        type="button"
                        variant={paymentMethod === "upi" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("upi")}
                        className="h-16 flex flex-col items-center justify-center"
                      >
                        <Smartphone className="h-6 w-6 mb-1" />
                        <span className="text-sm">UPI</span>
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === "card" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("card")}
                        className="h-16 flex flex-col items-center justify-center"
                      >
                        <CreditCard className="h-6 w-6 mb-1" />
                        <span className="text-sm">Card</span>
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === "bank" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("bank")}
                        className="h-16 flex flex-col items-center justify-center"
                      >
                        <Building className="h-6 w-6 mb-1" />
                        <span className="text-sm">Bank Transfer</span>
                      </Button>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your prayer requests or special message..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || !getFinalAmount() || !category || !donorName || !donorEmail}
                    className="w-full h-12 text-lg"
                  >
                    {loading ? "Processing..." : `Donate ₹${getFinalAmount()?.toLocaleString() || "0"}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Impact Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ₹{getFinalAmount()?.toLocaleString() || "0"}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Your donation amount</p>
                </div>
                {category && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">
                      {donationCategories.find(cat => cat.id === category)?.name}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      {donationCategories.find(cat => cat.id === category)?.description}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Donation Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Donation Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {donationCategories.map((cat) => (
                  <div key={cat.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-sm">{cat.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{cat.description}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm">Secure Donation</h3>
                  <p className="text-xs text-gray-600">
                    Your donation is processed securely. You will receive a receipt via email.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Donations to Christian Students Fellowship are eligible for tax deductions under Section 80G of the Income Tax Act. 
                You will receive a tax-exempt receipt for your donation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                For questions about donations or to make offline contributions:
              </p>
              <div className="text-sm">
                <div>Email: donations@csfmmu.org</div>
                <div>Phone: +91 98765 43210</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
