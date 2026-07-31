/**
 * Seed script to add mockup data for Events, Alumni, Testimonials, Gallery, and Leadership
 * Run with: npx ts-node --esm scripts/seed-mockup-data.ts
 * 
 * Note: Resources are NOT seeded as per user request - admin will add real resources.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore"

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

// Helper to create a future date
function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// Helper to create a past date
function getPastDate(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

// ==================== EVENTS ====================
const eventsData = [
  {
    title: "Easter Fellowship Celebration",
    description: "Join us for a special Easter celebration with worship, fellowship, and a shared meal. This event will be a time of reflection, joy, and community as we celebrate the resurrection of Christ together.",
    eventDate: getFutureDate(14),
    time: "10:00 AM",
    location: "MMU Main Auditorium, Block A",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: true,
    eventType: "special",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    title: "Weekly Bible Study",
    description: "Deep dive into God's Word with our weekly Bible study sessions. This week we're exploring the book of Romans and its profound teachings on faith and grace.",
    eventDate: getFutureDate(3),
    time: "6:00 PM",
    location: "CSF Prayer Room, Building C",
    imageUrl: "",
    imagePath: "",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    title: "Youth Leadership Conference",
    description: "A two-day conference focused on developing student leaders for Christ. Featuring guest speakers, workshops on servant leadership, and networking opportunities with Christian professionals.",
    eventDate: getFutureDate(30),
    time: "9:00 AM",
    location: "MMU Conference Hall",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: true,
    eventType: "special",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    title: "Morning Prayer Meeting",
    description: "Start your day with prayer and devotion. Join us every weekday morning for a time of corporate prayer for our campus, nation, and world.",
    eventDate: getFutureDate(1),
    time: "6:30 AM",
    location: "CSF Chapel",
    imageUrl: "",
    imagePath: "",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    title: "Worship Night",
    description: "An evening dedicated to worship and praise. Come with an open heart to encounter God through contemporary and traditional worship songs led by our CSF Choir.",
    eventDate: getFutureDate(7),
    time: "7:00 PM",
    location: "MMU Open Theatre",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: false,
    eventType: "special",
    createdAt: FieldValue.serverTimestamp()
  }
]

// ==================== ALUMNI ====================
const alumniData = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+91-98765-43210",
    graduation_year: 2023,
    degree: "B.Tech Computer Science",
    current_occupation: "Software Engineer",
    current_position: "Software Engineer",
    location: "Bangalore, India",
    company_organization: "Google India",
    bio: "Former CSF President who led the fellowship through significant growth. Now working as a software engineer while actively serving in her local church's youth ministry.",
    testimony: "CSF taught me that faith and professional excellence can go hand in hand. The leadership skills I developed here continue to serve me in my career and ministry.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "David Kumar",
    email: "david.kumar@example.com",
    phone: "+91-87654-32109",
    graduation_year: 2022,
    degree: "MBBS",
    current_occupation: "Medical Resident",
    current_position: "Medical Resident",
    location: "Delhi, India",
    company_organization: "AIIMS Delhi",
    bio: "Passionate about medical missions, David served as CSF's Outreach Coordinator. He now combines his medical practice with volunteer work at health camps for underserved communities.",
    testimony: "My time in CSF shaped my calling to serve the sick and marginalized. The fellowship gave me a vision for holistic healthcare that honors God.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91-76543-21098",
    graduation_year: 2021,
    degree: "MBA",
    current_occupation: "Business Analyst",
    current_position: "Business Analyst",
    location: "Mumbai, India",
    company_organization: "Deloitte",
    bio: "Former CSF Treasurer who brought financial discipline to the fellowship. Now using her business skills to consult for non-profit organizations in her spare time.",
    testimony: "CSF taught me that stewardship is worship. Managing the fellowship's finances prepared me for greater responsibilities in both career and ministry.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Michael Thomas",
    email: "michael.thomas@example.com",
    phone: "+91-65432-10987",
    graduation_year: 2020,
    degree: "B.Tech Mechanical Engineering",
    current_occupation: "Entrepreneur",
    current_position: "Founder & CEO",
    location: "Chennai, India",
    company_organization: "GreenTech Solutions",
    bio: "Founded a sustainable technology startup after graduation. Michael was instrumental in starting CSF's environmental stewardship initiatives on campus.",
    testimony: "The entrepreneurial spirit I developed at CSF gave me confidence to start my own company. Our foundation in faith keeps our business ethics strong.",
    image_url: "",
    image_path: "",
    is_featured: false,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Grace Williams",
    email: "grace.williams@example.com",
    phone: "+91-54321-09876",
    graduation_year: 2019,
    degree: "B.Sc Nursing",
    current_occupation: "Nurse Practitioner",
    current_position: "Senior Nurse",
    location: "Hyderabad, India",
    company_organization: "Apollo Hospitals",
    bio: "CSF Worship Leader turned healthcare professional. Grace continues to lead worship at her church while caring for patients with compassion and excellence.",
    testimony: "CSF showed me that worship isn't just singing—it's serving others with love. Every patient I care for is an opportunity to reflect Christ's healing love.",
    image_url: "",
    image_path: "",
    is_featured: false,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }
]

// ==================== TESTIMONIALS ====================
const testimonialsData = [
  {
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    role: "Current Student",
    company: "B.Tech 3rd Year",
    content: "Joining CSF was the best decision I made at MMU. The fellowship has become my family away from home. The weekly Bible studies have deepened my understanding of Scripture, and the friendships I've made here are truly life-changing.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Anita Patel",
    email: "anita.patel@example.com",
    role: "Alumni",
    company: "Class of 2022",
    content: "CSF prepared me for life after graduation in ways I never expected. The leadership training, mentorship, and spiritual foundation I received here have been invaluable in my career and personal growth.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Joseph Daniel",
    email: "joseph.daniel@example.com",
    role: "Current Student",
    company: "MBA 2nd Year",
    content: "As an international student, finding community was crucial. CSF welcomed me with open arms and helped me navigate both academic and personal challenges. The prayer support during exams has been incredible!",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Mary Abraham",
    email: "mary.abraham@example.com",
    role: "Ministry Leader",
    company: "Women's Fellowship",
    content: "Leading the Women's Fellowship has been an honor. Watching young women grow in their faith and confidence is incredibly rewarding. CSF provides a safe space for everyone to explore and strengthen their relationship with God.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: false,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    name: "Samuel George",
    email: "samuel.george@example.com",
    role: "Current Student",
    company: "MBBS 4th Year",
    content: "Balancing medical studies with spiritual growth seemed impossible until I joined CSF. The fellowship understands student life and provides flexible ways to stay connected with God and fellow believers.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: false,
    is_active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }
]

// ==================== GALLERY ====================
const galleryData = [
  {
    title: "Easter Celebration 2024",
    description: "Joyful moments from our Easter Sunday celebration where we commemorated the resurrection of Christ with worship, fellowship, and a community meal.",
    image_url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80",
    image_path: "",
    category: "Events",
    is_featured: true,
    is_active: true,
    display_order: 1,
    event_date: getPastDate(60),
    location: "MMU Main Auditorium",
    photographer: "CSF Media Team",
    created_at: getPastDate(60),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "Weekly Worship Night",
    description: "Students gathered in praise and worship, lifting their voices together in song and prayer during our Friday worship night.",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    image_path: "",
    category: "Worship",
    is_featured: true,
    is_active: true,
    display_order: 2,
    event_date: getPastDate(7),
    location: "CSF Chapel",
    photographer: "CSF Media Team",
    created_at: getPastDate(7),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "Bible Study Session",
    description: "Students engaging deeply with Scripture during our weekly Bible study, exploring the book of Acts together.",
    image_url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80",
    image_path: "",
    category: "Bible Study",
    is_featured: false,
    is_active: true,
    display_order: 3,
    event_date: getPastDate(14),
    location: "CSF Prayer Room",
    photographer: "CSF Media Team",
    created_at: getPastDate(14),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "Community Outreach",
    description: "CSF members serving the local community through our monthly outreach program, sharing God's love in practical ways.",
    image_url: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    image_path: "",
    category: "Outreach",
    is_featured: true,
    is_active: true,
    display_order: 4,
    event_date: getPastDate(21),
    location: "Mullana Village",
    photographer: "CSF Media Team",
    created_at: getPastDate(21),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "Leadership Retreat",
    description: "Our student leaders gathered for a weekend of planning, prayer, and team building at our annual leadership retreat.",
    image_url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80",
    image_path: "",
    category: "Leadership",
    is_featured: false,
    is_active: true,
    display_order: 5,
    event_date: getPastDate(45),
    location: "Shimla Retreat Center",
    photographer: "CSF Media Team",
    created_at: getPastDate(45),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "Christmas Celebration",
    description: "The joy of Christmas filled our fellowship as we celebrated the birth of Christ with carols, drama, and a special dinner.",
    image_url: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800&q=80",
    image_path: "",
    category: "Events",
    is_featured: true,
    is_active: true,
    display_order: 6,
    event_date: getPastDate(90),
    location: "MMU Auditorium",
    photographer: "CSF Media Team",
    created_at: getPastDate(90),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "Prayer Meeting",
    description: "Early morning prayer warriors gathering to intercede for the campus, nation, and world before the start of classes.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    image_path: "",
    category: "Prayer",
    is_featured: false,
    is_active: true,
    display_order: 7,
    event_date: getPastDate(3),
    location: "CSF Chapel",
    photographer: "CSF Media Team",
    created_at: getPastDate(3),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  },
  {
    title: "New Students Welcome",
    description: "Welcoming new students to the CSF family during our orientation week, helping them find community and connection.",
    image_url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
    image_path: "",
    category: "Events",
    is_featured: false,
    is_active: true,
    display_order: 8,
    event_date: getPastDate(120),
    location: "MMU Campus",
    photographer: "CSF Media Team",
    created_at: getPastDate(120),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }
]

// ==================== LEADERSHIP ====================
const leadershipData = [
  {
    name: "Pastor Emmanuel John",
    position: "Spiritual Advisor",
    role: "Spiritual Advisor",
    email: "emmanuel.john@csf-mmu.org",
    phone: "+91-99887-76655",
    bio: "Pastor Emmanuel has been guiding CSF for over 10 years, providing spiritual mentorship and biblical teaching to students. His passion is seeing young people transformed by Christ and equipped for lifelong ministry.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: true,
    is_active: true,
    display_order: 1,
    start_date: "2014-01-01",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    name: "Blessing Mathew",
    position: "President",
    role: "President",
    email: "blessing.mathew@csf-mmu.org",
    phone: "+91-88776-65544",
    bio: "Blessing is a final year B.Tech student passionate about building Christian community on campus. Under her leadership, CSF has grown significantly in both numbers and spiritual depth.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: true,
    is_active: true,
    display_order: 2,
    start_date: "2024-01-15",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    name: "Daniel Philip",
    position: "Vice President",
    role: "Vice President",
    email: "daniel.philip@csf-mmu.org",
    phone: "+91-77665-54433",
    bio: "Daniel coordinates all fellowship activities and supports ministry leaders. His organizational skills and servant heart make him invaluable to the team. He's pursuing MBBS and hopes to serve as a medical missionary.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 3,
    start_date: "2024-01-15",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    name: "Ruth Samuel",
    position: "Secretary",
    role: "Secretary",
    email: "ruth.samuel@csf-mmu.org",
    phone: "+91-66554-43322",
    bio: "Ruth manages all CSF communications, records, and administrative functions. Her attention to detail and dedication ensure smooth operations across all ministry areas.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 4,
    start_date: "2024-01-15",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    name: "James Peter",
    position: "Treasurer",
    role: "Treasurer",
    email: "james.peter@csf-mmu.org",
    phone: "+91-55443-32211",
    bio: "James oversees CSF's finances with integrity and transparency. He's an MBA student with a heart for stewardship, ensuring that resources are used wisely for God's kingdom.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 5,
    start_date: "2024-01-15",
    createdAt: FieldValue.serverTimestamp()
  },
  {
    name: "Hannah Grace",
    position: "Worship Coordinator",
    role: "Worship Coordinator",
    email: "hannah.grace@csf-mmu.org",
    phone: "+91-44332-21100",
    bio: "Hannah leads the worship team and CSF Choir. Her musical talents and spiritual sensitivity create an atmosphere of genuine worship during all fellowship gatherings.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 6,
    start_date: "2024-01-15",
    createdAt: FieldValue.serverTimestamp()
  }
]

// ==================== SEED FUNCTIONS ====================
async function seedEvents() {
  console.log("Seeding events...")
  const eventsRef = db.collection("events")
  
  for (const event of eventsData) {
    await eventsRef.add(event)
    console.log(`  Added event: ${event.title}`)
  }
  
  console.log(`Seeded ${eventsData.length} events`)
}

async function seedAlumni() {
  console.log("Seeding alumni...")
  const alumniRef = db.collection("alumni")
  
  for (const alum of alumniData) {
    await alumniRef.add(alum)
    console.log(`  Added alumni: ${alum.name}`)
  }
  
  console.log(`Seeded ${alumniData.length} alumni`)
}

async function seedTestimonials() {
  console.log("Seeding testimonials...")
  const testimonialsRef = db.collection("testimonials")
  
  for (const testimonial of testimonialsData) {
    await testimonialsRef.add(testimonial)
    console.log(`  Added testimonial: ${testimonial.name}`)
  }
  
  console.log(`Seeded ${testimonialsData.length} testimonials`)
}

async function seedGallery() {
  console.log("Seeding gallery...")
  const galleryRef = db.collection("gallery")
  
  for (const item of galleryData) {
    await galleryRef.add(item)
    console.log(`  Added gallery item: ${item.title}`)
  }
  
  console.log(`Seeded ${galleryData.length} gallery items`)
}

async function seedLeadership() {
  console.log("Seeding leadership...")
  const leadershipRef = db.collection("executive_leaders")
  
  for (const leader of leadershipData) {
    await leadershipRef.add(leader)
    console.log(`  Added leader: ${leader.name}`)
  }
  
  console.log(`Seeded ${leadershipData.length} leaders`)
}

// Main seed function
async function seed() {
  console.log("Starting seed process...")
  console.log("Note: Resources are NOT being seeded - admin will add real resources.")
  console.log("")
  
  try {
    await seedEvents()
    await seedAlumni()
    await seedTestimonials()
    await seedGallery()
    await seedLeadership()
    
    console.log("")
    console.log("Seed completed successfully!")
    console.log("Summary:")
    console.log(`  - ${eventsData.length} Events`)
    console.log(`  - ${alumniData.length} Alumni`)
    console.log(`  - ${testimonialsData.length} Testimonials`)
    console.log(`  - ${galleryData.length} Gallery items`)
    console.log(`  - ${leadershipData.length} Leaders`)
    console.log(`  - 0 Resources (admin will add)`)
  } catch (error) {
    console.error("Error during seeding:", error)
    throw error
  }
}

// Run the seed
seed()
