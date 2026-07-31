'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export function ScheduleFloatingButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  const handleTouchStart = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setIsVisible(!isVisible)
  }

  return (
    <div
      ref={buttonRef}
      className="fixed left-0 top-1/2 transform -translate-y-1/2 z-30"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      {/* Main Button - Partially hidden on the left */}
      <Link
        href="/schedule"
        className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-r-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110 ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-80'
        }`}
        title="View Schedule"
      >
        <Clock className="w-5 h-5 md:w-6 md:h-6" />
      </Link>

      {/* Label - Slides in from left */}
      <div
        className={`absolute left-16 top-1/2 transform -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 pointer-events-none ${
          isVisible
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-2'
        }`}
      >
        View Schedule
      </div>

      {/* Touch indicator on mobile */}
      {isMobile && !isVisible && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full ml-10 bg-gray-900/80 text-white text-[10px] px-1 py-2 rounded-md animate-pulse border border-white/20 flex flex-col items-center leading-tight tracking-tighter uppercase font-black pointer-events-none">
          {"Tap to expand".split(" ").map((word, i) => (
            <span key={i} className="mb-0.5 last:mb-0">{word}</span>
          ))}
        </div>
      )}
    </div>
  )
}
