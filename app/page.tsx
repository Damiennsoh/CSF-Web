"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Heart, BookOpen, ChevronDown, Music, PlayIcon as Pray, UserCheck, ArrowRight, Instagram, Facebook, Youtube, Twitter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { ScrollToTop } from "@/components/scroll-to-top"
import { TestimonialsSection } from "@/components/testimonials-section"
import { PrayerRequestsSection } from "@/components/prayer-requests-section"
import { LeadershipSection } from "@/components/leadership-section"
import { FeaturedAlumniSection } from "@/components/featured-alumni-section"
import { EventsPreview } from "@/components/events-preview"
import { MobileQuickActions } from "@/components/mobile-quick-actions"
import { ResourcesPreview } from "@/components/resources-preview"
import { MinistriesSection } from "@/components/ministries-section"
import { GalleryHomepageSection } from "@/components/gallery-homepage-section"
import ScheduleManager from "@/components/schedule-manager"
import { ScheduleFloatingButton } from "@/components/schedule-floating-button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { useState } from "react"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const { user } = useAuth()
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const scheduleEnabled = process.env.NEXT_PUBLIC_SCHEDULE_ENABLED === "true"
  
  const openSchedule = () => setIsScheduleOpen(true)
  const closeSchedule = () => setIsScheduleOpen(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-banner.jpg" alt="CSF Students Fellowship" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-600/30 text-red-400 text-sm font-semibold mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Heart className="h-4 w-4 fill-current" />
            <span>Empowering CSF (MMU) Students Since 2011</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Christian Students <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Fellowship</span>
          </h1>
          <p className="text-xl md:text-2xl font-light mb-10 text-gray-200 tracking-wide max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            A vibrant community of faith, <span className="font-bold text-white">growth</span>, and <span className="font-bold text-white">impact</span>. Discover your purpose at Maharishi Markandeshwar University.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link href="/about" className="w-full sm:w-auto">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-12 py-7 text-xl rounded-full shadow-2xl shadow-red-600/40 transition-all hover:scale-105 active:scale-95 w-full font-bold">
                Join Us Today
              </Button>
            </Link>
            <Link href="/events" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white hover:text-gray-900 px-12 py-7 text-xl rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95 w-full font-bold"
              >
                Explore Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/60 animate-bounce">
          <span className="text-xs uppercase tracking-widest font-bold mb-2">Explore</span>
          <ChevronDown className="h-6 w-6" />
        </div>

        {/* Decorative Blur Orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      </section>

      {/* Mobile Quick Actions - Enhanced for PWA feel */}
      <section className="py-16 px-4 lg:hidden bg-white relative -mt-10 rounded-t-[48px] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 px-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Quick Actions</h3>
            <Link href="/ministries" className="text-red-600 text-sm font-bold hover:underline flex items-center">
              See All <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
            </Link>
          </div>
          <MobileQuickActions onScheduleClick={openSchedule} />
        </div>
      </section>

      {/* Stats Section - High impact social proof */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-black text-red-600">500+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Students</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-black text-red-600">6</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ministries</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-black text-red-600">15+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Years Legacy</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-black text-red-600">100%</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Love</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Modernized Layout */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-white p-3 rounded-3xl shadow-2xl overflow-hidden">
                <Image src="/about-section.jpg" alt="CSF Fellowship" width={800} height={600} className="rounded-2xl object-cover w-full h-[480px] md:h-[500px] transform transition duration-700 group-hover:scale-105" />
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 p-3 md:p-4 bg-white/85 md:bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl border border-white/20 max-w-[85%] md:max-w-[90%]">
                  <p className="text-gray-900 font-medium text-xs md:text-sm leading-relaxed">
                    "CSF changed my life. I found a family away from home and grew deeper in my faith than I ever thought possible."
                  </p>
                  <div className="mt-2 md:mt-3 flex items-center space-x-2 md:space-x-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] md:text-xs">BK</div>
                    <div>
                      <div className="font-semibold text-gray-900 text-xs md:text-sm">Blessing Kwanisayi</div>
                      <div className="text-[8px] md:text-xs text-gray-500">Class of 2025</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest">Our Story</span>
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight">Christian Students <br /> Fellowship <span className="text-red-600">(CSF)</span></h2>
                <p className="text-xl text-gray-600 leading-relaxed font-medium">
                  We are more than a club; we are a vibrant community of believers at Maharishi Markandeshwar University.
                </p>
                <p className="text-lg text-gray-500 leading-relaxed">
                  Dedicated to helping students grow in their faith, develop leadership skills, and make a positive impact on campus and beyond. Join us as we build a legacy of faith together.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 pt-4">
                <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:border-red-200 transition-colors group">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 mb-6 group-hover:scale-110 transition-transform">
                    <Heart className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Our Mission</h3>
                  <p className="text-gray-500 leading-relaxed">
                    To create a supportive Christian community where students deepen their relationship with Christ and share God's love.
                  </p>
                </div>

                <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-colors group">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Our Vision</h3>
                  <p className="text-gray-500 leading-relaxed">
                    A campus transformed by the love of Christ, where every student has the opportunity to hear and respond.
                  </p>
                </div>
              </div>
              
              <Link href="/about" className="inline-flex items-center font-bold text-red-600 hover:text-red-700 group pt-4">
                Read our full history <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MinistriesSection />

      <EventsPreview />

      {/* Remaining Sections with refined containers */}
      <div className="bg-white">
        <LeadershipSection />
        <div className="bg-gray-50 border-y border-gray-100">
          <TestimonialsSection />
        </div>
        <ResourcesPreview />
        <GalleryHomepageSection />
        <FeaturedAlumniSection />
        <PrayerRequestsSection />
      </div>

      {/* Modern Footer */}
      <footer className="bg-gray-950 text-white pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 mb-24">
            <div className="lg:col-span-5 space-y-10">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 group-hover:rotate-12 transition-transform">
                  <Image src="/csf-logo.png" alt="CSF Logo" width={40} height={40} className="rounded-lg" />
                </div>
                <span className="text-2xl font-black tracking-tighter">CSF MMU</span>
              </Link>
              <p className="text-xl text-gray-400 leading-relaxed font-light">
                Building a vibrant community of faith, fellowship, and service at Maharishi Markandeshwar University. Join us as we grow together in Christ's love.
              </p>
              <div className="flex space-x-6">
                <Link href="https://www.instagram.com/csfmullanaindia?igsh=ZDl5d2t1cjAxMXR1" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
                  <span className="sr-only">Instagram</span>
                  <Instagram className="w-5 h-5" />
                </Link>
                {['Facebook', 'YouTube', 'Twitter'].map((social) => (
                  <Link key={social} href="#" className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-current rounded-sm"></div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-12">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white mb-8">Navigation</h3>
                <ul className="space-y-4 text-gray-400 font-medium">
                  <li><Link href="/events" className="hover:text-red-500 transition-colors">Events</Link></li>
                  <li><Link href="/ministries" className="hover:text-red-500 transition-colors">Ministries</Link></li>
                  <li><Link href="/gallery" className="hover:text-red-500 transition-colors">Gallery</Link></li>
                  <li><Link href="/alumni" className="hover:text-red-500 transition-colors">Alumni</Link></li>
                  <li><Link href="/spiritual-resources" className="hover:text-red-500 transition-colors">Resources</Link></li>
                  <li><Link href="/donation" className="hover:text-red-500 transition-colors">Donate</Link></li>
                  {scheduleEnabled && (
                    <li>
                      <button 
                        onClick={openSchedule} 
                        className="hover:text-red-500 transition-colors text-left w-full"
                      >
                        CSF Schedule
                      </button>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white mb-8">Fellowship</h3>
                <ul className="space-y-4 text-gray-400 font-medium">
                  <li><Link href="/about" className="hover:text-red-500 transition-colors">About Us</Link></li>
                  <li><Link href="/leadership" className="hover:text-red-500 transition-colors">Our Leadership</Link></li>
                  <li><Link href="/#prayer-requests" className="hover:text-red-500 transition-colors">Prayer Requests</Link></li>
                  <li><Link href="/contact" className="hover:text-red-500 transition-colors">Contact</Link></li>
                  <li><Link href="/about" className="hover:text-red-500 transition-colors">Join Us</Link></li>
                </ul>
              </div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white mb-8">Visit Us</h3>
                  <p className="text-gray-400 leading-relaxed">
                    MMU Campus, Mullana, <br />
                    Ambala, Haryana, India <br />
                    Pin: 133207
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 font-bold">csf@mmumullana.org</p>
                  <p className="text-gray-400">+91 1731-274140</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm font-bold">
            <p>&copy; 2026 Christian Students Fellowship - MMU. All rights reserved.</p>
            <div className="flex space-x-10">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
      
      {/* Schedule Manager - handles the schedule modal and trigger */}
      <ScheduleManager 
        externalOpen={isScheduleOpen} 
        onExternalClose={closeSchedule} 
      />
      
      {/* Schedule Floating Button - Only on homepage */}
      <ScheduleFloatingButton />
    </div>
  )
}
