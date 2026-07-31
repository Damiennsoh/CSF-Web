"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditableCell } from "@/components/schedule-editable-cell"
import { 
  Calendar, 
  Clock, 
  Download, 
  Trash2, 
  Settings, 
  Users, 
  Plus, 
  X, 
  Upload, 
  Save, 
  Info,
  Eye,
  Edit
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { DocxExportService } from "@/lib/docx-export"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, DocumentReference } from "firebase/firestore"

interface Member {
  id: number
  name: string
}

interface ScheduleItem {
  date: string
  day: string
  event?: string
  leader: string
  word: string
  special?: string
}

interface InstitutionDetails {
  institutionName: string
  universityName: string
  location: string
  startMonth: string
  startYear: string
  scheduleDuration: string
  logoData: string | null
}

const ScheduleCreator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("schedule")
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  
  // Add CSS styles for Excel-like editing
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .editable-cell {
        cursor: pointer;
        min-height: 24px;
        position: relative;
      }
      .editable-cell:hover {
        background-color: rgba(93, 92, 222, 0.1);
      }
      .dark .editable-cell:hover {
        background-color: rgba(93, 92, 222, 0.2);
      }
      .edit-mode {
        background-color: rgba(93, 92, 222, 0.2);
        box-shadow: 0 0 0 2px rgba(93, 92, 222, 0.3);
      }
      .dark .edit-mode {
        background-color: rgba(93, 92, 222, 0.3);
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  // Form states
  const [institutionDetails, setInstitutionDetails] = useState<InstitutionDetails>({
    institutionName: "",
    universityName: "",
    location: "",
    startMonth: "",
    startYear: "",
    scheduleDuration: "1",
    logoData: null
  })
  
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Emmanuel" }, { id: 2, name: "Mutale" }, { id: 3, name: "Winner" },
    { id: 4, name: "Kelly" }, { id: 5, name: "Deborah" }, { id: 6, name: "Sourey" },
    { id: 7, name: "Bryan" }, { id: 8, name: "Davies" }, { id: 9, name: "Frank" },
    { id: 10, name: "Blessing" }, { id: 11, name: "Takudzwa" }, { id: 12, name: "Wanji" },
    { id: 13, name: "Bonaventure" }, { id: 14, name: "Winnie" }, { id: 15, name: "Sam" },
    { id: 16, name: "Tanya" }, { id: 17, name: "Damien" }, { id: 18, name: "Macbeth" },
    { id: 19, name: "Glory" }, { id: 20, name: "Tapiwa" }, { id: 21, name: "Shezbee" },
    { id: 22, name: "Leadership slot" }, { id: 23, name: "PRAYER & FASTING" },
    { id: 24, name: "WORSHIP NIGHT" }, { id: 25, name: "CHOIR DEPARTMENT" },
    { id: 26, name: "HALF NIGHT" }, { id: 27, name: "INTERCESSORY DEPARTMENT" },
    { id: 28, name: "Flora" }
  ])
  
  const [newMember, setNewMember] = useState("")
  
  // Pro Architecture: Single display data with mode switching
  const [displayData, setDisplayData] = useState<ScheduleItem[]>([])
  const [displayHalfNightData, setDisplayHalfNightData] = useState<any[]>([])
  const [mode, setMode] = useState<'live' | 'draft'>('live')
  const [scheduleGenerated, setScheduleGenerated] = useState(false)
  const [halfNightGenerated, setHalfNightGenerated] = useState(false)
  
  // Configuration states (shared between modes)
  const [halfNightDate, setHalfNightDate] = useState("")
  const [halfNightStartTime, setHalfNightStartTime] = useState("21:00")
  const [halfNightEndTime, setHalfNightEndTime] = useState("00:00")
  const [editingHalfNightCell, setEditingHalfNightCell] = useState<{index: number, field: 'sessionName' | 'prayerPoint' | 'bibleVerse' | 'member' | 'time' | 'leader'} | null>(null)
  const [halfNightEditValue, setHalfNightEditValue] = useState("")
  const [showHalfNightDropdown, setShowHalfNightDropdown] = useState<{x: number, y: number, index: number} | null>(null)
  const [loadingBibleVerse, setLoadingBibleVerse] = useState<{index: number} | null>(null)
  const [testingAPI, setTestingAPI] = useState(false)
  const [editingCell, setEditingCell] = useState<{index: number, field: 'leader' | 'word' | 'event'} | null>(null)
  const [editValue, setEditValue] = useState("")
  const [showDropdown, setShowDropdown] = useState<{x: number, y: number, index: number, field: 'leader' | 'word'} | null>(null)
  const [showCombinedNamesModal, setShowCombinedNamesModal] = useState<{x: number, y: number, index: number, field: 'leader' | 'word'} | null>(null)
  const [selectedPerson1, setSelectedPerson1] = useState("")
  const [selectedPerson2, setSelectedPerson2] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Check if schedule feature is enabled
  const scheduleEnabled = process.env.NEXT_PUBLIC_SCHEDULE_ENABLED === "true"
  const canEdit = isAdmin || isSuperAdmin
  
  // Debug admin status
  useEffect(() => {
    console.log('Admin Status:', { user, isAdmin, isSuperAdmin, canEdit, mounted })
  }, [user, isAdmin, isSuperAdmin, canEdit, mounted])
  
  useEffect(() => {
    setMounted(true)
    // Load configuration from Firestore (primary) or localStorage (fallback)
    loadMembersAndInstitutionFromFirestore()
  }, [])

  // Auto-save displayData to IndexedDB when it changes in draft mode
  useEffect(() => {
    if (!mounted || !scheduleGenerated || displayData.length === 0) return
    
    const saveTimer = setTimeout(async () => {
      if (mode === 'draft') {
        console.log('[ScheduleCreator] Auto-saving schedule to IndexedDB')
        await saveToIndexedDB()
      }
    }, 1000) // Debounce by 1 second
    
    return () => clearTimeout(saveTimer)
  }, [displayData, mode, scheduleGenerated, mounted])

  // Auto-save halfNightData to IndexedDB when it changes in draft mode
  useEffect(() => {
    if (!mounted || !halfNightGenerated || displayHalfNightData.length === 0) return
    
    const saveTimer = setTimeout(async () => {
      if (mode === 'draft') {
        console.log('[ScheduleCreator] Auto-saving half-night schedule to IndexedDB')
        await saveToIndexedDB()
      }
    }, 1000) // Debounce by 1 second
    
    return () => clearTimeout(saveTimer)
  }, [displayHalfNightData, mode, halfNightGenerated, mounted])

  // Firestore real-time sync - Always listen for Live data
  useEffect(() => {
    if (!mounted || !db) return
    
    const scheduleRef = doc(db, "csf_schedules", "weekly_active")
    const unsubscribe = onSnapshot(scheduleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        
        // Always update live data in background
        const liveItems = data.items || []
        const liveHalfNight = data.halfNightSchedule || []
        
        // Only update display if we're in live mode
        if (mode === 'live') {
          setDisplayData(liveItems)
          setDisplayHalfNightData(liveHalfNight)
          setScheduleGenerated(!!liveItems.length)
          setHalfNightGenerated(!!liveHalfNight.length)
        }
        
        // Always update configuration (shared between modes)
        if (data.halfNightDate) setHalfNightDate(data.halfNightDate)
        if (data.halfNightStartTime) setHalfNightStartTime(data.halfNightStartTime)
        if (data.halfNightEndTime) setHalfNightEndTime(data.halfNightEndTime)
      } else {
        // No live data exists
        if (mode === 'live') {
          setDisplayData([])
          setDisplayHalfNightData([])
          setScheduleGenerated(false)
          setHalfNightGenerated(false)
        }
      }
      setLoading(false)
    }, (error) => {
      console.error("Firestore sync error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [mounted, db, mode])
  
  // Load draft data from IndexedDB
  const loadDraftFromIndexedDB = async () => {
  try {
    const dbName = 'CSFScheduleDB'
    const version = 2 // Increased to 2 to trigger the update

    const request = indexedDB.open(dbName, version)

    // This handles the initial creation of the 'drafts' store
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Safety check to ensure store exists before transaction
      if (!db.objectStoreNames.contains('drafts')) return

      const transaction = db.transaction(['drafts'], 'readonly')
      const store = transaction.objectStore('drafts')

      // Load main draft
      const draftRequest = store.get('current_draft')
      draftRequest.onsuccess = () => {
        if (draftRequest.result) {
          const draftData = draftRequest.result
          console.log('Loading draft data from IndexedDB:', draftData)
          
          // Restore schedule data
          if (draftData.schedule && draftData.schedule.length > 0) {
            setDisplayData(draftData.schedule)
            setScheduleGenerated(true)
          }
          
          // Restore half night settings
          if (draftData.halfNightDate) setHalfNightDate(draftData.halfNightDate)
          if (draftData.halfNightStartTime) setHalfNightStartTime(draftData.halfNightStartTime)
          if (draftData.halfNightEndTime) setHalfNightEndTime(draftData.halfNightEndTime)
          if (draftData.scheduleGenerated !== undefined) setScheduleGenerated(draftData.scheduleGenerated)
          if (draftData.halfNightGenerated !== undefined) setHalfNightGenerated(draftData.halfNightGenerated)
          
          toast({
            title: "Draft Loaded",
            description: `Schedule draft from ${new Date(draftData.updatedAt).toLocaleDateString()} restored.`,
            variant: "default"
          })
        }
      }
      
      // Load half night draft
      const halfNightRequest = store.get('halfnight_draft')
      halfNightRequest.onsuccess = () => {
        if (halfNightRequest.result) {
          const halfNightData = halfNightRequest.result
          console.log('Loading half night draft from IndexedDB:', halfNightData)
          
          if (halfNightData.schedule && halfNightData.schedule.length > 0) {
            setDisplayHalfNightData(halfNightData.schedule)
            setHalfNightGenerated(true)
          }
        }
      }
      
      // Fallback to localStorage if IndexedDB fails
      transaction.onerror = () => {
        console.log('IndexedDB failed, trying localStorage fallback')
        loadDraftFromLocalStorage()
      }
    }
    
    request.onerror = () => {
      console.log('IndexedDB failed, trying localStorage fallback')
      loadDraftFromLocalStorage()
    }
  } catch (error) {
    console.error('Error loading draft from IndexedDB:', error)
    loadDraftFromLocalStorage()
  }
}
  
  // Fallback to localStorage
  const loadDraftFromLocalStorage = () => {
    try {
      const savedDraft = localStorage.getItem('csf_schedule_draft')
      const savedHalfNightDraft = localStorage.getItem('csf_halfnight_draft')
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft)
        console.log('Loading draft data from localStorage:', draftData)
        
        if (draftData.schedule && draftData.schedule.length > 0) {
          setDisplayData(draftData.schedule)
          setScheduleGenerated(true)
        }
        
        if (draftData.halfNightDate) setHalfNightDate(draftData.halfNightDate)
        if (draftData.halfNightStartTime) setHalfNightStartTime(draftData.halfNightStartTime)
        if (draftData.halfNightEndTime) setHalfNightEndTime(draftData.halfNightEndTime)
        if (draftData.scheduleGenerated !== undefined) setScheduleGenerated(draftData.scheduleGenerated)
        if (draftData.halfNightGenerated !== undefined) setHalfNightGenerated(draftData.halfNightGenerated)
      }
      
      if (savedHalfNightDraft) {
        const halfNightData = JSON.parse(savedHalfNightDraft)
        console.log('Loading half night draft from localStorage:', halfNightData)
        
        if (halfNightData.schedule && halfNightData.schedule.length > 0) {
          setDisplayHalfNightData(halfNightData.schedule)
          setHalfNightGenerated(true)
        }
      }
    } catch (error) {
      console.error('Error loading draft from localStorage:', error)
      toast({
        title: "Load Error",
        description: "Could not load draft data.",
        variant: "destructive"
      })
    }
  }
  
  const switchToDraft = async () => {
    setMode('draft')
    await loadDraftFromIndexedDB()
    
    // Test IndexedDB by saving current state immediately
    if (displayData.length > 0) {
      console.log('Auto-saving to IndexedDB on mode switch')
      await persistDraft(displayData, 'weekly')
    }
    if (displayHalfNightData.length > 0) {
      console.log('Auto-saving half-night to IndexedDB on mode switch')
      await persistDraft(displayHalfNightData, 'halfnight')
    }
  }
  
  // Switch to live mode
  const switchToLive = async () => {
    setMode('live')
    // Live data will be loaded by the Firestore listener above
  }

  // Publish: Copy from IndexedDB -> Firestore (The Sync Bridge)
  const handlePublish = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can publish schedules",
        variant: "destructive"
      })
      return
    }

    if (!db) {
      toast({
        title: "Error",
        description: "Database not available. Please refresh the page.",
        variant: "destructive"
      })
      return
    }

    try {
      // Read current display data (which is the draft in draft mode)
      const scheduleData = {
        items: displayData,
        halfNightSchedule: displayHalfNightData,
        halfNightDate,
        halfNightStartTime,
        halfNightEndTime,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'Anonymous'
      }

      // Single write to Firestore - the only network operation!
      await setDoc(doc(db, "csf_schedules", "weekly_active"), scheduleData)
      
      // Clear draft data after successful publish
      localStorage.removeItem('csf_schedule_draft')
      localStorage.removeItem('csf_halfnight_draft')
      
      // Switch back to live mode to view the published result
      await switchToLive()
      
      toast({
        title: "Published Successfully!",
        description: "Your draft has been published and is now visible to everyone.",
      })
    } catch (error) {
      console.error("Publish error:", error)
      toast({
        title: "Error",
        description: "Failed to publish schedule",
        variant: "destructive"
      })
    }
  }
  
  const saveToLocalStorage = () => {
    localStorage.setItem("csf_members", JSON.stringify(members))
    localStorage.setItem("csf_institution", JSON.stringify(institutionDetails))
    // Save generated schedule if it exists (legacy compatibility)
    if (scheduleGenerated && displayData.length > 0) {
      localStorage.setItem("csf_schedule", JSON.stringify(displayData))
      localStorage.setItem("csf_schedule_generated", "true")
    }
    // Save Half Night schedule if it exists (legacy compatibility)
    if (halfNightGenerated && displayHalfNightData.length > 0) {
      localStorage.setItem("csf_half_night_schedule", JSON.stringify(displayHalfNightData))
    }
  }
  
  // Firestore storage for members and institution details - accessible across devices
  const saveMembersAndInstitutionToFirestore = async () => {
    if (!db || !canEdit) return
    
    try {
      await setDoc(doc(db, "csf_schedules", "configuration"), {
        members,
        institutionDetails,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'Anonymous'
      })
      console.log("[ScheduleCreator] Saved members and institution to Firestore")
    } catch (error) {
      console.error("[ScheduleCreator] Error saving to Firestore:", error)
      // Fall back to localStorage
      saveToLocalStorage()
    }
  }
  
  const loadMembersAndInstitutionFromFirestore = async () => {
    if (!db) return
    
    try {
      const configRef = doc(db, "csf_schedules", "configuration")
      const configSnap = await getDoc(configRef)
      
      if (configSnap.exists()) {
        const data = configSnap.data()
        if (data.members && Array.isArray(data.members)) {
          setMembers(data.members)
        }
        if (data.institutionDetails) {
          setInstitutionDetails(data.institutionDetails)
        }
        console.log("[ScheduleCreator] Loaded members and institution from Firestore")
      } else {
        // If no Firestore data, fall back to localStorage
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error("[ScheduleCreator] Error loading from Firestore:", error)
      // Fall back to localStorage
      loadFromLocalStorage()
    }
  }
  
  const saveToIndexedDB = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction("drafts", "readwrite");
      const store = tx.objectStore("drafts");
      
      // Save main draft data (what loadDraftFromIndexedDB expects)
      await store.put({
        id: 'current_draft',
        schedule: displayData,
        halfNightDate: halfNightDate,
        halfNightStartTime: halfNightStartTime,
        halfNightEndTime: halfNightEndTime,
        scheduleGenerated: scheduleGenerated,
        halfNightGenerated: halfNightGenerated,
        updatedAt: new Date().toISOString()
      });
      
      // Save half night draft data if it exists
      if (halfNightGenerated && displayHalfNightData.length > 0) {
        await store.put({
          id: 'halfnight_draft',
          schedule: displayHalfNightData,
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log("Saved data to IndexedDB");
    } catch (err) {
      console.error("IndexedDB Save Failed, falling back to LocalStorage", err);
      saveToLocalStorage();
    }
  }
  
  // 1. IMPROVED INDEXEDDB WRAPPER
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("CSFScheduleDB", 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("drafts")) {
          db.createObjectStore("drafts", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const persistDraft = async (data: any, type: 'weekly' | 'halfnight' = 'weekly') => {
    if (mode !== 'draft') return;
    try {
      const db = await openDB();
      const tx = db.transaction("drafts", "readwrite");
      const store = tx.objectStore("drafts");
      await store.put({
        id: type === 'weekly' ? 'current_weekly' : 'current_halfnight',
        data,
        updatedAt: new Date().toISOString()
      });
      console.log(`Saved ${type} draft to IndexedDB`);
    } catch (err) {
      console.error("IndexedDB Save Failed, falling back to LocalStorage", err);
      localStorage.setItem(`csf_fallback_${type}`, JSON.stringify(data));
    }
  };
  
  // Load data from localStorage (legacy configuration)
  const loadFromLocalStorage = () => {
    try {
      const savedInstitution = localStorage.getItem("csf_institution")
      const savedMembers = localStorage.getItem("csf_members")
      
      if (savedInstitution) {
        setInstitutionDetails(JSON.parse(savedInstitution))
      }
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers))
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error)
    }
  }
  
  const addMember = () => {
    if (newMember.trim() && canEdit) {
      const newId = Math.max(...members.map(m => m.id), 0) + 1
      setMembers([...members, { id: newId, name: newMember.trim() }])
      setNewMember("")
      saveToLocalStorage()
      saveMembersAndInstitutionToFirestore() // Save to Firestore for cross-device sync
      
      toast({
        title: "Member Added",
        description: `${newMember.trim()} has been added to the members list.`,
        variant: "default"
      })
    }
  }
  
  const removeMember = (id: number) => {
    if (!canEdit) return
    
    const member = members.find(m => m.id === id)
    if (member && confirm(`Are you sure you want to remove "${member.name}" from the members list?`)) {
      setMembers(members.filter(m => m.id !== id))
      saveToLocalStorage()
      saveMembersAndInstitutionToFirestore() // Save to Firestore for cross-device sync
      
      toast({
        title: "Member Removed",
        description: `${member.name} has been removed from the members list.`,
        variant: "default"
      })
    }
  }
  
  const generateSchedule = async () => {
  if (!canEdit) return
  
  setLoading(true)
  setLoadingText("Generating schedule...")
  
  setTimeout(async () => {
    const months = parseInt(institutionDetails.scheduleDuration)
    const startMonth = parseInt(institutionDetails.startMonth)
    const startYear = parseInt(institutionDetails.startYear)
    const newSchedule: ScheduleItem[] = []
    
    const regularMembers = members.filter(member =>
      !["Leadership slot", "PRAYER & FASTING", "WORSHIP NIGHT",
      "CHOIR DEPARTMENT", "HALF NIGHT", "INTERCESSORY DEPARTMENT"].includes(member.name)
    )
    
    if (regularMembers.length < 5) {
      alert("Please add at least 5 regular members to generate a schedule.")
      setLoading(false)
      return
    }
    
    let leadingIndex = Math.floor(Math.random() * regularMembers.length)
    let sharingIndex = Math.floor(Math.random() * regularMembers.length)
    
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    
    for (let m = 0; m < months; m++) {
      const currentMonth = (startMonth + m - 1) % 12 + 1
      const currentYear = startYear + Math.floor((startMonth + m - 1) / 12)
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()
      
      let thursdayCount = 0

      for (let day = 1; day <= lastDayOfMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day)
        const dayOfWeek = date.getDay()
        
        // Define Meeting Days
        const isSunday = dayOfWeek === 0
        const isMonday = dayOfWeek === 1
        const isTuesday = dayOfWeek === 2
        const isWednesday = dayOfWeek === 3
        const isThursday = dayOfWeek === 4
        const isLastFriday = dayOfWeek === 5 && day > lastDayOfMonth - 7
        const isRegularFriday = dayOfWeek === 5 && !isLastFriday
        const isSaturday = dayOfWeek === 6

        // Skip non-meeting days to keep the schedule clean
        if (!isSunday && !isMonday && !isTuesday && !isWednesday && !isThursday && !isLastFriday && !isRegularFriday && !isSaturday) continue

        let event = ""
        let leader = ""
        let word = ""
        let special = ""

        if (isSunday) {
          // Sunday: Assign one leader only (word column blank)
          event = "Sunday Service"
          leader = regularMembers[leadingIndex % regularMembers.length].name
          word = ""
          leadingIndex++
          special = "SUNDAY"
        } else if (isMonday) {
          special = "MONDAY_OPTIONAL"
        } else if (isTuesday) {
          event = "PRAYER & WORD SHARING"
          // Tuesday: 2 Random Names
          leader = regularMembers[leadingIndex % regularMembers.length].name
          word = regularMembers[sharingIndex % regularMembers.length].name
          leadingIndex++
          sharingIndex++
          if (leader === word) {
            sharingIndex++
            word = regularMembers[sharingIndex % regularMembers.length].name
          }
          special = "TUESDAY"
        } else if (isWednesday) {
          event = "BIBLE STUDIES"
          leader = "BIBLE STUDY DEPARTMENT"
          word = "" 
          special = "WEDNESDAY_STUDIES"
        } else if (isThursday) {
          thursdayCount++
          if (thursdayCount % 2 !== 0) {
            event = "PRAYER & FASTING"
          } else {
            event = "REVIVAL & DELIVERANCE"
          }
          const person1 = regularMembers[sharingIndex % regularMembers.length].name
          sharingIndex++
          const person2 = regularMembers[sharingIndex % regularMembers.length].name
          sharingIndex++
          leader = `${person1} & ${person2}` 
          word = ""
          special = "THURSDAY_FASTING"
        } else if (isLastFriday) {
          event = "HALF NIGHT"
          leader = "INTERCESSORY DEPARTMENT"
          word = ""
          special = "LAST_FRIDAY_HALFNIGHT"
        } else if (isRegularFriday) {
          // Regular Friday (not last): Leave blank, no auto-assignment
          leader = ""
          word = ""
          special = "FRIDAY"
        } else if (isSaturday) {
          event = "Leaders' & 10PM Prayer"
          const person1 = regularMembers[leadingIndex % regularMembers.length].name
          leadingIndex++
          const person2 = regularMembers[leadingIndex % regularMembers.length].name
          leadingIndex++
          leader = `${person1} (Leaders' Prayer) & ${person2} (10PM Prayer)`
          word = ""
          special = "SATURDAY"
        }

        newSchedule.push({
          date: `${day.toString().padStart(2, '0')}/${currentMonth.toString().padStart(2, '0')}/${currentYear}`,
          day: daysOfWeek[dayOfWeek],
          event,
          leader,
          word,
          special
        })
      }
    }
    
    setDisplayData(newSchedule)
    setScheduleGenerated(true)
    setLoading(false)
    
    // Save to appropriate storage
    if (mode === 'draft') {
      await saveToIndexedDB()
    } else {
      saveToLocalStorage()
    }
    
    toast({
      title: "Schedule Generated",
      description: mode === 'draft' 
        ? "Schedule draft generated. Publish to make it live."
        : "Schedule generated successfully.",
      variant: "default"
    })
  }, 1000)
}
  
  const exportToWord = async () => {
    if (!scheduleGenerated || !displayData.length) {
      toast({
        title: "No Schedule",
        description: "Please generate a schedule first.",
        variant: "destructive"
      })
      return
    }
    
    try {
      setLoading(true)
      setLoadingText("Exporting to Word...")
      
      await DocxExportService.exportSchedule(displayData, {
        name: institutionDetails.institutionName,
        university: institutionDetails.universityName,
        location: institutionDetails.location,
        duration: institutionDetails.scheduleDuration
      })
      
      toast({
        title: "Export Successful",
        description: "Schedule has been exported to Word document.",
        variant: "default"
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export schedule to Word document.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingText("")
    }
  }
  
  const clearAllData = () => {
    if (canEdit && confirm("Are you sure you want to clear all data?")) {
      setDisplayData([])
      setDisplayHalfNightData([])
      setScheduleGenerated(false)
      setHalfNightGenerated(false)
      localStorage.removeItem("csf_members")
      localStorage.removeItem("csf_institution")
      localStorage.removeItem("csf_schedule")
      localStorage.removeItem("csf_schedule_generated")
      localStorage.removeItem("csf_half_night_schedule")
      localStorage.removeItem("csf_half_night_generated")
      localStorage.removeItem("csf_half_night_date")
      localStorage.removeItem("csf_half_night_start_time")
      localStorage.removeItem("csf_half_night_end_time")
      localStorage.removeItem("csf_half_night_used_leaders")
      localStorage.removeItem("csf_schedule_draft")
      localStorage.removeItem("csf_halfnight_draft")
      
      toast({
        title: "Data Cleared",
        description: "All schedule data has been cleared.",
        variant: "default"
      })
    }
  }
  
  const generateHalfNightSchedule = async () => {
    if (!canEdit) return
    
    if (!halfNightDate) {
      toast({
        title: "Missing Date",
        description: "Please select a date for Half Night of Prayer.",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    setLoadingText("Generating Half Night schedule...")
    
    setTimeout(async () => {
      // Filter out special entries
      const regularMembers = members.filter(member =>
        !["Leadership slot", "PRAYER & FASTING", "WORSHIP NIGHT",
        "CHOIR DEPARTMENT", "HALF NIGHT", "INTERCESSORY DEPARTMENT"].includes(member.name)
      )
      
      if (regularMembers.length < 6) {
        toast({
          title: "Insufficient Members",
          description: "Please add at least 6 regular members to generate Half Night schedule.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }
      
      // Get previously used leaders from localStorage to avoid repetition
      const previouslyUsedLeaders = JSON.parse(localStorage.getItem('csf_half_night_used_leaders') || '[]')
      
      // Filter out members who were leaders in the last 3 half-night schedules
      const availableMembers = regularMembers.filter(member => 
        !previouslyUsedLeaders.includes(member.name)
      )
      
      // If not enough unused members, include some previously used ones
      const membersForSelection = availableMembers.length >= 6 ? availableMembers : regularMembers
      
      // Shuffle and select leaders
      const shuffledMembers = [...membersForSelection].sort(() => 0.5 - Math.random())
      
      // Store selected leaders for next time
      const newLeaders = [
        shuffledMembers[0]?.name || 'Member 1',
        shuffledMembers[1]?.name || 'Member 2', 
        shuffledMembers[2]?.name || 'Member 3',
        shuffledMembers[3]?.name || 'Member 4',
        shuffledMembers[4]?.name || 'Member 5',
        shuffledMembers[5]?.name || 'Member 6'
      ]
      
      // Update previously used leaders (keep only last 3 schedules)
      const updatedUsedLeaders = [...previouslyUsedLeaders.slice(-2), ...newLeaders].slice(-6)
      localStorage.setItem('csf_half_night_used_leaders', JSON.stringify(updatedUsedLeaders))
      
      // Create time slots with editable session names and assigned stewards
      const timeSlots = [
        { start: "9:00 PM", end: "9:20 PM", event: "OPENING PRAYER", isSpecial: true, leader: shuffledMembers[0].name, prayerPoints: [], bibleVerses: [] },
        { start: "9:20 PM", end: "9:50 PM", event: "WORSHIP", isSpecial: true, leader: "CSF CHOIR", prayerPoints: [], bibleVerses: [] },
        { start: "9:50 PM", end: "10:10 PM", event: "1st Prayer Session", isPrayer: true, leader: shuffledMembers[2].name, prayerPoints: [], bibleVerses: [] },
        { start: "10:10 PM", end: "10:30 PM", event: "2nd Prayer Session", isPrayer: true, leader: shuffledMembers[3].name, prayerPoints: [], bibleVerses: [] },
        { start: "10:30 PM", end: "10:50 PM", event: "3rd Prayer Session", isPrayer: true, leader: shuffledMembers[4].name, prayerPoints: [], bibleVerses: [] },
        { start: "10:50 PM", end: "11:20 PM", event: "WORD SHARING", isSpecial: true, leader: shuffledMembers[5].name, prayerPoints: [], bibleVerses: [] },
        { start: "11:20 PM", end: "11:40 PM", event: "4th Prayer Session", isPrayer: true, leader: shuffledMembers[0].name, prayerPoints: [], bibleVerses: [] },
        { start: "11:40 PM", end: "12:00 AM", event: "CLOSING PRAYER", isSpecial: true, leader: shuffledMembers[1].name, prayerPoints: [], bibleVerses: [] }
      ]
      
      // Update the display data (works for both modes)
      setDisplayHalfNightData(timeSlots)
      setHalfNightGenerated(true)
      
      // Save to appropriate storage
      if (mode === 'draft') {
        await saveToIndexedDB()
      } else {
        saveToLocalStorage()
      }
      
      setLoading(false)
      
      toast({
        title: "Half Night Schedule Generated",
        description: mode === 'draft'
          ? "Half Night draft generated. Publish to make it live."
          : "Half Night schedule generated successfully.",
        variant: "default"
      })
    }, 1500)
  }
  
  const testGeminiAPI = async () => {
    setTestingAPI(true)
    try {
      const response = await fetch('/api/test-gemini')
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "API Test Successful",
          description: "Gemini API is configured correctly and responding.",
          variant: "default"
        })
      } else {
        let errorMsg = data.error || "Could not connect to Gemini API."
        if (data.details) {
          try {
            if (typeof data.details === 'object' && data.details.error) {
              const parsed = JSON.parse(data.details.error)
              if (parsed.error && parsed.error.message) {
                errorMsg = parsed.error.message
              }
            } else if (typeof data.details === 'string') {
              errorMsg = data.details
            }
          } catch (e) {}
        }
        
        toast({
          title: "API Test Failed",
          description: errorMsg,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "API Test Error",
        description: "Failed to connect to the test endpoint.",
        variant: "destructive"
      })
    } finally {
      setTestingAPI(false)
    }
  }

  const generateBibleVerses = async (index: number) => {
    if (!canEdit) return
    
    const slot = displayHalfNightData[index]
    if (!slot || !slot.prayerPoints || slot.prayerPoints.length === 0) {
      toast({
        title: "Missing Prayer Points",
        description: "Please add at least one prayer point first.",
        variant: "destructive"
      })
      return
    }
    
    setLoadingBibleVerse({ index })
    
    try {
      const prayerPoints = slot.prayerPoints
      const randomSeed = Math.floor(Math.random() * 10000)
      const eventType = slot.event.includes("OPENING") ? "Opening Prayer" : 
                       slot.event.includes("CLOSING") ? "Closing Prayer" : 
                       slot.event.includes("Prayer Session") ? "Prayer Session" : "Prayer"
      
      // Call our new server-side API route
      try {
        const response = await fetch('/api/generate-verses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prayerPoints,
            eventType,
            randomSeed
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          let errorMsg = errorData.error || `API failed with status ${response.status}`
          
          // Try to extract more specific error message from details if available
          try {
            if (errorData.details && typeof errorData.details === 'object' && errorData.details.error) {
              const parsed = JSON.parse(errorData.details.error)
              if (parsed.error && parsed.error.message) {
                errorMsg = parsed.error.message
              }
            } else if (errorData.details && typeof errorData.details === 'string') {
              errorMsg = errorData.details
            }
          } catch (e) {
            console.warn('Failed to parse error details:', e)
          }
          
          throw new Error(errorMsg)
        }
        
        const data = await response.json()
        const verseLines = data.verses || []
        
        // Fallback verses if API fails
        const fallbackVerses = [
          "Psalm 23:1-3", 
          "John 3:16", 
          "Philippians 4:6-7", 
          "Isaiah 41:10", 
          "Romans 8:28"
        ]
        
        const finalVerses = verseLines.length > 0 ? verseLines : fallbackVerses.slice(0, prayerPoints.length)
        
        // Update the schedule with generated verses
        const updatedSchedule = [...displayHalfNightData]
        updatedSchedule[index] = { ...updatedSchedule[index], bibleVerses: finalVerses }
        setDisplayHalfNightData(updatedSchedule)
        
        // Save to appropriate storage
        if (mode === 'draft') {
          await saveToIndexedDB()
        }
        
        toast({
          title: "Bible Verses Generated",
          description: `Bible verses generated successfully using ${data.model || 'Gemini'}.`,
          variant: "default"
        })
      } catch (error) {
        console.error('Error generating Bible verses:', error)
        
        // Use fallback verses on error
        const fallbackVerses = [
          "Psalm 23:1-3", 
          "John 3:16", 
          "Philippians 4:6-7"
        ]
        
        const updatedSchedule = [...displayHalfNightData]
        updatedSchedule[index] = { ...updatedSchedule[index], bibleVerses: fallbackVerses }
        setDisplayHalfNightData(updatedSchedule)
        
        // Save to appropriate storage
        if (mode === 'draft') {
          await saveToIndexedDB()
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        toast({
          title: "Using Fallback Verses",
          description: `Could not generate verses: ${errorMessage}. Using fallback verses.`,
          variant: "destructive"
        })
      }
    } catch (outerError) {
      console.error('Outer error in generateBibleVerses:', outerError)
    } finally {
      setLoadingBibleVerse(null)
    }
  }
  
  // Half Night handler functions
  const handleHalfNightCellClick = (index: number, field: 'prayerPoint' | 'bibleVerse' | 'member' | 'time' | 'leader', value: string) => {
    if (!canEdit) return
    setEditingHalfNightCell({ index, field })
    setHalfNightEditValue(value)
  }

  const handleHalfNightTimeClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canEdit) return
    const slot = displayHalfNightData[index]
    handleHalfNightCellClick(index, 'time', `${slot.start} - ${slot.end}`)
  }

  const handleHalfNightPrayerPointClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canEdit) return
    const slot = displayHalfNightData[index]
    handleHalfNightCellClick(index, 'prayerPoint', slot.prayerPoints?.join('\n') || '')
  }

  const handleHalfNightLeaderClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canEdit) return
    const slot = displayHalfNightData[index]
    handleHalfNightCellClick(index, 'leader', slot.leader)
  }

  const handleHalfNightCellEdit = async (index: number, field: 'prayerPoint' | 'bibleVerse' | 'member' | 'time' | 'leader', value: string) => {
    if (!canEdit) return
    
    const updatedSchedule = [...displayHalfNightData]
    if (field === 'prayerPoint') {
      updatedSchedule[index] = { ...updatedSchedule[index], prayerPoints: value.split('\n').filter(v => v.trim()) }
    } else if (field === 'bibleVerse') {
      updatedSchedule[index] = { ...updatedSchedule[index], bibleVerses: value.split('\n').filter(v => v.trim()) }
    } else if (field === 'member') {
      updatedSchedule[index] = { ...updatedSchedule[index], member: value }
    } else if (field === 'time') {
      const [start, end] = value.split(' - ').map(t => t.trim())
      updatedSchedule[index] = { ...updatedSchedule[index], start, end }
    } else if (field === 'leader') {
      updatedSchedule[index] = { ...updatedSchedule[index], leader: value }
    }
    
    setDisplayHalfNightData(updatedSchedule)
    
    // Save to appropriate storage
    if (mode === 'draft') {
      await saveToIndexedDB()
    }
  }
  
  const selectHalfNightMember = (memberName: string) => {
    if (showHalfNightDropdown !== null) {
      handleHalfNightCellEdit(showHalfNightDropdown.index, 'member', memberName)
      setShowHalfNightDropdown(null)
    }
  }
  
  const exportHalfNightToWord = async () => {
    if (!halfNightGenerated || !displayHalfNightData.length) {
      toast({
        title: "No Schedule",
        description: "Please generate a Half Night schedule first.",
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Exporting to Word",
      description: "Preparing Half Night schedule for Word export...",
      variant: "default"
    })
    
    try {
      const { DocxExportService } = await import('@/lib/docx-export')
      await DocxExportService.exportHalfNightSchedule(displayHalfNightData, {
        name: institutionDetails.institutionName,
        university: institutionDetails.universityName,
        location: institutionDetails.location,
        duration: institutionDetails.scheduleDuration
      }, halfNightDate)
      
      toast({
        title: "Export Complete",
        description: "Half Night schedule has been exported to Word.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error exporting to Word:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export to Word. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // 2. EXCEL-LIKE INTERACTION HANDLER
  const handleCellClick = (e: React.MouseEvent, index: number, field: 'leader' | 'word') => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Prevents "click outside" from firing immediately
    
    if (!canEdit || mode !== 'draft') return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Position the dropdown exactly where the cell is
    setShowDropdown({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      index,
      field
    });
    
    console.log('Dropdown positioned at:', { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY });
  };
  
  // 3. THE "SAVE & SYNC" HANDLER
  const updateAndSaveCell = async (index: number, field: 'leader' | 'word' | 'event', value: string) => {
    const updatedData = [...displayData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    
    // Update State (Immediate UI feedback)
    setDisplayData(updatedData);
    setShowDropdown(null);
    setEditingCell(null);

    // Persist (Background task)
    await persistDraft(updatedData, 'weekly');
    
    toast({
      title: "Cell Updated",
      description: `Assigned value to ${field}`,
    });
  };
  
  const handleCellEdit = async (index: number, field: 'leader' | 'word' | 'event', value: string) => {
    if (!canEdit) return
    
    const updatedData = [...displayData]
    updatedData[index] = {
      ...updatedData[index],
      [field]: value
    }
    
    setDisplayData(updatedData)
    
    // Save to IndexedDB if in draft mode
    if (mode === 'draft') {
      await saveToIndexedDB()
    }
    
    toast({
      title: "Cell Updated",
      description: `Custom text saved to ${field}`,
      variant: "default"
    })
  }
  
  const openCombinedNamesModal = (index: number, field: 'leader' | 'word', event: React.MouseEvent) => {
    if (!canEdit) return
    
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setShowCombinedNamesModal({
      x: rect.left,
      y: rect.bottom + window.scrollY,
      index,
      field
    })
    setSelectedPerson1("")
    setSelectedPerson2("")
  }
  
  // 4. COMBINE NAMES LOGIC
  const handleCombineNames = async () => {
    if (selectedPerson1 && selectedPerson2 && showCombinedNamesModal) {
      const combined = `${selectedPerson1} & ${selectedPerson2}`;
      await updateAndSaveCell(showCombinedNamesModal.index, showCombinedNamesModal.field, combined);
      setShowCombinedNamesModal(null);
      setSelectedPerson1("");
      setSelectedPerson2("");
    }
  };
  
  const saveConfiguration = () => {
    if (!canEdit) return
    
    // Save to localStorage
    localStorage.setItem("csf_institution", JSON.stringify(institutionDetails))
    localStorage.setItem("csf_members", JSON.stringify(members))
    
    // Save to Firestore for cross-device sync
    saveMembersAndInstitutionToFirestore()
    
    toast({
      title: "Configuration Saved",
      description: "Your institution details and members have been saved successfully and synced across devices.",
      variant: "default"
    })
  }
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return
    
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setInstitutionDetails(prev => ({
          ...prev,
          logoData: result
        }))
        toast({
          title: "Logo Uploaded",
          description: "CSF logo has been uploaded successfully.",
          variant: "default"
        })
      }
      reader.readAsDataURL(file)
    } else {
      toast({
        title: "Upload Error",
        description: "Please upload a valid image file.",
        variant: "destructive"
      })
    }
  }
  
  if (!mounted || !scheduleEnabled) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">CSF Schedule Creator</h1>
            {!canEdit && (
              <Badge variant="secondary" className="ml-2 text-xs sm:text-sm">View Only</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={saveConfiguration} className="h-8 w-8 sm:h-10 sm:w-auto px-2 sm:px-4">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Admin Control Panel */}
          {canEdit && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={mode === 'live' ? "default" : "secondary"} className="bg-emerald-600 text-white">
                    {mode === 'live' ? 'Viewing Live Schedule' : 'Editing Draft'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button 
                      variant={mode === 'live' ? "default" : "outline"}
                      size="sm"
                      onClick={switchToLive}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Live (Public)
                    </Button>
                    <Button 
                      variant={mode === 'draft' ? "default" : "outline"}
                      size="sm"
                      onClick={switchToDraft}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Draft (Private)
                    </Button>
                  </div>
                </div>
                
                {mode === 'draft' && (
                  <Button 
                    onClick={handlePublish} 
                    disabled={loading || (!displayData.length && !displayHalfNightData.length)} 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Publish to Live
                  </Button>
                )}
              </div>
              
              {mode === 'draft' && (
                <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                  <p>ðŸ“ You are editing a private draft. Changes are saved locally and will only be visible to you until you publish.</p>
                  <p>ðŸ‘¥ Regular users will continue seeing the live published schedule.</p>
                  <p>âš¡ This is lightweight and fast - no network calls while editing!</p>
                </div>
              )}
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger value="schedule" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:border-emerald-500 border border-transparent rounded-md p-2 transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm cursor-pointer">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Weekly Schedule</span>
                <span className="sm:hidden">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="halfnight" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:border-emerald-500 border border-transparent rounded-md p-2 transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm cursor-pointer">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Half Night Prayer</span>
                <span className="sm:hidden">Prayer</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule" className="space-y-6">
              {/* Institution Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Institution Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="institutionName">Institution Name</Label>
                      <Input
                        id="institutionName"
                        value={institutionDetails.institutionName}
                        onChange={(e) => setInstitutionDetails(prev => ({ ...prev, institutionName: e.target.value }))}
                        placeholder="e.g., Christian Students Fellowship"
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <Label htmlFor="universityName">University Name</Label>
                      <Input
                        id="universityName"
                        value={institutionDetails.universityName}
                        onChange={(e) => setInstitutionDetails(prev => ({ ...prev, universityName: e.target.value }))}
                        placeholder="e.g., Maharishi Markandeshwar University"
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={institutionDetails.location}
                        onChange={(e) => setInstitutionDetails(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Mullana, Ambala, Haryana"
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <Label htmlFor="startMonth">Start Month</Label>
                      <Select
                        value={institutionDetails.startMonth}
                        onValueChange={(value) => setInstitutionDetails(prev => ({ ...prev, startMonth: value }))}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="startYear">Start Year</Label>
                      <Input
                        id="startYear"
                        type="number"
                        value={institutionDetails.startYear}
                        onChange={(e) => setInstitutionDetails(prev => ({ ...prev, startYear: e.target.value }))}
                        placeholder="e.g., 2024"
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduleDuration">Duration (months)</Label>
                      <Select
                        value={institutionDetails.scheduleDuration}
                        onValueChange={(value) => setInstitutionDetails(prev => ({ ...prev, scheduleDuration: value }))}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 month</SelectItem>
                          <SelectItem value="2">2 months</SelectItem>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Logo Upload */}
                  <div>
                    <Label htmlFor="logoUpload">CSF Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          id="logoUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={!canEdit}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logoUpload')?.click()}
                          disabled={!canEdit}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {institutionDetails.logoData ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                      </div>
                      {institutionDetails.logoData && (
                        <div className="w-16 h-16 border rounded overflow-hidden">
                          <img src={institutionDetails.logoData} alt="CSF Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Member Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Member Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canEdit && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter member name"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addMember()}
                        className="flex-1"
                      />
                      <Button onClick={addMember}>
                        Add +
                      </Button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                      >
                        <span className="truncate">{member.name}</span>
                        {canEdit && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Schedule Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Schedule Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center">
                    {canEdit && (
                      <Button onClick={generateSchedule} disabled={loading} className="w-full sm:w-auto">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">Generate Schedule</span>
                      </Button>
                    )}
                    {canEdit && (
                      <Button onClick={handlePublish} disabled={loading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="text-sm">Publish Changes</span>
                      </Button>
                    )}
                    <Button onClick={exportToWord} disabled={!scheduleGenerated || loading} variant="secondary" className="w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-2" />
                      <span className="text-sm">Export to Word</span>
                    </Button>
                    {canEdit && (
                      <Button onClick={clearAllData} variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="text-sm">Clear All</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {!canEdit && (scheduleGenerated || halfNightGenerated) && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Published Schedules Available
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {scheduleGenerated && halfNightGenerated 
                            ? "Both Weekly and Half-Night prayer schedules have been published for viewing."
                            : scheduleGenerated 
                            ? "Weekly schedule has been published for viewing."
                            : "Half-Night prayer schedule has been published for viewing."
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Schedule Display */}
              {scheduleGenerated && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm sm:text-base">Generated Weekly Schedule</CardTitle>
                      {canEdit && (
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Admin Edit Mode Enabled
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Institution Header */}
                    <div className="text-center mb-6 print-container">
                      {institutionDetails.logoData && (
                        <div className="flex justify-center mb-4">
                          <img src={institutionDetails.logoData} alt="Fellowship Logo" className="h-20 object-contain" />
                        </div>
                      )}
                      <h2 className="text-xl sm:text-2xl font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                        {institutionDetails.institutionName}
                      </h2>
                      <h3 className="text-lg sm:text-xl mb-1 text-gray-700 dark:text-gray-300">
                        {institutionDetails.universityName}
                      </h3>
                      <p className="text-base sm:text-lg mb-3 text-gray-600 dark:text-gray-400">
                        {institutionDetails.location}
                      </p>
                      <h4 className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400 underline">
                        WEEKLY SCHEDULE_{new Date(parseInt(institutionDetails.startYear), parseInt(institutionDetails.startMonth) - 1, 1).toLocaleString('default', { month: 'long' }).toUpperCase()}{parseInt(institutionDetails.scheduleDuration) > 1 ? ` - ${new Date(parseInt(institutionDetails.startYear), parseInt(institutionDetails.startMonth) - 1 + (parseInt(institutionDetails.scheduleDuration) - 1), 1).toLocaleString('default', { month: 'long' }).toUpperCase()}` : ''} {institutionDetails.startYear}
                      </h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-700 text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                            <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center font-bold text-emerald-700 dark:text-emerald-400">Month</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-left font-bold text-emerald-700 dark:text-emerald-400">Date</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-left font-bold text-emerald-700 dark:text-emerald-400">Weekday</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center font-bold text-emerald-700 dark:text-emerald-400 w-48">Event</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-left font-bold text-emerald-700 dark:text-emerald-400">Person leading</th>
                            <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-left font-bold text-emerald-700 dark:text-emerald-400">Person sharing the word</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.map((item, index) => {
                            const monthCounts = displayData.reduce((acc, curr) => {
                              const my = curr.date.split('/').slice(1).join('/');
                              acc[my] = (acc[my] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            const currentDate = new Date(parseInt(item.date.split('/')[2]), parseInt(item.date.split('/')[1]) - 1, parseInt(item.date.split('/')[0]))
                            const monthYearStr = item.date.split('/').slice(1).join('/')
                            const isFirstOfMonthData = index === 0 || displayData[index - 1].date.split('/').slice(1).join('/') !== monthYearStr
                            const rowSpanCount = monthCounts[monthYearStr]
                            
                            const isMergedRow = item.event === "BIBLE STUDIES" || item.event === "PRAYER & FASTING" || item.event === "REVIVAL & DELIVERANCE" || item.event === "HALF NIGHT" || item.event === "Leaders' & 10PM Prayer"
                            const isThursdayEvent = item.event === "PRAYER & FASTING" || item.event === "REVIVAL & DELIVERANCE"
                            const isSentenceCaseMerge = item.event === "Leaders' & 10PM Prayer" || isThursdayEvent

                            const isSpecial = item.special && [
                              "BIBLE STUDIES", "HALF NIGHT", "BIBLE DISCUSSIONS", 
                              "PRAYER & FASTING", "INTERCESSORY DEPARTMENT"
                            ].includes(item.special)
                            
                            const isCombinedNames = item.special === "COMBINED_NAMES"
                            const isPrayerFasting = item.special === "PRAYER & FASTING"
                            const isOptionalDay = item.special && (
                              item.special === "MONDAY_OPTIONAL" || item.special === "FRIDAY_OPTIONAL"
                            )
                            
                            // Check if this is a month separator (first day of a new month and not the first entry)
                            const isFirstOfMonth = currentDate.getDate() === 1
                            const showMonthSeparator = isFirstOfMonth && index > 0
                            
                            return (
                              <React.Fragment key={index}>
                                {showMonthSeparator && (
                                  <tr>
                                    <td colSpan={6} className="border-0 p-0">
                                      <div className="h-4 bg-transparent border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-1"></div>
                                    </td>
                                  </tr>
                                )}
                                <tr className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                                  {isFirstOfMonthData && (
                                    <td rowSpan={rowSpanCount} className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-lg sm:text-xl font-black text-center align-middle uppercase text-emerald-800 dark:text-emerald-400">
                                      {currentDate.toLocaleString('default', { month: 'short' })}
                                    </td>
                                  )}
                                  <td className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-xs sm:text-sm">{item.date}</td>
                                  <td className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium">{item.day}</td>
                                  
                                  {/* Event Column */}
                                  <td 
                                    className={`border border-gray-300 dark:border-gray-700 p-0 text-center tracking-wider ${item.event ? 'bg-red-50 dark:bg-red-900/20' : ''} ${item.event === "Leaders' & 10PM Prayer" ? '' : 'uppercase'}`}
                                    onClick={() => {
                                      if (canEdit && mode === 'draft') {
                                        setEditingCell({ index, field: 'event' })
                                        setEditValue(item.event || "")
                                      }
                                    }}
                                  >
                                    <div className={`p-2 font-bold text-xs sm:text-sm min-h-[40px] flex items-center justify-center ${canEdit && mode === 'draft' ? 'cursor-text hover:bg-black/5 dark:hover:bg-white/5' : ''}`}>
                                      {item.event ? (
                                        <span className={`text-red-600 dark:text-red-400 ${item.event === "Sunday Service" || item.event === "Leaders' & 10PM Prayer" ? '' : 'uppercase'}`}>
                                          {item.event}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic">-</span>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Person Leading Column */}
                                  <td colSpan={isMergedRow ? 2 : 1} className={`border border-gray-300 dark:border-gray-700 p-0 ${isMergedRow ? 'text-center' : ''} ${isSpecial || isMergedRow ? 'bg-red-50 dark:bg-red-900/20' : ''} ${isOptionalDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    {canEdit && mode === 'draft' ? (
                                      <EditableCell
                                        value={item.leader}
                                        onValueChange={(value) => {
                                          const newData = [...displayData]
                                          newData[index].leader = value
                                          setDisplayData(newData)
                                        }}
                                        options={[
                                          ...members.map(m => m.name),
                                          "BIBLE STUDY DEPARTMENT",
                                        ]}
                                        placeholder="Click to assign"
                                        showDropdownArrow={!isMergedRow}
                                      />
                                    ) : (
                                      <div className={`p-2 text-xs sm:text-sm ${isMergedRow ? 'flex justify-center items-center h-full' : ''}`}>
                                        {isMergedRow || (item.leader && (item.leader === "BIBLE STUDIES" || item.leader === "HALF NIGHT" || item.leader === "PRAYER & FASTING")) ? (
                                          <span className={`${isThursdayEvent ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'} font-bold ${isSentenceCaseMerge ? '' : 'uppercase'}`}>
                                            {item.event === "Leaders' & 10PM Prayer" ? (
                                              item.leader.split(/(\s?\(.*?\)\s?&\s?|\s?\(.*?\)$)/g).map((part, i) => (
                                                <span key={i} className={i % 2 === 0 ? "text-gray-900 dark:text-gray-100" : "text-red-600 dark:text-red-400"}>
                                                  {part}
                                                </span>
                                              ))
                                            ) : (
                                              item.leader
                                            )}
                                          </span>
                                        ) : item.leader && item.leader.includes(" & ") ? (
                                          <span className={item.day === "Thursday" ? "text-gray-900 dark:text-gray-100" : "text-red-600 dark:text-red-400"}>{item.leader}</span>
                                        ) : (
                                          <span className={isOptionalDay ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}>
                                            {item.leader || <span className="text-gray-400 italic">-</span>}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  
                                  {/* Person Sharing Column */}
                                  {!isMergedRow && (
                                    <td className={`border border-gray-300 dark:border-gray-700 p-0 ${isSpecial || isCombinedNames ? 'bg-red-50 dark:bg-red-900/20' : ''} ${isOptionalDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                      {canEdit && mode === 'draft' ? (
                                        <EditableCell
                                          value={item.word}
                                          onValueChange={(value) => {
                                            const newData = [...displayData]
                                            newData[index].word = value
                                            setDisplayData(newData)
                                          }}
                                          options={[
                                            ...members.map(m => m.name),
                                          ]}
                                          placeholder={item.day === 'Saturday' ? "Optional for Saturday" : "Click to assign"}
                                          showDropdownArrow={true}
                                        />
                                      ) : (
                                        <div className="p-2 text-xs sm:text-sm">
                                          {item.word && (item.word === "DISCUSSION" || item.word === "INTERCESSORY DEPARTMENT" || item.word === "HALF NIGHT") ? (
                                            <span className="text-red-600 dark:text-red-400 font-bold uppercase">{item.word}</span>
                                          ) : item.word && item.word.includes(" & ") ? (
                                            <span className={item.day === "Thursday" ? "text-gray-900 dark:text-gray-100" : "text-red-600 dark:text-red-400"}>{item.word}</span>
                                          ) : (
                                            <span className={isOptionalDay ? 'text-blue-600 dark:text-blue-400' : ''}>
                                              {item.word || <span className="text-gray-400 italic">-</span>}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="halfnight" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Half Night of Prayer Schedule</CardTitle>
                    {halfNightGenerated && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Schedule Generated
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <Input
                        type="date"
                        value={halfNightDate}
                        onChange={(e) => canEdit && setHalfNightDate(e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <Input
                        type="time"
                        value={halfNightStartTime}
                        onChange={(e) => canEdit && setHalfNightStartTime(e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <Input
                        type="time"
                        value={halfNightEndTime}
                        onChange={(e) => canEdit && setHalfNightEndTime(e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  
                  {canEdit && (
                    <div className="flex flex-wrap gap-4 mb-6">
                      <Button onClick={generateHalfNightSchedule} disabled={loading}>
                        {loading ? "Generating..." : "Generate Half Night Schedule"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={testGeminiAPI} 
                        disabled={testingAPI}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {testingAPI ? "Testing..." : "Test Gemini API"}
                      </Button>
                      {halfNightGenerated && (
                        <Button onClick={handlePublish} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                          <Upload className="h-4 w-4 mr-2" />
                          Publish Both Schedules
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Half Night Schedule Display */}
                  {halfNightGenerated && displayHalfNightData.length > 0 && (
                    <div className="mt-6">
                      <div className="text-center mb-6">
                        {institutionDetails.logoData && (
                          <div className="flex justify-center mb-4">
                            <img src={institutionDetails.logoData} alt="Fellowship Logo" className="h-20 object-contain" />
                          </div>
                        )}
                        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                          {institutionDetails.institutionName}
                        </h2>
                        <h3 className="text-lg sm:text-xl mb-1 text-gray-700 dark:text-gray-300">
                          {institutionDetails.universityName}
                        </h3>
                        <p className="text-base sm:text-lg mb-3 text-gray-600 dark:text-gray-400">
                          {institutionDetails.location}
                        </p>
                        <h4 className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400 mb-4">HALF NIGHT OF PRAYER</h4>
                        <p className="text-base sm:text-lg mb-4 text-gray-600 dark:text-gray-400">
                          {new Date(halfNightDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          }).toUpperCase()}
                        </p>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700 text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-gray-200 dark:bg-gray-800">
                              <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center font-bold">TIME</th>
                              <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center font-bold">SESSION</th>
                              <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center font-bold">SCRIPTURAL REFERENCE</th>
                              <th className="border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center font-bold">STEWARD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayHalfNightData.map((slot: any, index: number) => {
                              const isPrayerSession = slot.isPrayer || slot.isSpecial
                              const isSpecialEvent = slot.isSpecial
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/10">
                                  <td 
                                    className={`border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center ${canEdit ? 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : ''}`}
                                    onClick={(e) => canEdit && handleHalfNightTimeClick(index, e)}
                                  >
                                    {editingHalfNightCell?.index === index && editingHalfNightCell?.field === 'time' ? (
                                      <input
                                        type="text"
                                        value={halfNightEditValue}
                                        onChange={(e) => setHalfNightEditValue(e.target.value)}
                                        onBlur={() => handleHalfNightCellEdit(index, 'time', halfNightEditValue)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleHalfNightCellEdit(index, 'time', halfNightEditValue)
                                          }
                                        }}
                                        placeholder="e.g., 9:00 PM - 9:20 PM"
                                        className="w-full text-center text-sm border rounded px-1"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-1 rounded" 
                                            onClick={() => canEdit && handleHalfNightCellClick(index, 'time', `${slot.start} - ${slot.end}`)}>
                                        {slot.start} - {slot.end}
                                      </span>
                                    )}
                                  </td>
                                  {(() => {
                                    const isSpecialSessionType = slot.event === "OPENING PRAYER" || 
                                                                 slot.event === "WORSHIP" || 
                                                                 slot.event === "WORD SHARING" || 
                                                                 slot.event === "CLOSING PRAYER"
                                    return (
                                      <td className={`border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 ${isPrayerSession ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''} ${canEdit && !isSpecialSessionType ? 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : ''}`}>
                                        <div className={`font-medium ${isPrayerSession ? 'font-bold' : ''} ${isSpecialSessionType ? 'text-red-600 dark:text-red-400 font-bold uppercase' : ''}`}>
                                          {editingHalfNightCell?.index === index && editingHalfNightCell?.field === 'sessionName' ? (
                                            <input
                                              type="text"
                                              value={halfNightEditValue}
                                              onChange={(e) => setHalfNightEditValue(e.target.value)}
                                              onBlur={() => {
                                                const newData = [...displayHalfNightData]
                                                newData[index].event = halfNightEditValue.trim() || slot.event
                                                setDisplayHalfNightData(newData)
                                                setEditingHalfNightCell(null)
                                                setHalfNightEditValue('')
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const newData = [...displayHalfNightData]
                                                  newData[index].event = halfNightEditValue.trim() || slot.event
                                                  setDisplayHalfNightData(newData)
                                                  setEditingHalfNightCell(null)
                                                  setHalfNightEditValue('')
                                                }
                                              }}
                                              className="w-full text-sm border rounded px-1"
                                              autoFocus
                                            />
                                          ) : (
                                            <span onClick={(e) => canEdit && !isSpecialSessionType && setEditingHalfNightCell({ index, field: 'sessionName' })}>
                                              {slot.event}
                                            </span>
                                          )}
                                        </div>
                                        {/* Prayer Points Below Session */}
                                        {(isPrayerSession || slot.isSpecial) && (
                                          <div className="mt-2">
                                            {editingHalfNightCell?.index === index && editingHalfNightCell?.field === 'prayerPoint' ? (
                                              <textarea
                                                value={halfNightEditValue}
                                                onChange={(e) => setHalfNightEditValue(e.target.value)}
                                                onBlur={() => handleHalfNightCellEdit(index, 'prayerPoint', halfNightEditValue)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleHalfNightCellEdit(index, 'prayerPoint', halfNightEditValue)
                                                  }
                                                }}
                                                className="w-full text-sm border rounded p-1 min-h-[60px]"
                                                placeholder="Type prayer points here...&#10;Press Enter for new bullet"
                                                autoFocus
                                              />
                                            ) : (
                                              <ul className="list-disc pl-4 space-y-1">
                                                {slot.prayerPoints && slot.prayerPoints.length > 0 ? (
                                                  slot.prayerPoints.map((point: string, pointIndex: number) => (
                                                    <li key={pointIndex} className="text-xs sm:text-sm">{point}</li>
                                                  ))
                                                ) : (
                                                  <li className="text-xs sm:text-sm text-gray-500 italic cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" 
                                                      onClick={(e) => canEdit && handleHalfNightPrayerPointClick(index, e)}>
                                                    Click to add prayer points
                                                  </li>
                                                )}
                                              </ul>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    )
                                  })()}
                                  <td className={`border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 ${isPrayerSession ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}`}>
                                    {/* SCRIPTURAL REFERENCE Column */}
                                    {(isPrayerSession || slot.isSpecial) && (
                                      <div className="space-y-1">
                                        {editingHalfNightCell?.index === index && editingHalfNightCell?.field === 'bibleVerse' ? (
                                          <textarea
                                            value={halfNightEditValue}
                                            onChange={(e) => setHalfNightEditValue(e.target.value)}
                                            onBlur={() => {
                                              if (halfNightEditValue.trim()) {
                                                handleHalfNightCellEdit(index, 'bibleVerse', halfNightEditValue)
                                              }
                                              setEditingHalfNightCell(null)
                                              setHalfNightEditValue('')
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                if (halfNightEditValue.trim()) {
                                                  handleHalfNightCellEdit(index, 'bibleVerse', halfNightEditValue)
                                                }
                                                setEditingHalfNightCell(null)
                                                setHalfNightEditValue('')
                                              }
                                            }}
                                            className="w-full text-sm border rounded p-1 min-h-[60px]"
                                            placeholder="Type Bible verses here..."
                                            autoFocus
                                          />
                                        ) : (
                                          <div className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded text-xs sm:text-sm" 
                                               onClick={() => { if (canEdit) { setEditingHalfNightCell({ index, field: 'bibleVerse' }); setHalfNightEditValue(''); } }}>
                                            {slot.bibleVerses && slot.bibleVerses.length > 0 ? (
                                              <ul className="list-disc pl-4">
                                                {slot.bibleVerses.map((verse: string, verseIndex: number) => (
                                                  <li key={verseIndex}>{verse}</li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <div className="space-y-1 text-gray-500 italic">
                                                <li className="list-disc list-inside">Bible verse will appear here</li>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {(isPrayerSession || slot.isSpecial) && canEdit && (
                                      <button
                                        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                        onClick={() => generateBibleVerses(index)}
                                        disabled={loadingBibleVerse?.index === index}
                                      >
                                        {loadingBibleVerse?.index === index ? 'Generating...' : 'Generate Verses'}
                                      </button>
                                    )}
                                  </td>

                                  {/* STEWARD Column */}
                                  {(() => {
                                    const isWorship = slot.event === "WORSHIP"
                                    const isSpecialSessionType = slot.event === "OPENING PRAYER" || 
                                                                 slot.event === "WORSHIP" || 
                                                                 slot.event === "WORD SHARING" || 
                                                                 slot.event === "CLOSING PRAYER"
                                    return (
                                      <td 
                                        className={`border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center ${canEdit && !isWorship ? 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : ''}`}
                                        onClick={(e) => canEdit && !isWorship && handleHalfNightLeaderClick(index, e)}
                                      >
                                        {editingHalfNightCell?.index === index && editingHalfNightCell?.field === 'leader' ? (
                                          <Input
                                            value={halfNightEditValue}
                                            onChange={(e) => setHalfNightEditValue(e.target.value)}
                                            onBlur={() => handleHalfNightCellEdit(index, 'leader', halfNightEditValue)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleHalfNightCellEdit(index, 'leader', halfNightEditValue)
                                              }
                                            }}
                                            className="w-full text-center text-sm"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className={`${isWorship || isSpecialSessionType ? 'text-red-600 dark:text-red-400 font-bold uppercase' : ''}`}>
                                            {slot.leader}
                                          </span>
                                        )}
                                      </td>
                                    )
                                  })()}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap gap-4 justify-center">
                        {canEdit && (
                          <Button 
                            onClick={() => {
                              const newRow = {
                                start: "",
                                end: "",
                                event: "NEW EVENT",
                                leader: members.filter(m => 
                                  !["Leadership slot", "PRAYER & FASTING", "WORSHIP NIGHT",
                                  "CHOIR DEPARTMENT", "HALF NIGHT", "INTERCESSORY DEPARTMENT"].includes(m.name)
                                )[0]?.name || "Member",
                                prayerPoints: [],
                                bibleVerses: []
                              }
                              setDisplayHalfNightData([...displayHalfNightData, newRow])
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4" />
                            Add Row
                          </Button>
                        )}
                        <Button onClick={exportHalfNightToWord} className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Export to Word
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-semibold">{loadingText}</p>
          </div>
        </div>
      )}
      
      {/* FLOATING EXCEL DROPDOWN */}
      {showDropdown && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-900 shadow-xl border rounded-lg p-2 min-w-[200px]"
          style={{ top: showDropdown.y, left: showDropdown.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <div className="text-xs font-bold text-gray-400 mb-2 px-2 uppercase tracking-tighter">
            Assign to {showDropdown.field}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {members.filter(member => 
              !["Leadership slot", "PRAYER & FASTING", "WORSHIP NIGHT",
              "CHOIR DEPARTMENT", "HALF NIGHT", "INTERCESSORY DEPARTMENT"].includes(member.name)
            ).map((member) => (
              <button 
                key={member.id}
                className="w-full text-left p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900 rounded text-sm"
                onClick={() => updateAndSaveCell(showDropdown!.index, showDropdown!.field, member.name)}
              >
                {member.name}
              </button>
            ))}
          </div>
          <hr className="my-2" />
          <button 
            className="w-full text-left p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium"
            onClick={() => {
               setShowCombinedNamesModal(showDropdown);
               setShowDropdown(null);
            }}
          >
            Combine Two Names...
          </button>
          <button 
            className="w-full text-left p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium"
            onClick={() => {
              setEditingCell({ index: showDropdown!.index, field: showDropdown!.field })
              setEditValue(displayData[showDropdown!.index][showDropdown!.field] || '')
              setShowDropdown(null)
            }}
          >
            Custom Text...
          </button>
          <button 
            className="w-full text-left p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
            onClick={() => updateAndSaveCell(showDropdown!.index, showDropdown!.field, "")}
          >
            Clear Cell
          </button>
        </div>
      )}
      
      {/* Combined Names Modal */}
      {showCombinedNamesModal && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Select Combined Names</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="person1">Person 1</Label>
                <Select value={selectedPerson1} onValueChange={setSelectedPerson1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first person" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.filter(member => 
                      !["Leadership slot", "PRAYER & FASTING", "WORSHIP NIGHT",
                      "CHOIR DEPARTMENT", "HALF NIGHT", "INTERCESSORY DEPARTMENT"].includes(member.name)
                    ).map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="person2">Person 2 (Optional)</Label>
                <Select value={selectedPerson2} onValueChange={setSelectedPerson2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second person (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {members.filter(member => 
                      !["Leadership slot", "PRAYER & FASTING", "WORSHIP NIGHT",
                      "CHOIR DEPARTMENT", "HALF NIGHT", "INTERCESSORY DEPARTMENT"].includes(member.name) && member.name !== selectedPerson1
                    ).map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPerson1 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-700">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Preview: {selectedPerson1}{selectedPerson2 ? ` & ${selectedPerson2}` : ''}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCombinedNamesModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleCombineNames} disabled={!selectedPerson1}>
                Select
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Entry Modal */}
      {editingCell && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Custom Entry</h3>
            <Input
              placeholder="Enter custom text..."
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellEdit(editingCell.index, editingCell.field, editValue)
                  setEditingCell(null)
                } else if (e.key === 'Escape') {
                  setEditingCell(null)
                }
              }}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCell(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleCellEdit(editingCell.index, editingCell.field, editValue)
                setEditingCell(null)
              }}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(null)}
        />
      )}
      
      {/* Click outside to close combined names modal */}
      {showCombinedNamesModal && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCombinedNamesModal(null)}
        />
      )}
      
      {/* Click outside to close custom entry modal */}
      {editingCell && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setEditingCell(null)}
        />
      )}
    </div>
  )
}

export default ScheduleCreator


