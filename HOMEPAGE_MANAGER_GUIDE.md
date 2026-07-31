# Homepage Sections Manager - Implementation Guide

## Overview
The Homepage Sections Manager is a centralized admin dashboard for managing all homepage content (Events, Alumni, Testimonials, Gallery, Leadership, and Resources) in a single unified interface. This replaces the need to navigate between separate admin pages for each content type.

## Architecture

### New Components Created

#### 1. **Homepage Sections Manager Page** (`/app/admin/homepage/page.tsx`)
The main unified dashboard that:
- Fetches all active items from 6 content collections
- Displays each section as a card with item counts
- Provides quick preview of items (max 4 items per section)
- Shows "+X more items" indicator if there are more items
- Allows inline deletion of items
- Routes to full editors for detailed editing
- Routes to add pages for creating new items
- Supports touch-friendly interactions on mobile

**Key Features:**
- Real-time data loading from Firestore
- Mobile-first responsive design (1 column mobile → 3 columns desktop)
- Quick delete with toast notifications
- Edit/View All/Add buttons for each section
- Permission checks via auth context

#### 2. **Homepage Section Preview Component** (`/components/homepage-section-preview.tsx`)
A reusable component that displays a single section with:
- Section icon and title
- Item count badge
- Item preview list (max 4 items)
- Thumbnail images (if applicable)
- Inline edit/delete buttons
- "Manage All" and "Add" footer buttons

**Configuration:**
Each section is configured with:
- Display title and icon
- Collection path
- Item labeling logic (varies by section)
- Image display settings
- Edit/add routes

## Data Structure

The manager displays data from these Firestore collections:

### Events (`events`)
```
{
  id: string
  title: string
  description: string
  eventDate: string
  time: string
  location: string
  imageUrl?: string
  isFeatured: boolean
  isActive: boolean
  eventType: string
}
```

### Alumni (`alumni`)
```
{
  id: string
  name: string
  degree: string
  current_occupation?: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  graduation_year: number
}
```

### Testimonials (`testimonials`)
```
{
  id: string
  name: string
  content: string
  role?: string
  company?: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
}
```

### Gallery (`gallery`)
```
{
  id: string
  title: string
  image_url: string
  category: string
  is_featured: boolean
  is_active: boolean
  display_order: number
}
```

### Leadership (`executive_leaders`)
```
{
  id: string
  name: string
  position: string
  role: string
  bio?: string
  photo_url?: string
  is_active: boolean
}
```

### Resources (`spiritual_resources`)
```
{
  id: string
  title: string
  file_url: string
  category: string
  is_featured: boolean
  is_active: boolean
}
```

## Usage Workflow

### Accessing the Manager

1. **Login as Admin**
   - Navigate to `/admin` (Admin Dashboard)
   - You must have admin privileges to access

2. **Click Homepage Sections Manager**
   - New "Quick Actions" section at top of dashboard
   - Blue card labeled "Homepage Sections Manager"
   - Or navigate directly to `/admin/homepage`

### Managing Content

#### Viewing All Items in a Section
1. Click "Manage All" button on any section card
2. Routes to the detailed admin page for that section
3. Full CRUD operations available there

#### Adding New Items
1. Click "Add" button on section card, OR
2. Click "Manage All" then "Add" in detailed page
3. Form will open for that specific content type
4. Fill in required fields
5. Upload images/files if applicable
6. Save - item will appear in preview immediately

#### Editing Items
1. Hover over item in section preview
2. Click "Edit" icon (pencil)
3. Routes to detailed edit page
4. Make changes and save
5. Changes reflect immediately in preview

#### Deleting Items
1. Hover over item in section preview
2. Click "Delete" icon (trash)
3. Item is immediately removed
4. Toast notification confirms deletion
5. Preview updates in real-time

### Mobile Responsiveness

The manager is fully mobile-optimized:
- **Mobile (< 768px)**: Single column layout, stacked cards
- **Tablet (768px - 1024px)**: 2 column grid
- **Desktop (> 1024px)**: 3 column grid
- Touch-friendly button sizes (44px minimum)
- Vertical item stacking on mobile, horizontal on larger screens
- Full-width cards on mobile, constrained on desktop

## Integration with Homepage

All items managed through the Homepage Sections Manager are automatically reflected on the public homepage and individual content pages:

### Homepage Sections Component Updates
- `EventsPreview` component fetches from `events` collection
- `FeaturedAlumniSection` fetches from `alumni` collection
- `TestimonialsSection` fetches from `testimonials` collection
- `GalleryHomepageSection` fetches from `gallery` collection
- `LeadershipSection` fetches from `executive_leaders` collection
- `Spiritual Resources` fetches from `spiritual_resources` collection

### Real-time Sync
- Changes in admin dashboard are immediately reflected
- No caching required - reads directly from Firestore
- Publish/unpublish items using `is_active` and `isFeatured` flags

## Database Queries

The manager uses optimized Firestore queries:

```typescript
// Events - ordered by date (ascending)
query(collection(db, "events"), 
  where("isActive", "==", true),
  orderBy("eventDate", "asc")
)

// Alumni - ordered by graduation year (descending)
query(collection(db, "alumni"),
  where("is_active", "==", true),
  orderBy("graduation_year", "desc")
)

// Testimonials - ordered by creation date (descending)
query(collection(db, "testimonials"),
  where("is_active", "==", true),
  orderBy("createdAt", "desc")
)

// Gallery - ordered by display order (ascending)
query(collection(db, "gallery"),
  where("is_active", "==", true),
  orderBy("display_order", "asc")
)

// Leadership - ordered by name (ascending)
query(collection(db, "executive_leaders"),
  where("is_active", "==", true),
  orderBy("name", "asc")
)

// Resources - all records
collection(db, "spiritual_resources")
```

## Features & Benefits

✅ **Unified Management**
- All homepage content in one place
- No need to navigate between multiple pages
- Complete overview of all sections at a glance

✅ **Mobile-First Design**
- Fully responsive on all devices
- Touch-friendly buttons and interactions
- Optimized layout for small screens

✅ **Quick Actions**
- Inline delete with one click
- Hover to reveal edit buttons
- Direct links to add new items

✅ **Real-Time Updates**
- Changes immediately reflected
- No page refresh needed
- Live item count updates

✅ **Firestore Integration**
- Secure database operations
- Row-level security compatible
- Optimized queries for performance

✅ **Accessibility**
- Semantic HTML
- ARIA labels on buttons
- Keyboard navigation support
- Screen reader friendly

## Troubleshooting

### Items Not Showing
1. Check if items are marked as `is_active: true` or `isActive: true`
2. Verify Firestore collections exist
3. Check browser console for errors
4. Try refreshing the page

### Images Not Loading
1. Verify image URLs are valid and accessible
2. Check Firebase Storage permissions
3. Ensure images uploaded through admin dashboard
4. Check image file paths in Firestore

### Delete Not Working
1. Verify user has admin privileges
2. Check Firestore RLS policies
3. Ensure item ID is correct
4. Check browser console for error messages

### Performance Issues
1. Large datasets may load slowly
2. Consider archiving old content
3. Use `is_active` flag to hide inactive items
4. Monitor Firestore read operations

## Future Enhancements

Potential improvements to consider:
- Bulk edit/delete operations
- Drag-and-drop reordering
- Advanced filtering and search
- Backup and restore functionality
- Scheduled publishing
- Content drafts
- Multi-language support
- Analytics and insights

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify Firestore permissions and security rules
4. Check admin user role and privileges
