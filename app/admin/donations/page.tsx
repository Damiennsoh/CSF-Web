"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, where, limit, getCountFromServer } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Users, Target } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAdminGuard } from "@/hooks/useAdminGuard"
import { AdminBackButton } from "@/components/admin-back-button"

interface DonationStats {
  totalDonations: number
  totalAmount: number
  monthlyDonations: number
  activeCampaigns: number
}

interface Donation {
  id: string
  donor_name: string
  donor_email: string
  amount: number
  donation_type: string
  purpose: string
  status: string
  created_at: string
  notes: string
}

interface Campaign {
  id: string
  title: string
  description: string
  goal_amount: number
  current_amount: number
  is_active: boolean
  is_featured: boolean
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  display_order: number
  is_active: boolean
}

export default function DonationManagement() {
  const { isAdmin, isAdminChecked, loading } = useAdminGuard()

  const router = useRouter()
  const [dataLoading, setDataLoading] = useState(true)
  const [hasRefreshed, setHasRefreshed] = useState(false)
  const [stats, setStats] = useState<DonationStats>({
    totalDonations: 0,
    totalAmount: 0,
    monthlyDonations: 0,
    activeCampaigns: 0,
  })

  const [donations, setDonations] = useState<Donation[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Form states
  const [isAddingCampaign, setIsAddingCampaign] = useState(false)
  const [isEditingCampaign, setIsEditingCampaign] = useState(false)
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      if (loading) {
        return // Wait for auth to finish loading
      }

      if (!isAdminChecked) {
        console.log("Donations: Admin status not checked yet, skipping initialization")
        return
      }

      if (!isAdmin) {
        console.log("Donations: User is not admin, redirecting to home")
        setDataLoading(false)
        router.push("/")
        return
      }
      
      // User is admin, proceed with loading data
      console.log("Donations: User is admin, loading data")
      await loadData()
      setDataLoading(false)
    }

    initializePage()
  }, [loading, isAdminChecked, isAdmin, hasRefreshed, router])

  const loadData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadDonations(),
        loadCampaigns(),
        loadCategories(),
      ])
    } catch (error) {
      console.error("Error loading donation data:", error)
      toast({
        title: "Error",
        description: "Failed to load donation data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadStats = async () => {
    try {
      let donationsCount = 0
      let totalAmount = 0
      let monthlyDonationsCount = 0
      let activeCampaignsCount = 0

      try {
        const donationsSnapshot = await getCountFromServer(collection(db, "donations"))
        donationsCount = donationsSnapshot.data().count
      } catch (error) {
        console.warn("Donations collection may not exist or permissions issue:", error)
        donationsCount = 0
      }

      try {
        const amountSnapshot = await getDocs(collection(db, "donations"))
        totalAmount = amountSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
      } catch (error) {
        console.warn("Could not load donation amounts:", error)
        totalAmount = 0
      }

      try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const monthlyQuery = query(collection(db, "donations"), where("createdAt", ">=", startOfMonth))
        const monthlySnapshot = await getCountFromServer(monthlyQuery)
        monthlyDonationsCount = monthlySnapshot.data().count
      } catch (error) {
        console.warn("Could not load monthly donations:", error)
        monthlyDonationsCount = 0
      }

      try {
        const campaignsQuery = query(collection(db, "donation_campaigns"), where("is_active", "==", true))
        const campaignsSnapshot = await getCountFromServer(campaignsQuery)
        activeCampaignsCount = campaignsSnapshot.data().count
      } catch (error) {
        console.warn("Could not load active campaigns:", error)
        activeCampaignsCount = 0
      }

      setStats({
        totalDonations: donationsCount,
        totalAmount,
        monthlyDonations: monthlyDonationsCount,
        activeCampaigns: activeCampaignsCount,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      // Set default stats
      setStats({
        totalDonations: 0,
        totalAmount: 0,
        monthlyDonations: 0,
        activeCampaigns: 0,
      })
    }
  }

  const loadDonations = async () => {
    try {
      const q = query(collection(db, "donations"), orderBy("createdAt", "desc"), limit(20))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[]
      setDonations(data)
    } catch (error) {
      console.error("Error loading donations:", error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const q = query(collection(db, "donation_campaigns"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[]
      setCampaigns(data)
    } catch (error) {
      console.warn("Error loading campaigns (collection may not exist):", error)
      setCampaigns([]) // Set empty array as fallback
    }
  }

  const loadCategories = async () => {
    try {
      const q = query(collection(db, "donation_categories"), orderBy("display_order", "asc"))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      await addDoc(collection(db, "donation_campaigns"), {
        title: formData.get("title"),
        description: formData.get("description"),
        goal_amount: Number.parseFloat(formData.get("goal_amount") as string),
        current_amount: 0,
        is_active: formData.get("is_active") === "true",
        is_featured: formData.get("is_featured") === "true",
        createdAt: serverTimestamp(),
      })

      loadCampaigns()
      loadStats()
      setIsAddingCampaign(false)
      toast({
        title: "Campaign Created Successfully",
        description: "New donation campaign has been added and is now active.",
      })
    } catch (error) {
      console.error("Error adding campaign:", error)
      toast({
        title: "Creation Failed",
        description: "Failed to create campaign. Please check your input and try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCampaign) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      const campaignRef = doc(db, "donation_campaigns", currentCampaign.id)
      await updateDoc(campaignRef, {
        title: formData.get("title"),
        description: formData.get("description"),
        goal_amount: Number.parseFloat(formData.get("goal_amount") as string),
        current_amount: Number.parseFloat(formData.get("current_amount") as string),
        is_active: formData.get("is_active") === "true",
        is_featured: formData.get("is_featured") === "true",
        updatedAt: serverTimestamp(),
      })

      loadCampaigns()
      loadStats()
      setIsEditingCampaign(false)
      setCurrentCampaign(null)
      toast({
        title: "Campaign Updated Successfully",
        description: "Campaign information has been saved and updated.",
      })
    } catch (error) {
      console.error("Error updating campaign:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return

    try {
      await deleteDoc(doc(db, "donation_campaigns", id))

      loadCampaigns()
      loadStats()
      toast({
        title: "Campaign Deleted",
        description: "The donation campaign has been removed.",
      })
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateDonationStatus = async (donationId: string, status: string) => {
    try {
      const donationRef = doc(db, "donations", donationId)
      await updateDoc(donationRef, { status })

      loadDonations()
      toast({
        title: "Status Updated Successfully",
        description: `Donation status has been updated to ${status}.`,
      })
    } catch (error) {
      console.error("Error updating donation status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update donation status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      await addDoc(collection(db, "donation_categories"), {
        name: formData.get("name"),
        description: formData.get("description"),
        icon: formData.get("icon"),
        display_order: Number.parseInt(formData.get("display_order") as string) || 0,
        is_active: formData.get("is_active") === "true",
        createdAt: serverTimestamp(),
      })

      loadCategories()
      setIsAddingCategory(false)
      toast({
        title: "Category Added",
        description: "New donation category has been created.",
      })
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Creation Failed",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCategory) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      const categoryRef = doc(db, "donation_categories", currentCategory.id)
      await updateDoc(categoryRef, {
        name: formData.get("name"),
        description: formData.get("description"),
        icon: formData.get("icon"),
        display_order: Number.parseInt(formData.get("display_order") as string) || 0,
        is_active: formData.get("is_active") === "true",
        updatedAt: serverTimestamp(),
      })

      loadCategories()
      setIsEditingCategory(false)
      setCurrentCategory(null)
      toast({
        title: "Category Updated",
        description: "Category information has been saved.",
      })
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) return

    try {
      await deleteDoc(doc(db, "donation_categories", id))

      loadCategories()
      toast({
        title: "Category Deleted",
        description: "The donation category has been removed.",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading || !isAdminChecked) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donation management...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <AdminBackButton iconOnly />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donation Management</h1>
          <p className="mt-2 text-gray-600">Manage donations, campaigns, and giving categories</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDonations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyDonations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="donations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="donations">Recent Donations</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>Manage and track donation submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold">
                              {donation.donor_name || "Anonymous"} - ₹{donation.amount.toLocaleString()}
                            </h3>
                            <p className="text-sm text-gray-600">{donation.donor_email || "No email provided"}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(donation.created_at).toLocaleDateString()} • {donation.donation_type} •{" "}
                              {donation.purpose}
                            </p>
                            {donation.notes && <p className="text-sm text-gray-600 mt-1">Note: {donation.notes}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            donation.status === "completed"
                              ? "default"
                              : donation.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {donation.status}
                        </Badge>
                        <Select
                          value={donation.status}
                          onValueChange={(value) => updateDonationStatus(donation.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Donation Campaigns</CardTitle>
                    <CardDescription>Manage fundraising campaigns and goals</CardDescription>
                  </div>
                  <Dialog open={isAddingCampaign} onOpenChange={setIsAddingCampaign}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Campaign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Campaign</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddCampaign} className="space-y-4">
                        <div>
                          <Label htmlFor="title">Campaign Title</Label>
                          <Input id="title" name="title" required />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" />
                        </div>
                        <div>
                          <Label htmlFor="goal_amount">Goal Amount (₹)</Label>
                          <Input id="goal_amount" name="goal_amount" type="number" required />
                        </div>
                        <div>
                          <Label htmlFor="current_amount">Current Amount (₹)</Label>
                          <Input id="current_amount" name="current_amount" type="number" defaultValue="0" />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked />
                            <Label htmlFor="is_active">Active</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="is_featured" name="is_featured" value="true" />
                            <Label htmlFor="is_featured">Featured</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Add Campaign</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{campaign.title}</h3>
                          <p className="text-gray-600 mb-2">{campaign.description}</p>
                          <div className="flex gap-2 mb-2">
                            {campaign.is_active && <Badge variant="default">Active</Badge>}
                            {campaign.is_featured && <Badge variant="secondary">Featured</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentCampaign(campaign)
                              setIsEditingCampaign(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteCampaign(campaign.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>₹{campaign.current_amount.toLocaleString()} raised</span>
                          <span>₹{campaign.goal_amount.toLocaleString()} goal</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {((campaign.current_amount / campaign.goal_amount) * 100).toFixed(1)}% funded
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Donation Categories</CardTitle>
                    <CardDescription>Manage giving categories and purposes</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddingCategory(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">Order: {category.display_order}</Badge>
                          <Badge variant="outline">Icon: {category.icon}</Badge>
                          {category.is_active && <Badge variant="default">Active</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentCategory(category)
                            setIsEditingCategory(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Campaign Dialog */}
        <Dialog open={isEditingCampaign} onOpenChange={setIsEditingCampaign}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
            </DialogHeader>
            {currentCampaign && (
              <form onSubmit={handleEditCampaign} className="space-y-4">
                <div>
                  <Label htmlFor="edit_title">Campaign Title</Label>
                  <Input id="edit_title" name="title" defaultValue={currentCampaign.title} required />
                </div>
                <div>
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea id="edit_description" name="description" defaultValue={currentCampaign.description || ""} />
                </div>
                <div>
                  <Label htmlFor="edit_goal_amount">Goal Amount (₹)</Label>
                  <Input
                    id="edit_goal_amount"
                    name="goal_amount"
                    type="number"
                    defaultValue={currentCampaign.goal_amount}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_current_amount">Current Amount (₹)</Label>
                  <Input
                    id="edit_current_amount"
                    name="current_amount"
                    type="number"
                    defaultValue={currentCampaign.current_amount}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_is_active"
                      name="is_active"
                      value="true"
                      defaultChecked={currentCampaign.is_active}
                    />
                    <Label htmlFor="edit_is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_is_featured"
                      name="is_featured"
                      value="true"
                      defaultChecked={currentCampaign.is_featured}
                    />
                    <Label htmlFor="edit_is_featured">Featured</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Update Campaign</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
