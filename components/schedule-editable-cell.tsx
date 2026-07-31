"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"

interface EditableCellProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  isReadOnly?: boolean
  placeholder?: string
  showDropdownArrow?: boolean
}

export function EditableCell({
  value,
  onValueChange,
  options,
  isReadOnly = false,
  placeholder = "Click to edit",
  showDropdownArrow = true
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const cellRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Filter options based on input
  useEffect(() => {
    const filtered = options.filter(opt =>
      opt.toLowerCase().includes(inputValue.toLowerCase())
    )
    setFilteredOptions(filtered)
  }, [inputValue, options])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleSave()
        }
      }
    }

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isEditing, inputValue])

  const handleSave = () => {
    if (inputValue.trim() !== value) {
      onValueChange(inputValue.trim())
    }
    setIsEditing(false)
    setInputValue(value)
  }

  const handleOptionClick = (option: string) => {
    setInputValue(option)
    onValueChange(option)
    setIsEditing(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputValue("")
    onValueChange("")
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setInputValue(value)
    }
  }

  if (isReadOnly) {
    return (
      <div className="p-2 text-sm text-gray-700 truncate">
        {value || placeholder}
      </div>
    )
  }

  return (
    <div
      ref={cellRef}
      className="relative w-full"
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {!isEditing ? (
        <div className="flex items-center justify-between p-2 rounded border border-gray-200 hover:border-red-400 hover:bg-red-50 cursor-pointer min-h-10 transition-colors">
          <span className="text-sm truncate flex-1 text-gray-700">
            {value || <span className="text-gray-400 text-xs">{placeholder}</span>}
          </span>
          <div className="flex items-center gap-1 ml-1">
            {value && (
              <button
                onClick={handleClear}
                className="p-0.5 hover:bg-red-200 rounded transition-colors"
                title="Clear"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
            {showDropdownArrow && (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      ) : (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white border-2 border-red-500 rounded shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
          />

          {/* Dropdown options */}
          {filteredOptions.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-red-100 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-800">{option}</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom text entry section */}
          {inputValue && !options.includes(inputValue) && (
            <div
              onClick={() => handleOptionClick(inputValue)}
              className="px-3 py-2 text-sm cursor-pointer bg-blue-50 hover:bg-blue-100 border-t border-gray-200 font-medium text-blue-700 transition-colors"
            >
              Use custom: "{inputValue}"
            </div>
          )}

          {filteredOptions.length === 0 && !inputValue && (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
