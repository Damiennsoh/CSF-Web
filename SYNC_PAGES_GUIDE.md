# Homepage & Dedicated Pages Sync Guide

## Overview
All homepage sections now sync with their dedicated pages. When content is managed from the admin dashboard, it automatically appears on both the homepage preview and the full dedicated page.

## Pages Sync Structure

### 1. Events
- **Homepage**: Shows featured upcoming events (next 3 days)
- **Dedicated Page**: `/events` - Shows ALL events, categorized by type (Special Events & Regular Gatherings)
- **Data Source**: `events` collection
- **Key Fields**: `eventDate`, `isActive`, `eventType`, `isFeatured`
- **Admin Control**: `/admin/events`

### 2. Alumni
- **Homepage**: Shows featured alumni (marked as `is_featured: true`)
- **Dedicated Page**: `/alumni` - Shows ALL alumni with search and year filters
- **Data Source**: `alumni` collection
- **Key Fields**: `graduation_year`, `is_active`, `is_featured`
- **Admin Control**: `/admin/alumni`

### 3. Testimonials
- **Homepage**: Shows featured testimonials (marked as `is_featured: true`)
- **Dedicated Page**: `/testimonials` - Shows ALL testimonials with role filtering
- **Data Source**: `testimonials` collection
- **Key Fields**: `is_featured`, `is_active`, `createdAt`, `role`
- **Admin Control**: `/admin/testimonials`

### 4. Gallery
- **Homepage**: Shows 8 featured gallery items with display_order sorting
- **Dedicated Page**: `/gallery` - Shows ALL gallery items with category filtering
- **Data Source**: `gallery` collection
- **Key Fields**: `display_order`, `is_featured`, `category`, `event_date`
- **Admin Control**: `/admin/gallery`

### 5. Leadership
- **Homepage**: Shows leaders where `is_current: true`
- **Dedicated Page**: `/leadership` - Shows ALL leaders with order sorting
- **Data Source**: `executive_leaders` collection
- **Key Fields**: `is_current`, `order`, `display_order`
- **Admin Control**: `/admin/leadership`

### 6. Ministries
- **Homepage**: Shows 6 ministries with display_order sorting
- **Dedicated Page**: `/ministries` - Shows ALL ministries with descriptions and resources
- **Data Source**: `ministries` collection
- **Key Fields**: `is_active`, `display_order`, `resource_url`
- **Admin Control**: `/admin/ministries`

### 7. Resources
- **Homepage**: Not displayed (user-uploaded only)
- **Dedicated Page**: `/resources` - Shows ALL resources with category filtering
- **Data Source**: `spiritual_resources` collection
- **Key Fields**: `category`, `date_uploaded`, `file_url`
- **Admin Control**: `/admin/resources`

### 8. Messages (View-Only)
- **Homepage**: Not displayed
- **Dedicated Page**: `/admin/messages` (view from admin)
- **Data Source**: `contact_messages` collection
- **Admin Control**: View-only, user submissions

### 9. Donations (View-Only)
- **Homepage**: Not displayed
- **Dedicated Page**: `/admin/donations` (view from admin)
- **Data Source**: `donations` collection
- **Admin Control**: View-only, user submissions

### 10. Prayer Requests (View-Only)
- **Homepage**: Not displayed
- **Dedicated Page**: `/admin/prayer-requests` (view from admin)
- **Data Source**: `prayer_requests` collection
- **Admin Control**: View-only, user submissions

## Navigation Links

All pages are linked in the main navigation bar:
- **Home** → `/`
- **Ministries** → `/ministries` (dropdown menu)
- **Events** → `/events`
- **Resources** → `/resources`
- **Gallery** → `/gallery`
- **Alumni** → `/alumni`
- **About** → `/about`
- **Contact** → `/contact`
- **Dashboard** → `/admin` (admin only)

## Sync Workflow

1. **Admin adds/edits/deletes content** via `/admin/{section}`
2. **Data saved to Firestore** with appropriate flags (is_featured, is_active, etc.)
3. **Homepage preview sections update** in real-time via Firestore listeners
4. **Dedicated pages fetch same data** with appropriate filters:
   - Homepage: Shows featured items only
   - Dedicated page: Shows all items with filtering/sorting options

## Important Notes

- **Featured vs All**: The homepage shows only featured or selected items, while dedicated pages show everything
- **Firestore Indexes**: Some queries have fallback mechanisms for missing composite indexes
- **Real-time Sync**: Changes propagate immediately - no manual refresh needed
- **Admin Dashboard**: Use `/admin/homepage` to manage all sections from one place
- **User Submissions**: Messages, Donations, and Prayer Requests are view-only in the admin panel

## Testing Sync

1. Add/Edit content via admin dashboard
2. Check homepage for preview appearance (if featured)
3. Navigate to dedicated page and verify full content displays
4. Test search/filter functionality on dedicated page
5. Try from different devices (mobile, tablet, desktop)
