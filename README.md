# Christian Students Fellowship (CSF) Website

A comprehensive web application for the Christian Students Fellowship at Maharishi Markandeshwar University, built with Next.js, TypeScript, and Firebase.

## 🌟 Features

### Core Functionality
- **Responsive Design**: Fully mobile-responsive interface that works seamlessly across all devices
- **Modern UI/UX**: Clean, professional design using Tailwind CSS and shadcn/ui components
- **Database Integration**: Complete Firebase integration for dynamic content management
- **Admin Dashboard**: Comprehensive admin panel for content management
- **Authentication System**: Secure user registration and login with role-based access

### Main Sections

#### 🏠 Homepage
- Hero section with call-to-action buttons
- About section with mission, vision, and values
- Ministry overview cards
- Leadership team showcase
- Student testimonials
- Featured alumni network
- Prayer request submission form
- Quick access links to important sections

#### ⛪ Ministries
- **Individual Ministry Pages**: Detailed pages for each ministry including:
  - Women's Fellowship
  - Men's Fellowship
  - CSF Choir
  - Bible Study
  - Evangelism
  - Intercessory Group
- **Ministry Features**:
  - Leadership team with roles and contact information
  - Current member listings with positions and skills
  - Meeting schedules and locations
  - Recent activities and events
  - Ministry-specific resources

#### 📅 Events
- Upcoming events calendar
- Event registration system
- Regular and special event categories
- Event details with location and timing

#### 🖼️ Gallery
- Photo gallery with categorization
- Featured images
- Event-based photo organization
- Search and filter functionality

#### 🎓 Alumni Network
- Featured alumni profiles
- Alumni benefits and networking opportunities
- Graduation year filtering
- Professional achievements showcase

#### 📚 Spiritual Resources
- Devotionals and study guides
- Sermon collections
- Downloadable resources
- Resource categorization by type

#### 💝 Donation System
- Active donation campaigns
- Secure donation processing
- Campaign progress tracking
- Anonymous donation options

#### 🙏 Prayer Requests
- Anonymous prayer submission
- Urgent request marking
- Prayer team management
- Confidential handling

#### 📞 Contact
- Contact form with multiple categories
- Office hours and location information

#### 📅 Schedule Management
- **Weekly Schedule Creator**: Comprehensive schedule generation system with intelligent member assignment
  - Excel-like editable cells with dropdown member lists
  - Support for custom text entries and special event labels
  - Mobile-first responsive table design
  - Automatic draft persistence to IndexedDB
  - One-click publish to Firestore
  - Real-time updates visible to all users
- **Smart Cell Editing**: 
  - Click-to-edit inline cells with automatic dropdown closure
  - Member name suggestions with search filtering
  - Special event options (BIBLE STUDIES, HALF NIGHT, PRAYER & FASTING, etc.)
  - Custom text support for special occasions
  - Clear button to quickly remove assignments
- **Half Night Prayer Scheduler**: Dedicated interface for organizing prayer meetings with Bible verse integration
- **Smart Member Assignment**: 
  - Automatic rotation of leadership roles to ensure fair participation
  - Saturday special handling (leader only, word column blank)
  - Tuesday and Saturday support with automatic member assignment
- **Special Event Handling**: Automatic marking of special events (Half Night, Bible Studies, etc.)
- **Export Functionality**: Multiple export formats including Word documents (requires optional `npm install docx`)
- **Real-time Editing**: Inline editing with automatic saving to IndexedDB during draft mode
- **Bible Verse Integration**: Optional Bible verse integration for prayer events
- **Member Management**: Dynamic member list with search and filtering capabilities
- **Schedule Templates**: Pre-configured templates for different event types
- **Historical Tracking**: Maintains record of previous schedules for consistency
- **Mobile-Optimized**: Responsive table with condensed month display and touch-friendly controls
- **Draft & Publish Workflow**: Create schedules in draft mode, review, then publish to live site

### 🔧 Admin Features
- **User Management**: Admin role assignment and user oversight
- **Content Management**: Dynamic content updates for all sections
- **Ministry Management**: Add/edit ministries, leaders, and members
- **Event Management**: Create and manage events and registrations
- **Gallery Management**: Upload and organize photos
- **Resource Management**: Add spiritual resources and materials
- **Prayer Request Management**: View and manage prayer submissions
- **Donation Tracking**: Monitor campaigns and donations

## � Documentation

Comprehensive documentation for the CSF Website is available in the `DOCUMENTATION` directory:

| Document | Description |
|----------|-------------|
| [Download Implementation](./DOCUMENTATION/DOWNLOAD_IMPLEMENTATION.md) | Reusable DownloadButton component with Cloudinary integration |
| [File Deletion](./DOCUMENTATION/DELETION.md) | Cloudinary file deletion via server-side API |
| [Cloudinary Storage](./DOCUMENTATION/CLOUDINARY_STORAGE.md) | File upload, storage, and optimization |
| [Firestore Database](./DOCUMENTATION/FIRESTORE_DATABASE.md) | Database schema, CRUD operations, security rules |
| [Admin Dashboard](./DOCUMENTATION/ADMIN_DASHBOARD.md) | Admin features, authentication, and logging |

