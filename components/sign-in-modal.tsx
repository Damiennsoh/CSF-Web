"use client"

import Link from "next/link"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function SignInModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to CSF</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account. Don't have an account? <Link href="/auth/register" className="text-blue-600 underline">Sign up</Link>
          </DialogDescription>
        </DialogHeader>

        {/* Placeholder: embed the existing login form or link to the login page */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">You can sign in here or use the full sign in page.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">Open Sign In Page</Button>
            </Link>
            <Link href="/auth/register" className="w-full">
              <Button variant="ghost" className="w-full">Register</Button>
            </Link>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
