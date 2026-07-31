"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, getDoc } from "firebase/firestore"
import { Calendar, Lock, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCachedData, CACHE_TTL, CACHE_KEYS } from "@/lib/firestore-cache"

interface ScheduleItem {
  date: string
  day: string
  event?: string
  leader: string
  word: string
  special?: string
}

interface HalfNightItem {
  start: string
  end: string
  event: string
  leader: string
  isSpecial?: boolean
  isPrayer?: boolean
  prayerPoints?: string[]
  bibleVerses?: string[]
}

export default function SchedulePage() {
  const router = useRouter()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [halfNightSchedule, setHalfNightSchedule] = useState<HalfNightItem[]>([])
  const [halfNightDate, setHalfNightDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'weekly' | 'halfnight'>('weekly')

  useEffect(() => {
    // Load cached schedule from localStorage first (for offline access)
    const loadCachedSchedule = () => {
      try {
        const cached = localStorage.getItem('csf_schedule_cache')
        if (cached) {
          const data = JSON.parse(cached)
          setSchedule(data.items || [])
          setHalfNightSchedule(data.halfNightSchedule || [])
          setHalfNightDate(data.halfNightDate || '')
          setLastUpdated(new Date(data.timestamp))
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading cached schedule:', error)
      }
    }
    loadCachedSchedule()

    // Listen to published schedule from Firestore with caching
    if (!db) {
      console.error('Firestore not initialized')
      setLoading(false)
      return
    }
    
    const loadScheduleData = async () => {
      try {
        const data = await getCachedData(
          CACHE_KEYS.ADMIN_STATS + ":schedule", // Reuse key pattern or create new one
          async () => {
            const scheduleRef = doc(db!, "csf_schedules", "weekly_active")
            const docSnap = await getDoc(scheduleRef)
            if (docSnap.exists()) {
              return docSnap.data()
            }
            return { items: [], halfNightSchedule: [], halfNightDate: '' }
          },
          CACHE_TTL.HOMEPAGE_SECTIONS
        )
        
        if (data) {
          setSchedule(data.items || [])
          setHalfNightSchedule(data.halfNightSchedule || [])
          setHalfNightDate(data.halfNightDate || '')
          setLastUpdated(new Date())
          
          // Cache the schedule for offline access
          try {
            localStorage.setItem('csf_schedule_cache', JSON.stringify({
              items: data.items || [],
              halfNightSchedule: data.halfNightSchedule || [],
              halfNightDate: data.halfNightDate || '',
              timestamp: new Date().toISOString()
            }))
          } catch (error) {
            console.error('Error caching schedule:', error)
          }
        }
      } catch (error) {
        console.error("Error loading schedule:", error)
      } finally {
        setLoading(false)
      }
    }

    loadScheduleData()
    
    // Also keep the real-time listener for live updates, but only if not in SSR
    const scheduleRef = doc(db!, "csf_schedules", "weekly_active")
    const unsubscribe = onSnapshot(
      scheduleRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSchedule(data.items || [])
          setHalfNightSchedule(data.halfNightSchedule || [])
          setHalfNightDate(data.halfNightDate || '')
          // No need to setLastUpdated here if we want to avoid re-renders
        }
      }
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isScheduleAvailable = schedule.length > 0 || halfNightSchedule.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-red-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-red-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
          <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-3">
            <Calendar className="h-10 w-10" />
            CSF Schedule
          </h1>
          <p className="text-lg text-red-100 mb-4">
            View the current weekly and half-night prayer schedules
          </p>
          {lastUpdated && (
            <p className="text-sm text-red-200">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        {!isScheduleAvailable ? (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-gray-700">
              No schedule has been published yet. Please check back later.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
                  activeTab === 'weekly'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Weekly Schedule
              </button>
              <button
                onClick={() => setActiveTab('halfnight')}
                className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
                  activeTab === 'halfnight'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Half Night Schedule
              </button>
            </div>

            {/* Weekly Schedule */}
            {activeTab === 'weekly' && (
              <div className="space-y-4">
                {schedule.length === 0 ? (
                  <Card className="border-2 border-gray-200">
                    <CardContent className="pt-8 pb-8 text-center text-gray-600">
                      No weekly schedule available yet.
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border-2 border-gray-400">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-400">
                            <th className="border-r-2 border-gray-400 px-6 py-4 text-center font-bold text-gray-900">Month</th>
                            <th className="border-r-2 border-gray-400 px-6 py-4 text-left font-bold text-gray-900">Date</th>
                            <th className="border-r-2 border-gray-400 px-6 py-4 text-left font-bold text-gray-900">Day</th>
                            <th className="border-r-2 border-gray-400 px-6 py-4 text-center font-bold text-gray-900">Event</th>
                            <th className="border-r-2 border-gray-400 px-6 py-4 text-left font-bold text-gray-900">Leader</th>
                            <th className="px-6 py-4 text-left font-bold text-gray-900">Word/Sharing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {schedule.map((item, idx) => {
                            const monthCounts = schedule.reduce((acc, curr) => {
                              const my = curr.date.split('/').slice(1).join('/');
                              acc[my] = (acc[my] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            const currentDate = new Date(parseInt(item.date.split('/')[2]), parseInt(item.date.split('/')[1]) - 1, parseInt(item.date.split('/')[0]))
                            const monthYearStr = item.date.split('/').slice(1).join('/')
                            const isFirstOfMonthData = idx === 0 || schedule[idx - 1].date.split('/').slice(1).join('/') !== monthYearStr
                            const rowSpanCount = monthCounts[monthYearStr]
                            
                            const isMergedRow = item.event === "BIBLE STUDIES" || item.event === "PRAYER & FASTING" || item.event === "REVIVAL & DELIVERANCE" || item.event === "HALF NIGHT" || item.event === "Leaders' & 10PM Prayer"
                            const isThursdayEvent = item.event === "PRAYER & FASTING" || item.event === "REVIVAL & DELIVERANCE"
                            const isSentenceCaseMerge = item.event === "Leaders' & 10PM Prayer" || isThursdayEvent
                            
                            const hasSpecialText = item.event || item.leader && (item.leader === "BIBLE STUDIES" || item.leader === "HALF NIGHT" || item.leader === "PRAYER & FASTING") 
                              || item.word && (item.word === "DISCUSSION" || item.word === "INTERCESSORY DEPARTMENT" || item.word === "HALF NIGHT")
                            const hasCombinedNames = (item.leader || item.word) && (item.leader?.includes(" & ") || item.word?.includes(" & "))

                            const isFirstOfMonth = currentDate.getDate() === 1
                            const showMonthSeparator = isFirstOfMonth && idx > 0

                            return (
                              <React.Fragment key={idx}>
                                {showMonthSeparator && (
                                  <tr>
                                    <td colSpan={6} className="border-0 p-0">
                                      <div className="h-4 bg-transparent border-t-2 border-dashed border-gray-300 my-1"></div>
                                    </td>
                                  </tr>
                                )}
                                <tr
                                  className={hasSpecialText || hasCombinedNames ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}
                                >
                                  {isFirstOfMonthData && (
                                    <td rowSpan={rowSpanCount} className="border-r-2 border-b-2 border-gray-400 px-6 py-4 text-xl font-black text-center align-middle uppercase text-gray-900">
                                      {currentDate.toLocaleString('default', { month: 'short' })}
                                    </td>
                                  )}
                                  <td className="border-r-2 border-b-2 border-gray-400 px-6 py-4 font-medium text-gray-900">{item.date}</td>
                                  <td className="border-r-2 border-b-2 border-gray-400 px-6 py-4 text-gray-700 font-medium">{item.day}</td>
                                  <td className={`border-r-2 border-b-2 border-gray-400 px-6 py-4 text-center tracking-wider ${item.event ? 'text-red-700 font-bold' : 'text-gray-400'} ${item.event === "Sunday Service" || item.event === "Leaders' & 10PM Prayer" ? '' : 'uppercase'}`}>
                                    {item.event || "-"}
                                  </td>
                                  <td colSpan={isMergedRow ? 2 : 1} className={`border-r-2 border-b-2 border-gray-400 px-6 py-4 ${isMergedRow ? 'text-center' : ''}`}>
                                    {isMergedRow || (item.leader && (item.leader === "BIBLE STUDIES" || item.leader === "HALF NIGHT" || item.leader === "PRAYER & FASTING")) ? (
                                      <span className={`${isThursdayEvent ? 'text-gray-900' : 'text-red-700'} font-bold ${isSentenceCaseMerge ? '' : 'uppercase'}`}>
                                        {item.event === "Leaders' & 10PM Prayer" ? (
                                          item.leader.split(/(\s?\(.*?\)\s?&\s?|\s?\(.*?\)$)/g).map((part, i) => (
                                            <span key={i} className={i % 2 === 0 ? "text-gray-900" : "text-red-700"}>
                                              {part}
                                            </span>
                                          ))
                                        ) : (
                                          item.leader
                                        )}
                                      </span>
                                    ) : item.leader && item.leader.includes(" & ") ? (
                                      <span className={item.day === "Thursday" ? "text-gray-900" : "text-red-700"}>{item.leader}</span>
                                    ) : (
                                      <span className="text-gray-700">{item.leader || "-"}</span>
                                    )}
                                  </td>
                                  {!isMergedRow && (
                                    <td className="border-b-2 border-gray-400 px-6 py-4">
                                      {item.word && (item.word === "DISCUSSION" || item.word === "INTERCESSORY DEPARTMENT" || item.word === "HALF NIGHT") ? (
                                        <span className="text-red-700 font-bold uppercase">{item.word}</span>
                                      ) : item.word && item.word.includes(" & ") ? (
                                        <span className={item.day === "Thursday" ? "text-gray-900" : "text-red-700"}>{item.word}</span>
                                      ) : (
                                        <span className="text-gray-700">{item.word || "-"}</span>
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
                  </>
                )}
              </div>
            )}

            {/* Half Night Schedule */}
            {activeTab === 'halfnight' && (
              <div className="space-y-8">
                {halfNightSchedule.length === 0 ? (
                  <Card className="border-2 border-gray-200">
                    <CardContent className="pt-8 pb-8 text-center text-gray-600">
                      No half-night schedule available yet.
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Date Header */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-red-600 uppercase">
                        HALF NIGHT OF PRAYER
                      </h2>
                      {halfNightDate && (
                        <p className="text-lg text-gray-700 mt-2">
                          {new Date(halfNightDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          }).toUpperCase()}
                        </p>
                      )}
                    </div>
                    
                    {/* Schedule Table */}
                    <div className="overflow-x-auto rounded-lg border-2 border-gray-400">
                      <table className="w-full text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-400">
                            <th className="border-r-2 border-gray-400 px-3 sm:px-4 py-3 text-left font-bold text-gray-900 whitespace-nowrap">TIME</th>
                            <th className="border-r-2 border-gray-400 px-3 sm:px-4 py-3 text-left font-bold text-gray-900 whitespace-nowrap">SESSION</th>
                            <th className="border-r-2 border-gray-400 px-3 sm:px-4 py-3 text-left font-bold text-gray-900 whitespace-nowrap">SCRIPTURAL REFERENCE</th>
                            <th className="px-3 sm:px-4 py-3 text-left font-bold text-gray-900 whitespace-nowrap">STEWARD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {halfNightSchedule.map((item, idx) => {
                            const isSpecialEvent = item.event && (
                              item.event === "WORD SHARING" || 
                              item.event === "OPENING PRAYER" || 
                              item.event === "CLOSING PRAYER" ||
                              item.event === "WORSHIP"
                            )
                            const bibleVersesText = item.bibleVerses && item.bibleVerses.length > 0 
                              ? item.bibleVerses.join(', ')
                              : '—'
                            
                            return (
                            <tr
                              key={idx}
                              className={isSpecialEvent || item.isSpecial ? "bg-red-50" : "bg-white"}
                            >
                              <td className="border-r-2 border-b-2 border-gray-400 px-3 sm:px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                                {item.start} - {item.end}
                              </td>
                              <td className="border-r-2 border-b-2 border-gray-400 px-3 sm:px-4 py-3">
                                <span className={isSpecialEvent || item.isSpecial ? "text-red-700 font-bold uppercase" : "text-gray-700"}>
                                  {item.event}
                                </span>
                              </td>
                              <td className="border-r-2 border-b-2 border-gray-400 px-3 sm:px-4 py-3">
                                <span className="text-gray-700">
                                  {bibleVersesText}
                                </span>
                              </td>
                              <td className="border-b-2 border-gray-400 px-3 sm:px-4 py-3">
                                <span className={item.event === "WORSHIP" ? "text-red-700 font-bold uppercase" : "text-gray-700"}>
                                  {item.leader || "—"}
                                </span>
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Prayer Points Section */}
                    <div className="space-y-6 mt-8">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Prayer Points</h3>
                      {halfNightSchedule.map((item, idx) => {
                        if (!item.prayerPoints || item.prayerPoints.length === 0) return null
                        
                        const isSpecialEvent = item.event && (
                          item.event === "WORD SHARING" || 
                          item.event === "OPENING PRAYER" || 
                          item.event === "CLOSING PRAYER" ||
                          item.event === "WORSHIP"
                        )
                        
                        return (
                          <div key={idx} className="space-y-2">
                            <h4 className={`font-bold text-sm sm:text-base ${isSpecialEvent ? 'text-red-700 uppercase' : 'text-gray-900'}`}>
                              {item.event} ({item.start} - {item.end})
                            </h4>
                            <ul className="list-decimal list-inside space-y-1 text-gray-700 text-xs sm:text-sm">
                              {item.prayerPoints.map((point, pointIdx) => (
                                <li key={pointIdx} className="ml-2">{point}</li>
                              ))}
                            </ul>
                            {item.bibleVerses && item.bibleVerses.length > 0 && (
                              <p className="text-xs sm:text-sm italic text-blue-600 ml-2">
                                <span className="font-semibold">Scriptural References:</span> {item.bibleVerses.join(', ')}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer Note */}
        <Alert className="mt-12 border-blue-200 bg-blue-50 flex gap-3">
          <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <AlertDescription className="text-gray-700">
            This is a read-only view of the published schedule. Only administrators can edit the schedule.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
