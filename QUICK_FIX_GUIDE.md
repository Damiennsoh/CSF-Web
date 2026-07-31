# Quick Fix Guide - Admin Status & Profile Access Issues

## Current Issues
1. ❌ Admin status not showing (409 Conflict errors)
2. ❌ Profile page not loading (RLS blocking)
3. ❌ Console shows 409 and 406 errors

## Immediate Fix Steps

### Step 1: Run the SQL Script (CRITICAL)
**You MUST run this first before anything will work:**

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `scripts/fix-rls-policies-complete.sql`
4. Click "Run" or press Ctrl+Enter
5. Verify you see "Success" and policy names in the results

### Step 2: Verify Your User Exists
Run this query in Supabase SQL Editor:

```sql
SELECT id, email, is_admin, created_at 
FROM users 
ORDER BY created_at ASC;
```

**If you see your user:**
- Check if `is_admin` is `true` for the first user
- If not, run: `UPDATE users SET is_admin = true WHERE id = 'YOUR_USER_ID';`

**If you DON'T see your user:**
- The user needs to be created - this should happen automatically on next login
- If it doesn't, the upsert fix in the code will handle it

### Step 3: Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or clear localStorage: In console, type `localStorage.clear()` and refresh

### Step 4: Test the Application
1. Log out completely
2. Log back in
3. Check browser console for errors
4. Verify admin dashboard button appears
5. Navigate to `/profile` and verify it loads

## What Was Fixed

### Code Changes
1. ✅ **API Route for Admin Check** (`/api/admin-check`)
   - Uses service role key to bypass RLS
   - No more circular dependency issues

2. ✅ **API Route for Profile** (`/api/profile`)
   - Uses service role key to bypass RLS
   - Ensures profile always loads

3. ✅ **User Creation Fix** (`ensureUserInDatabase`)
   - Now uses `upsert` instead of `insert`
   - Handles 409 Conflict errors gracefully
   - Prevents duplicate user errors

4. ✅ **Profile Page Fix**
   - Now uses API route instead of direct database query
   - Better error handling and retry logic

### Database Changes (from SQL script)
1. ✅ **RLS Policies Fixed**
   - Non-recursive admin policies
   - Helper function `is_user_admin()` avoids circular dependencies
   - Users can always read their own profile

2. ✅ **First User Admin**
   - Automatically sets first user as admin
   - Trigger ensures admin status on creation

## Troubleshooting

### Still Getting 409 Errors?
- The upsert should handle this, but if you see it:
  1. Check if user exists: `SELECT * FROM users WHERE email = 'your@email.com';`
  2. If exists, delete and let it recreate: `DELETE FROM users WHERE email = 'your@email.com';`
  3. Log out and log back in

### Still Getting 406 Errors?
- This is usually a content negotiation issue
- Make sure you're using the latest code
- Clear browser cache completely
- Check that API routes are accessible (should return JSON)

### Profile Still Not Loading?
1. Check browser console for specific errors
2. Verify API route works: Visit `http://localhost:3000/api/profile` (should return 401 if not logged in)
3. Check Network tab in DevTools - look for `/api/profile` request
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### Admin Status Still Not Showing?
1. Verify user has `is_admin = true` in database
2. Check browser console for `/api/admin-check` errors
3. Verify API route works: Check Network tab for `/api/admin-check` request
4. Clear localStorage: `localStorage.removeItem('adminStatus')` in console

## Verification Queries

Run these in Supabase SQL Editor to verify everything is set up correctly:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Check helper function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'is_user_admin';

-- Check first user is admin
SELECT id, email, is_admin, created_at
FROM users 
ORDER BY created_at ASC 
LIMIT 1;
```

## Expected Behavior After Fix

✅ Admin dashboard button appears in navigation when logged in as admin
✅ Profile page loads without errors
✅ No 409 or 406 errors in console
✅ Admin status is cached and loads quickly
✅ User creation works without conflicts

## Still Having Issues?

If problems persist:
1. Check that all environment variables are set correctly
2. Verify the SQL script ran successfully (check for errors)
3. Check Supabase logs in dashboard for server-side errors
4. Review browser console and Network tab for specific error messages

