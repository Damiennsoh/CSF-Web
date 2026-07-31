"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <ArrowLeftCircle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">404</h2>
        <p className="text-gray-600">This page could not be found.</p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

