# Homepage & Community Manager - Complete System Update

## Overview
The Homepage Sections Manager has been expanded to include ALL homepage sections and community submissions, providing a comprehensive unified dashboard for managing the entire website's content ecosystem.

## Complete Section Coverage

### Editable Homepage Sections (with mockup seeding)
1. **Events** - Upcoming and past events with full CRUD operations
2. **Alumni Network** - Graduate profiles and testimonials
3. **Testimonials** - Student stories and impact narratives
4. **Gallery** - Photo albums and visual memories
5. **Leadership** - Executive team and organizational structure
6. **Ministries** - Ministry groups and programs **(NEW)**

### View-Only Community Submissions
7. **Donations** - Financial contributions from supporters
8. **Messages** - Contact form submissions from visitors
9. **Prayer Requests** - Prayer needs from community members

### Separately Managed (Not Seeded)
10. **Resources** - Spiritual resources uploaded directly by admin

## System Architecture

### Database Collections
```
Firestore Root
├── events (Editable - Full CRUD)
├── alumni (Editable - Full CRUD)
├── testimonials (Editable - Full CRUD)
├── gallery (Editable - Full CRUD)
├── executive_leaders (Editable - Full CRUD)
├── ministries (Editable - Full CRUD) [NEW]
├── donations (View-Only - Deletable)
├── contact_messages (View-Only - Deletable)
├── prayer_requests (View-Only - Deletable)
└── spiritual_resources (Editable - Manual Upload)
```

## New Features Added

### 1. Ministries Management
- **6 Pre-seeded Ministries**:
  - Women's Fellowship
  - Men's Fellowship
  - CSF Choir
  - Bible Study Group
  - Evangelism & Outreach
  - Intercession Group

- Full CRUD operations just like other sections
- Display order support for homepage arrangement
- Resource attachments for ministry materials

### 2. Expanded Homepage Manager
The Homepage Sections Manager now displays:
- **6 Editable Preview Cards** - Complete with add/edit/delete buttons
- **3 View-Only Cards** - Donations, Messages, Prayers (view & delete only)
- Real-time item counts from Firestore
- Mobile-responsive grid (1 → 2 → 3 columns)

### 3. Enhanced Seed Database Tool
The seed page now includes:
- **Ministries data** (6 items)
- **View-only section** showing Donations, Messages, Prayers counts
- Updated success message with ministries count
- New link to "Homepage Manager" in quick actions

## Updated Files

### Core Implementation Files
1. **`/app/admin/homepage/page.tsx`** - Main manager (now 10 sections)
2. **`/components/homepage-section-preview.tsx`** - Preview component (with view-only support)
3. **`/app/api/seed/route.ts`** - API endpoint (now seeds ministries)
4. **`/app/admin/seed/page.tsx`** - Seed UI (now shows all 10 sections)
5. **`/app/admin/page.tsx`** - Dashboard (with new quick action card)

## How It Works

### Unified Management Workflow
1. **Access Homepage Manager**:
   - Admin Dashboard → "Quick Actions" → "Homepage Sections Manager"
   - Or directly navigate to `/admin/homepage`

2. **View Sections**:
   - 3-column grid showing all sections
   - Each card displays item count and preview items
   - View-only cards show amber badge

3. **Manage Editable Sections**:
   - Click "Add" to create new items
   - Click "Manage All" for detailed editor
   - Hover over items for quick edit/delete
   - Changes immediately reflect on homepage

4. **View Community Submissions**:
   - View donations, messages, and prayers
   - Click "Manage All" to go to detailed view
   - Delete items directly from manager
   - No inline editing (view-only)

### Seeding Process
1. Go to **Admin Dashboard** → **"Seed Database"** card
2. Review mockup data counts:
   - 5 Events
   - 5 Alumni
   - 5 Testimonials
   - 8 Gallery Items
   - 6 Leaders
   - 6 Ministries **(NEW)**
   - 0 Resources (Admin adds manually)
   - User submissions (Donations, Messages, Prayers)
