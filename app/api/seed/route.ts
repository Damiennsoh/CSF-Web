import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, limit, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"

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
  },
  {
    title: "Youth Leadership Conference",
    description: "A two-day conference focused on developing student leaders for Christ. Featuring guest speakers, workshops on servant leadership, and networking opportunities.",
    eventDate: getFutureDate(30),
    time: "9:00 AM",
    location: "MMU Conference Hall",
    imageUrl: "",
    imagePath: "",
    isFeatured: true,
    isActive: true,
    registrationRequired: true,
    eventType: "special",
  },
  {
    title: "Morning Prayer Meeting",
    description: "Start your day with prayer and devotion. Join us every weekday morning for corporate prayer for our campus, nation, and world.",
    eventDate: getFutureDate(1),
    time: "6:30 AM",
    location: "CSF Chapel",
    imageUrl: "",
    imagePath: "",
    isFeatured: false,
    isActive: true,
    registrationRequired: false,
    eventType: "regular",
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
  }
]

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
    bio: "Passionate about medical missions, David served as CSF's Outreach Coordinator. He now combines his medical practice with volunteer work at health camps.",
    testimony: "My time in CSF shaped my calling to serve the sick and marginalized. The fellowship gave me a vision for holistic healthcare that honors God.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
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
    bio: "Former CSF Treasurer who brought financial discipline to the fellowship. Now using her business skills to consult for non-profit organizations.",
    testimony: "CSF taught me that stewardship is worship. Managing the fellowship's finances prepared me for greater responsibilities in both career and ministry.",
    image_url: "",
    image_path: "",
    is_featured: true,
    is_active: true,
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
    testimony: "CSF showed me that worship isn't just singing - it's serving others with love. Every patient I care for is an opportunity to reflect Christ's healing love.",
    image_url: "",
    image_path: "",
    is_featured: false,
    is_active: true,
  }
]

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
  },
  {
    name: "Mary Abraham",
    email: "mary.abraham@example.com",
    role: "Ministry Leader",
    company: "Women's Fellowship",
    content: "Leading the Women's Fellowship has been an honor. Watching young women grow in their faith and confidence is incredibly rewarding. CSF provides a safe space for everyone to explore their relationship with God.",
    rating: 5,
    image_url: "",
    image_path: "",
    is_featured: false,
    is_active: true,
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
  }
]

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
    created_at: getPastDate(60),
    updated_at: getPastDate(60)
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
    created_at: getPastDate(7),
    updated_at: getPastDate(7)
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
    created_at: getPastDate(14),
    updated_at: getPastDate(14)
  },
  {
    title: "Community Outreach",
    description: "CSF members serving the local community through our monthly outreach program, sharing God's love in practical ways.",
    image_url: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    image_path: "",
    category: "Outreach",
    is_featured: false,
    is_active: true,
    display_order: 4,
    created_at: getPastDate(21),
    updated_at: getPastDate(21)
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
  }
]

const ministriesData = [
  {
    name: "Women's Fellowship",
    description: "Empowering women through Bible study, prayer, and fellowship. Building strong Christian women leaders equipped to impact their campuses and communities.",
    image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 1,
  },
  {
    name: "Men's Fellowship",
    description: "Building strong Christian men through discipleship and accountability. Challenging men to live with integrity, purpose, and servant leadership.",
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 2,
  },
  {
    name: "CSF Choir",
    description: "Worship through music and song, leading congregation in praise and leading worship in all CSF events. Discipleship through the art of contemporary and traditional worship.",
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 3,
  },
  {
    name: "Bible Study Group",
    description: "Deep dive into God's Word through systematic Bible study. Engaging discussions and practical application of Scripture to daily life.",
    image_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 4,
  },
  {
    name: "Evangelism & Outreach",
    description: "Sharing the Gospel with campus and community. Training students in personal evangelism and leading outreach programs to serve and share Christ.",
    image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 5,
  },
  {
    name: "Intercession Group",
    description: "Dedicated prayer warriors interceding for campus, nation, and world. Weekly prayer meetings and 24/7 prayer chain for urgent requests.",
    image_url: "https://images.unsplash.com/photo-1470229722913-7f419344ca51?w=800&q=80",
    image_path: "",
    resource_url: "",
    resource_path: "",
    is_active: true,
    display_order: 6,
  }
]

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
  },
  {
    name: "Daniel Philip",
    position: "Vice President",
    role: "Vice President",
    email: "daniel.philip@csf-mmu.org",
    phone: "+91-77665-54433",
    bio: "Daniel coordinates all fellowship activities and supports ministry leaders. His organizational skills and servant heart make him invaluable to the team.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 3,
    start_date: "2024-01-15",
  },
  {
    name: "Ruth Samuel",
    position: "Secretary",
    role: "Secretary",
    email: "ruth.samuel@csf-mmu.org",
    phone: "+91-66554-43322",
    bio: "Ruth manages all CSF communications, records, and administrative functions. Her attention to detail ensures smooth operations across all ministry areas.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 4,
    start_date: "2024-01-15",
  },
  {
    name: "James Peter",
    position: "Treasurer",
    role: "Treasurer",
    email: "james.peter@csf-mmu.org",
    phone: "+91-55443-32211",
    bio: "James oversees CSF's finances with integrity and transparency. He's an MBA student with a heart for stewardship.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 5,
    start_date: "2024-01-15",
  },
  {
    name: "Hannah Grace",
    position: "Worship Coordinator",
    role: "Worship Coordinator",
    email: "hannah.grace@csf-mmu.org",
    phone: "+91-44332-21100",
    bio: "Hannah leads the worship team and CSF Choir. Her musical talents create an atmosphere of genuine worship during all fellowship gatherings.",
    profile_picture_url: "",
    photo_url: "",
    photo_path: "",
    is_current: true,
    is_featured: false,
    is_active: true,
    display_order: 6,
    start_date: "2024-01-15",
  }
]

