"use client"

import React from "react"
import ScheduleCreator from "./schedule-creator"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative inset-0 flex items-center justify-center p-4">
        <ScheduleCreator onClose={onClose} />
      </div>
    </div>
  )
}

export default ScheduleModal
