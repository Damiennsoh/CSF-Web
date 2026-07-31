# CSF Enhanced Schedule System - Setup Guide

## Overview
The Enhanced CSF Schedule Modal provides a robust dual-storage system for managing fellowship schedules with both draft and live modes.

## Key Features
- **Dual Storage**: IndexedDB for drafts (admin only), Firestore for live schedules (all users)
- **Session Persistence**: Drafts persist across page reloads and browser sessions
- **Admin/Viewer Modes**: Separate interfaces for admins and regular users
- **Real-time Updates**: Live schedules update in real-time for all viewers
- **Member Management**: Dynamic team member management with dropdown assignments
- **Auto-save**: Drafts automatically save as you work

## Architecture

### Storage Layers
1. **IndexedDB (Browser)**
   - Stores draft schedules
   - Admin settings and preferences
   - Member lists and institution details
   - Persists across sessions

2. **Firestore (Cloud)**
   - Stores published live schedules
   - Accessible to all authenticated users
   - Real-time synchronization
   - Version history tracking

### User Roles
- **Admin**: Can create drafts, edit schedules, publish to live
- **Viewer**: Can only view published live schedules

## Setup Instructions

### 1. Firebase Configuration
Ensure your Firebase config in `/lib/firebase.ts` includes:

```typescript
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

### 2. Firestore Security Rules
Apply the security rules from `firestore-rules-csf-schedule.rules`:

1. Go to Firebase Console → Firestore Database → Rules
2. Replace existing rules with the content from the file
3. Publish the rules

### 3. Authentication Setup
Ensure users have custom claims for admin access:

```typescript
// Set admin claim (run once per admin)
import { getAuth } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"

const auth = getAuth()
const functions = getFunctions()

const setAdminClaim = httpsCallable(functions, 'setAdminClaim')
await setAdminClaim({ uid: 'user-uid', isAdmin: true })
```

### 4. Component Integration
The schedule system is integrated into the app layout and uses:

```tsx
import ScheduleModal from '@/components/schedule-modal'
import { ScheduleFloatingButton } from '@/components/schedule-floating-button'

// In your component:
<ScheduleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />

// Floating button (automatically added to layout):
<ScheduleFloatingButton />
```

## Usage Guide

### For Admins

#### Creating a Draft Schedule
1. Open the schedule modal in admin mode
2. Ensure you're in "Draft" mode (orange indicator)
3. Configure organization details in "System Setup" tab
4. Add team members in "Team Members" tab
5. Click "Generate Schedule" to create a new draft
6. Edit assignments by clicking on cells (only editable cells)
7. Changes auto-save to IndexedDB

#### Publishing to Live
1. Complete your draft schedule
2. Click the "Publish" button (green, with Send icon)
3. Confirm publication - schedule becomes live for all users
4. View live schedule by switching to "Live" mode

#### Managing Drafts
- Drafts persist automatically across browser sessions
- Switch between Draft and Live modes using the toggle buttons
- Edit drafts anytime while in Draft mode
- Published schedules remain in Live mode for viewers

#### Member Management
1. Go to "Team Members" tab
2. Add new members using the input field
3. Remove members with the trash icon (hover to reveal)
4. Members are available in dropdown menus for assignments

### For Regular Users

#### Viewing Live Schedules
1. Open the schedule modal (automatically enters viewer mode)
2. View the published schedule in "Schedule View" tab
3. See team members in "Team Members" tab (read-only)
4. Real-time updates when admin publishes changes

#### Limitations
- Cannot edit schedules
- Cannot access System Setup
- Cannot add/remove members
- Only sees published live schedules

## Data Structure

### Schedule Item Interface
```typescript
interface ScheduleItem {
  date: string;           // "DD/MM/YYYY"
  dayName: string;        // "Monday", "Tuesday", etc.
  leader: string;         // Person leading prayer
  word: string;          // Person sharing word
  isEditable: boolean;   // Can this cell be edited?
  isSpecial: boolean;    // Is this a special event?
}
```

### Institution Details
```typescript
interface InstitutionDetails {
  fellowshipName: string;  // "CSF FELLOWSHIP"
  institutionName: string; // "UNIVERSITY OF TECHNOLOGY"
  location: string;        // "MAIN CAMPUS, HALL A"
  startMonth: string;      // "0-11" (Jan-Dec)
  startYear: string;       // "2024"
  duration: string;        // "1-12" (months)
}
```

## Troubleshooting

### Common Issues

#### Draft not saving
- Check browser IndexedDB permissions
- Ensure you're in admin mode and draft mode
- Check browser console for errors
- Try refreshing the page

#### Cannot publish to Firestore
- Verify Firebase configuration
- Check user has admin claims
- Ensure you're online
- Check Firestore security rules

#### Live schedule not updating
- Check real-time listener connection
- Verify Firestore rules allow read access
- Ensure user is authenticated
- Check network connection

#### Member dropdown not working
- Ensure you're in admin and draft mode
- Check that members are added to the list
- Verify cell is editable (not special event)

### Debug Mode
Add this to your component for debugging:

```typescript
// Add to component state
const [debugMode, setDebugMode] = useState(false)

// Add debug console logs
useEffect(() => {
  if (debugMode) {
    console.log('Current mode:', { isAdmin, isDraftMode })
    console.log('Schedule data:', displayData.length)
    console.log('Live data:', liveData.length)
  }
}, [debugMode, isAdmin, isDraftMode, displayData, liveData])
```

## Performance Considerations

### IndexedDB Optimization
- Draft data is automatically cleaned after 30 days
- Large schedules are paginated in memory
- Auto-save is debounced to prevent excessive writes

### Firestore Optimization
- Real-time listeners are properly cleaned up
- Documents are limited to 1MB size
- Queries are optimized with proper indexing

### Browser Compatibility
- Works in all modern browsers (Chrome 80+, Firefox 75+, Safari 13+)
- IndexedDB required for draft functionality
- Fallback to localStorage if IndexedDB fails

## Security Notes

### Data Protection
- Draft data stored locally (client-side only)
- Live data encrypted in transit and at rest
- Admin access controlled by Firebase Auth
- No sensitive data in logs

### Access Control
- Admin claims verified server-side
- Firestore rules enforce role-based access
- Client-side checks for UX (server-side for security)
- Audit trail maintained in Firestore

## Future Enhancements

### Planned Features
- Schedule versioning and rollback
- Export to PDF/Word functionality
- Email notifications for schedule updates
- Mobile app integration
- Advanced reporting and analytics

### Scalability
- Support for multiple fellowships
- Hierarchical admin permissions
- Bulk schedule operations
- Integration with calendar systems

## Support

For technical support:
1. Check browser console for errors
2. Verify Firebase configuration
3. Test with different user roles
4. Review security rules
5. Check network connectivity

Remember: This system is designed to be robust and user-friendly while maintaining security and performance standards.
