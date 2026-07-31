"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AdminBackButton } from "@/components/admin-back-button"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc, limit } from "firebase/firestore"
import { MessageSquare, Trash2, CheckCircle2, Circle, Search } from "lucide-react"

interface ContactMessage {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  created_at?: string
  handled?: boolean
}

export default function MessagesManagement() {
  const { isAdmin } = useAuth()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (isAdmin) {
      loadMessages()
    }
  }, [isAdmin])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"), limit(50))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as ContactMessage[]
      setMessages(data)
    } catch (e) {
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const toggleHandled = async (m: ContactMessage) => {
    try {
      await updateDoc(doc(db, "contact_messages", m.id), { handled: !m.handled })
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, handled: !x.handled } : x))
      toast({ title: "Updated", description: "Message status updated" })
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    }
  }

  const removeMessage = async (m: ContactMessage) => {
    try {
      await deleteDoc(doc(db, "contact_messages", m.id))
      setMessages(prev => prev.filter(x => x.id !== m.id))
      toast({ title: "Deleted", description: "Message removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const filtered = messages.filter(m =>
    [m.name, m.email, m.subject, m.message].filter(Boolean).some(v => v!.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <AdminBackButton />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-sm text-gray-600">Contact form submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <Card key={m.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{m.subject || "Message"}</span>
                {m.handled ? (
                  <Badge className="bg-green-600">Handled</Badge>
                ) : (
                  <Badge variant="outline">New</Badge>
                )}
              </CardTitle>
              <CardDescription className="truncate">{m.name} • {m.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="line-clamp-3 text-sm">{m.message}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpenId(m.id)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" onClick={() => toggleHandled(m)}>
                  {m.handled ? <Circle className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {m.handled ? "Mark Unhandled" : "Mark Handled"}
                </Button>
                <Button variant="destructive" onClick={() => removeMessage(m)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!openId} onOpenChange={() => setOpenId(null)}>
        <DialogContent>
          {openId && (
            <>
              <DialogHeader>
                <DialogTitle>Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input readOnly value={messages.find(x => x.id === openId)?.name || ""} />
                <Input readOnly value={messages.find(x => x.id === openId)?.email || ""} />
                <Input readOnly value={messages.find(x => x.id === openId)?.subject || ""} />
                <Textarea readOnly value={messages.find(x => x.id === openId)?.message || ""} rows={6} />
              </div>
              <DialogFooter>
                <Button onClick={() => setOpenId(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

