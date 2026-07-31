"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface BackButtonProps {
  showHomeButton?: boolean
  customText?: string
  className?: string
}

export function BackButton({ showHomeButton = true, customText, className = "" }: BackButtonProps) {
  const router = useRouter()

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 ${className}`}>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden xs:inline">{customText || "Back"}</span>
        </Button>

        {showHomeButton && (
          <Link href="/" className="flex-1 sm:flex-none">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
            >
              <Home className="h-4 w-4" />
              <span className="hidden xs:inline">Home</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