## ️ Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **File Storage**: Cloudinary (CDN + Media Optimization)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Icons**: Lucide React
- **Package Manager**: pnpm
- **Deployment**: Vercel

## 📱 Mobile Responsiveness & PWA

The application is fully responsive and optimized for:
- Mobile phones (320px and up)
- Tablets (768px and up)
- Desktop computers (1024px and up)
- Large screens (1280px and up)

Key responsive features:
- Collapsible navigation menu for mobile
- Responsive grid layouts
- Touch-friendly buttons and interactions
- Optimized typography scaling
- Mobile-first design approach

### Progressive Web App (PWA) Installation

The CSF Website is fully installable as a Progressive Web App on modern phones and devices:

**On Android:**
1. Open the website in Chrome or Edge
2. Tap the menu button (three dots)
3. Select "Install app" or "Add to Home screen"
4. Follow the prompts to install

**On iOS (15+):**
1. Open the website in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name the app and tap "Add"

**On Desktop:**
1. Open the website in Chrome, Edge, or Brave
2. Click the install icon in the address bar
3. Follow the installation prompts

**Features after installation:**
- Access the app offline (cached content)
- Standalone fullscreen experience (no browser UI)
- Launch from home screen/app drawer
- Works across all devices with your app data
- Receives updates automatically
- Fast loading times
- PWA shortcuts to Schedule, Events, and Ministries

## 📋 Schedule System Quick Guide

### Admin Schedule Management
1. Navigate to `/admin` dashboard
2. Access "Schedule Manager" from the menu
3. **Set Institution Details**: Name, university, location, duration
4. **Add Members**: Input member names one by one
5. **Generate Schedule**: Click "Generate Schedule" button
   - Monday: Optional (can be assigned names)
   - Tuesday: Automatic 2-person assignment
   - Wednesday: BIBLE STUDIES (special event)
   - Thursday: PRAYER & FASTING (special event)
   - Friday: Regular or Last Friday (Last Friday = HALF NIGHT)
   - Saturday: Single leader only (word column intentionally blank)
6. **Edit Assignments**: Click any cell to:
   - Select from member dropdown
   - Enter custom text
   - Choose special event labels
   - Clear the cell
7. **Publish Changes**: Click "Publish Changes" to save to Firestore
8. **Export**: Click "Export to Word" (requires `npm install docx`)

### User Schedule Viewing
- Navigate to `/schedule` page to view published schedules
- Public read-only view of all published schedules
- Real-time updates when admins publish changes

### Optional Dependencies
- **Word Export**: `npm install docx` (optional, graceful fallback if not installed)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- (Optional) docx package for Word export functionality

### Installation

1. **Clone the repository**
   ```bash
git clone <repository-url>
cd csf-website
```
   cd csf-website
   \`\`\`

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

4. **Set up Firebase database**
   Run the Firebase setup scripts in the following order:
   - `scripts/setup-firebase.sql`
   - `scripts/seed-firebase-data.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3001`

## 📊 Database Schema

### Core Tables
- `users` - User authentication and admin management
- `ministries` - Ministry information
- `ministry_leaders` - Ministry leadership roles
- `ministry_roles` - Specific ministry positions
- `ministry_members` - Ministry membership
- `ministry_schedules` - Meeting schedules
- `ministry_activities` - Ministry events and activities
- `executive_leaders` - Fellowship executive team
- `events` - Event management
- `prayer_requests` - Prayer submission system
- `student_testimonials` - Student testimonies
- `alumni` - Alumni network
- `gallery` - Photo gallery
- `spiritual_resources` - Resource library
- `donations` - Donation tracking
- `donation_campaigns` - Fundraising campaigns

## 🔐 User Roles

### Admin Users
- Full access to admin dashboard
- Content management capabilities
- User role management
- System configuration

### Regular Users
- Profile management
- Event registration
- Prayer request submission
- Resource access

### First User
- Automatically granted admin privileges
- Can assign admin roles to other users

## 🎨 Design System

### Color Palette
- Primary: Blue (#2563eb)
- Secondary: Green (#16a34a)
- Accent: Purple (#9333ea)
- Warning: Orange (#ea580c)
- Error: Red (#dc2626)

### Typography
- Headings: Inter font family
- Body text: System font stack
- Responsive font scaling

### Components
- Consistent button styles
- Card-based layouts
- Form components with validation
- Loading states and animations

## 📈 Performance Features

- **Image Optimization**: Next.js Image component for optimized loading
- **Code Splitting**: Automatic code splitting for faster page loads
- **Caching**: Efficient data caching strategies
- **SEO Optimization**: Meta tags and structured data
- **Progressive Enhancement**: Works without JavaScript

## 🔒 Security Features

- **Authentication**: Secure user authentication with Firebase
- **Authorization**: Role-based access control
- **Data Validation**: Input validation on both client and server
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start the production server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: csf@mmumullana.org
- Phone: +91 1731-274140
- WhatsApp: +91 98765 43210

## 🙏 Acknowledgments

- Maharishi Markandeshwar University for hosting the fellowship
- All CSF members and leaders for their contributions
- The open-source community for the amazing tools and libraries

---

**Built with ❤️ for the Christian Students Fellowship community**
