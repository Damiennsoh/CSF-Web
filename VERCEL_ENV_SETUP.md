# Vercel Environment Variables Setup

## Required Environment Variables for Cloudinary

To fix the "Unknown API key" and missing environment variable errors on production, you must add these variables to your Vercel Project Settings.

### 🚨 Critical Variables (Server-Side)

These must be added to Vercel Environment Variables:

```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 📱 Client-Side Variables (Public)

These must also be added to Vercel (with NEXT_PUBLIC_ prefix):

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

## How to Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Select your project: `CSF-website`

### Step 2: Navigate to Environment Variables
1. Go to **Settings** tab
2. Click **Environment Variables** in the sidebar

### Step 3: Add Each Variable
For each variable above:
1. Click **Add New**
2. **Name**: Enter the variable name exactly as shown
3. **Value**: Enter the corresponding value
4. **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click the **...** menu on your latest deployment
3. Select **Redeploy**

## Verification

After deployment, test the Cloudinary functionality:

1. Visit: `https://your-domain.vercel.app/api/cloudinary/diagnose`
2. Check that all variables show as present
3. Try uploading/deleting an alumni profile picture

## Common Issues

### ❌ "Unknown API key" Error
- **Cause**: Missing `CLOUDINARY_API_KEY` or `CLOUDINARY_API_SECRET` on Vercel
- **Fix**: Add the server-side variables to Vercel Environment Variables
- **Important**: Check for trailing spaces in your environment variable values when copying to Vercel

### ❌ "cloud_name is disabled" Error  
- **Cause**: Missing `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` on Vercel
- **Fix**: Add the client-side variable with NEXT_PUBLIC_ prefix

### ❌ "Environment variables not defined" Error
- **Cause**: Variables not added to Vercel or deployment not restarted
- **Fix**: Add all required variables and redeploy

### ❌ File Deletion Still Failing After Environment Setup
- **Cause**: Trailing spaces or hidden characters in environment variable values
- **Fix**: Re-enter the environment variables manually instead of copy-pasting, or ensure no trailing spaces

## Firebase Variables (Already Working)

Your Firebase variables are working correctly, but for completeness:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

## Quick Copy-Paste

Copy these variables directly into Vercel:

### Server-Side (No NEXT_PUBLIC_ prefix):
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Client-Side (With NEXT_PUBLIC_ prefix):
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

## After Setup

Once you've added these variables to Vercel and redeployed:

1. ✅ Cloudinary uploads will work on production
2. ✅ Cloudinary deletes will work on production  
3. ✅ Alumni profile picture management will work
4. ✅ Executive profile picture management will work
5. ✅ All file upload functionality will work

The enhanced resourceType detection will also ensure proper file type handling for all uploads.
