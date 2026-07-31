"use client"

import Link from "next/link"
import { Heart, Calendar, BookOpen, MessageCircle, DollarSign, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileQuickActionsProps {
  onScheduleClick?: () => void
}

interface ActionItem {
  label: string
  icon: React.ComponentType<any>
  href: string
  color: string
  isSchedule?: boolean
}

export function MobileQuickActions({ onScheduleClick }: MobileQuickActionsProps) {
  const scheduleEnabled = process.env.NEXT_PUBLIC_SCHEDULE_ENABLED === "true"
  
  // Debug: Log values to help troubleshoot
  console.log('MobileQuickActions Debug:', { 
    scheduleEnabled, 
    onScheduleClick: !!onScheduleClick,
    envValue: process.env.NEXT_PUBLIC_SCHEDULE_ENABLED
  })
  
  const actions: ActionItem[] = [
    { label: "Pray", icon: Heart, href: "/#prayer-requests", color: "bg-red-50 text-red-600" },
    { label: "Events", icon: Calendar, href: "/events", color: "bg-blue-50 text-blue-600" },
    { label: "Study", icon: BookOpen, href: "/spiritual-resources", color: "bg-green-50 text-green-600" },
    { label: "Give", icon: DollarSign, href: "/donation", color: "bg-yellow-50 text-yellow-600" },
    { label: "Ministries", icon: Users, href: "/ministries", color: "bg-purple-50 text-purple-600" },
    { label: "Contact", icon: MessageCircle, href: "/contact", color: "bg-indigo-50 text-indigo-600" },
  ]

  // Show CSF Schedule button for ALL users if schedule is enabled and click handler exists
  if (onScheduleClick && scheduleEnabled) {
    actions.splice(2, 0, { 
      label: "CSF Schedule", 
      icon: Clock, 
      href: "", 
      color: "bg-emerald-50 text-emerald-600",
      isSchedule: true 
    })
  }

  return (
    <div className="lg:hidden grid grid-cols-3 gap-4 mb-12">
      {actions.map((action) => {
        const Icon = action.icon
        if (action.isSchedule) {
          return (
            <button
              key="schedule"
              onClick={onScheduleClick}
              className="flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className={cn("p-3 rounded-xl", action.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{action.label}</span>
            </button>
          )
        }
        
        return (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className={cn("p-3 rounded-xl", action.color)}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-gray-700">{action.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