const executivesData = [
  {
    yearName: "2023/2024 Tenure",
    description: "Executive team that led CSF through the 2023/2024 academic year with focus on spiritual growth and community building.",
    members: [
      {
        id: "exec-001",
        name: "Michael Thompson",
        role: "President",
        profession: "Software Engineer",
        location: "Lagos, Nigeria",
        phone: "+234 801 234 5678",
        photo: "",
        photo_path: "",
        created_at: "2023-09-01T00:00:00Z"
      },
      {
        id: "exec-002", 
        name: "Grace Okafor",
        role: "Vice President",
        profession: "Medical Doctor",
        location: "Abuja, Nigeria",
        phone: "+234 802 345 6789",
        photo: "",
        photo_path: "",
        created_at: "2023-09-01T00:00:00Z"
      },
      {
        id: "exec-003",
        name: "David Chen",
        role: "Secretary",
        profession: "Data Analyst",
        location: "Port Harcourt, Nigeria",
        phone: "+234 803 456 7890",
        photo: "",
        photo_path: "",
        created_at: "2023-09-01T00:00:00Z"
      },
      {
        id: "exec-004",
        name: "Esther Williams",
        role: "Treasurer",
        profession: "Financial Analyst",
        location: "Kano, Nigeria",
        phone: "+234 804 567 8901",
        photo: "",
        photo_path: "",
        created_at: "2023-09-01T00:00:00Z"
      }
    ],
    is_active: false,
    created_at: "2023-09-01T00:00:00Z",
    updated_at: "2023-09-01T00:00:00Z"
  },
  {
    yearName: "2024/2025 Tenure", 
    description: "Current executive team leading CSF through the 2024/2025 academic year with emphasis on discipleship and outreach.",
    members: [
      {
        id: "exec-005",
        name: "Samuel Adekunle",
        role: "President",
        profession: "Business Consultant",
        location: "Lagos, Nigeria",
        phone: "+234 805 678 9012",
        photo: "",
        photo_path: "",
        created_at: "2024-09-01T00:00:00Z"
      },
      {
        id: "exec-006",
        name: "Rachel Kim",
        role: "Vice President", 
        profession: "Marketing Manager",
        location: "Lagos, Nigeria",
        phone: "+234 806 789 0123",
        photo: "",
        photo_path: "",
        created_at: "2024-09-01T00:00:00Z"
      },
      {
        id: "exec-007",
        name: "James Okoro",
        role: "Secretary",
        profession: "Teacher",
        location: "Enugu, Nigeria",
        phone: "+234 807 890 1234",
        photo: "",
        photo_path: "",
        created_at: "2024-09-01T00:00:00Z"
      },
      {
        id: "exec-008",
        name: "Miriam Bello",
        role: "Treasurer",
        profession: "Accountant",
        location: "Abuja, Nigeria", 
        phone: "+234 808 901 2345",
        photo: "",
        photo_path: "",
        created_at: "2024-09-01T00:00:00Z"
      }
    ],
    is_active: true,
    created_at: "2024-09-01T00:00:00Z",
    updated_at: "2024-09-01T00:00:00Z"
  }
]