3. Click **"Seed Database with Mockup Data"**
4. Data appears on homepage sections and individual pages
5. Visit **"Homepage Manager"** to edit all seeded data

## Data Flow Diagram

```
Homepage Manager
│
├── Editable Sections
│   ├── Events → /admin/events
│   ├── Alumni → /admin/alumni
│   ├── Testimonials → /admin/testimonials
│   ├── Gallery → /admin/gallery
│   ├── Leadership → /admin/leadership
│   └── Ministries → /admin/ministries [NEW]
│
├── View-Only Sections
│   ├── Donations → /admin/donations (view only in manager)
│   ├── Messages → /admin/messages (view only in manager)
│   └── Prayers → /admin/prayer-requests (view only in manager)
│
└── Sync to Homepage
    ├── Homepage preview components
    ├── Individual content pages
    └── Real-time via Firestore listeners
```

## Key Features

### Mobile-First Design
- Single column on mobile devices
- 2 columns on tablets (md:)
- 3 columns on desktop (lg:)
- All buttons and controls fully responsive

### Real-Time Updates
- Changes in manager instantly update homepage
- No manual refresh needed
- Firestore listeners keep content in sync
- View-only sections reflect user submissions

### View-Only Safety
- Donations, Messages, and Prayers marked with amber badge
- Edit/Delete buttons hidden on view-only cards
- "Add" button unavailable for view-only sections
- Can only view details or delete items
- Links to full managers for detailed viewing

### User Experience
- Icon-coded sections for quick recognition
- Status badges showing active/inactive
- Hover effects for action visibility
- Toast notifications for all operations
- Loading states during operations

## Accessing Different Sections

### From Homepage Manager
- **Events**: Hover item → Edit | Delete, or "Manage All" → `/admin/events`
- **Alumni**: Same flow → `/admin/alumni`
- **Testimonials**: Same flow → `/admin/testimonials`
- **Gallery**: Same flow → `/admin/gallery`
- **Leadership**: Same flow → `/admin/leadership`
- **Ministries**: Same flow → `/admin/ministries`
- **Donations**: "View All" button → `/admin/donations`
- **Messages**: "View All" button → `/admin/messages`
- **Prayers**: "View All" button → `/admin/prayer-requests`

### From Admin Dashboard
- Click "Quick Actions" card → "Homepage Sections Manager"
- Or use sidebar navigation to individual sections
- New seed page shows all sections

## Content Sync Verification

All content is automatically synced because:
1. Homepage sections use **shared Firestore collections**
2. Individual pages **query same collections**
3. Homepage manager **edits same documents**
4. Changes propagate **instantly via listeners**

No duplicate data, no manual syncing needed.

## Next Steps for Admin

1. **Initial Setup**:
   - Visit `/admin/seed` and run seeding
   - Review data on homepage and individual pages

2. **Content Management**:
   - Use Homepage Manager for quick overview
   - Use individual admin pages for detailed editing
   - Add real resources to Resources section

3. **Ongoing Updates**:
   - Edit events, add new ministries
   - Respond to prayer requests
   - View and manage donations
   - Monitor contact messages

4. **Customization**:
   - Adjust display order of items
   - Set featured/active status
   - Add image URLs to items
   - Update descriptions and details

## Troubleshooting

### Section Not Showing in Manager
- Check Firestore has data for that collection
- Verify `is_active` field is `true`
- Run seed again if collection is empty

### View-Only Sections Not Showing
- Ensure users have submitted donations, messages, or prayers
- Check Firestore contact_messages, donations, prayer_requests collections
- These only appear when users submit them

### Changes Not Reflecting
- Manager caches data - refresh page if needed
- Check browser console for errors
- Verify admin has edit permissions
- Check Firestore RLS policies

## Future Enhancements

Potential improvements for next phases:
- Bulk edit operations
- Scheduled publishing
- Content scheduling
- Multi-image uploads per item
- Category/tag organization
- Search within sections
- Version history/rollback
- Export/backup functionality

---

**Last Updated**: March 2025  
**Version**: 2.0 (Complete System)  
**Status**: Production Ready
