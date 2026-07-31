"use client"

import React, { useState, useEffect } from "react"
import ScheduleModal from "./schedule-modal"

interface ScheduleManagerProps {
  externalOpen?: boolean
  onExternalClose?: () => void
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ externalOpen, onExternalClose }) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isScheduleOpen = externalOpen || internalOpen
  
  const openSchedule = () => setInternalOpen(true)
  const closeSchedule = () => {
    setInternalOpen(false)
    if (onExternalClose && externalOpen) {
      onExternalClose()
    }
  }
  
  return (
    <>
      <ScheduleModal isOpen={isScheduleOpen} onClose={closeSchedule} />
    </>
  )
}

export default ScheduleManager
