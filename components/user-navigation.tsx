"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import SignInModal from "./sign-in-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { User, Settings, LogOut, Shield, Home, Users, Calendar, FileText, Image, Star, GraduationCap, Heart } from "lucide-react"

export function UserNavigation() {
  const { user, isAdmin, signOut } = useAuth()

  if (!user) {
    return (
      <div className="flex gap-2">
        <SignInModal />
      </div>
    )
  }

  const userInitials = user.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ""} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {isAdmin && (
              <Badge variant="default" className="mt-1 w-fit">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* User Profile */}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        {/* Admin Menu Items */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin Dashboard</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/profile-management" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>Profiles</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/events" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Events</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/resources" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <span>Resources</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/gallery" className="flex items-center">
                <Image className="mr-2 h-4 w-4" />
                <span>Gallery</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/alumni" className="flex items-center">
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>Alumni</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/testimonials" className="flex items-center">
                <Star className="mr-2 h-4 w-4" />
                <span>Testimonials</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/prayer-requests" className="flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                <span>Prayer Requests</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/donations" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Donations</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
