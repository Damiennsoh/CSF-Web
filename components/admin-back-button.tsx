"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminBackButtonProps {
  href?: string
  label?: string
  iconOnly?: boolean
}

export function AdminBackButton({
  href = "/admin",
  label = "Back to Admin Dashboard",
  iconOnly = false,
}: AdminBackButtonProps) {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      onClick={() => router.push(href)}
      className={iconOnly ? "mb-4 p-2" : "mb-6"}
    >
      <ArrowLeft className={iconOnly ? "h-5 w-5" : "mr-2 h-4 w-4"} />
      {!iconOnly && label}
    </Button>
  )
}