const aboutLeadershipData = [
  {
    name: "Sarah Johnson",
    position: "President",
    bio: "Senior studying Psychology, passionate about discipleship and community building. Leads our fellowship with wisdom and compassion, always putting others first and creating an environment where everyone can grow in their faith.",
    order: 0,
    is_active: true
  },
  {
    name: "Michael Chen",
    position: "Vice President",
    bio: "Junior studying Engineering, leads our outreach and service initiatives. Brings technical expertise and innovative thinking to help us better serve our community and share God's love through practical action.",
    order: 1,
    is_active: true
  },
  {
    name: "Emily Rodriguez",
    position: "Worship Leader",
    bio: "Sophomore studying Music, coordinates our worship and prayer ministries. Uses her musical gifts to create powerful worship experiences that draw us closer to God and help us express our love for Him through song.",
    order: 2,
    is_active: true
  }
]

const aboutContentData = {
  mission: "To create a welcoming community where Christian students can grow in their faith, build meaningful relationships, and develop as leaders who will make a positive impact in their communities and world.",
  vision: "To see every student on campus have the opportunity to encounter Jesus Christ and experience the transforming power of His love through authentic community, biblical teaching, and practical service.",
  love_value: "We believe in showing Christ's love through our actions, words, and relationships with one another, creating a culture of grace and acceptance.",
  community_value: "We value authentic relationships and believe that we grow best when we do life together, supporting each other through challenges and celebrations.",
  truth_value: "We are committed to studying and living according to God's Word as our ultimate authority, seeking wisdom and guidance through scripture."
}

export async function POST(request: Request) {
  try {
    // Check for admin secret in header for security
    const authHeader = request.headers.get("x-seed-secret")
    const seedSecret = process.env.SEED_SECRET || "csf-seed-2024"
    
    if (authHeader !== seedSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Provide valid x-seed-secret header." },
        { status: 401 }
      )
    }

    const results = {
      events: 0,
      alumni: 0,
      testimonials: 0,
      gallery: 0,
      leaders: 0,
      ministries: 0,
      executives: 0,
      aboutLeadership: 0,
      aboutContent: 0,
      errors: [] as string[]
    }

    // Check if data already exists
    const eventsCheck = await getDocs(query(collection(db, "events"), limit(1)))
    if (!eventsCheck.empty) {
      return NextResponse.json({
        message: "Database already has data. Delete existing data first or use force=true query param.",
        hint: "You can manage data from the admin dashboard at /admin"
      })
    }

    // Seed Events
    for (const event of eventsData) {
      await addDoc(collection(db, "events"), {
        ...event,
        createdAt: serverTimestamp()
      })
      results.events++
    }

    // Seed Alumni
    for (const alum of alumniData) {
      await addDoc(collection(db, "alumni"), {
        ...alum,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      results.alumni++
    }

    // Seed Testimonials
    for (const testimonial of testimonialsData) {
      await addDoc(collection(db, "testimonials"), {
        ...testimonial,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      results.testimonials++
    }

    // Seed Gallery
    for (const item of galleryData) {
      await addDoc(collection(db, "gallery"), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      results.gallery++
    }

    // Seed Leadership
    for (const leader of leadershipData) {
      await addDoc(collection(db, "executive_leaders"), {
        ...leader,
        createdAt: serverTimestamp()
      })
      results.leaders++
    }

    // Seed Ministries
    for (const ministry of ministriesData) {
      await addDoc(collection(db, "ministries"), {
        ...ministry,
        createdAt: serverTimestamp()
      })
      results.ministries++
    }

    // Seed Executives
    for (const executiveTenure of executivesData) {
      await addDoc(collection(db, "executive_tenures"), {
        ...executiveTenure,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      results.executives++
    }

    // Seed About Leadership
    for (const leader of aboutLeadershipData) {
      await addDoc(collection(db, "about_leadership"), {
        ...leader,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      })
      results.aboutLeadership++
    }

    // Seed About Content
    await setDoc(doc(db, "about_content", "main"), {
      ...aboutContentData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    results.aboutContent++

    return NextResponse.json({
      success: true,
      message: "Seed completed successfully!",
      results,
      note: "Resources were NOT seeded - admin will add real resources manually. Donations, Messages, and Prayer Requests come from user submissions."
    })

  } catch (error: any) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Seed failed", details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint with x-seed-secret header to seed database",
    collections: ["events", "alumni", "testimonials", "gallery", "executive_leaders", "ministries", "executive_tenures", "about_leadership", "about_content"],
    note: "Resources are NOT seeded - admin will add real resources. Donations, Messages, and Prayer Requests come from user submissions.",
    usage: "curl -X POST /api/seed -H 'x-seed-secret: csf-seed-2024'"
  })
}
