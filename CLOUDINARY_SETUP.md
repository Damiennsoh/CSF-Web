# Cloudinary Setup Guide

## Overview
This guide will help you migrate from Firebase Storage to Cloudinary for file uploads while keeping Firebase for Authentication and Firestore.

## Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Create a new "cloud" (storage bucket)

## Step 2: Get Cloudinary Credentials

After creating your account, navigate to:
- **Dashboard** → **Account Details** → Get your **Cloud Name**
- **Settings** → **Security** → Generate **API Key** and **API Secret**
- **Settings** → **Upload** → Create an **Upload Preset** (unsigned)

## Step 3: Update Environment Variables

Copy the Cloudinary credentials to your `.env.local` file:

```env
# Add these to your existing .env.local
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

## Step 4: Install Dependencies (Optional)

The current implementation uses pure fetch API, so no additional packages are needed. However, if you prefer the official Cloudinary SDK:

```bash
npm install cloudinary
# or
yarn add cloudinary
```

## Step 5: Create Upload Preset

1. Go to Cloudinary Dashboard
2. Navigate to **Settings** → **Upload**
3. Click **Add upload preset**
4. Configure:
   - **Name**: `csf-website-uploads` (or any name you prefer)
   - **Mode**: Unsigned
   - **Allowed formats**: All formats you want to support
   - **Folder**: `csf-website` (recommended)
5. Copy the preset name to your `CLOUDINARY_UPLOAD_PRESET` env var

## Step 6: Test the Migration

The code has been updated to use Cloudinary instead of Firebase Storage:

- ✅ `lib/cloudinary-storage.ts` - New Cloudinary service
- ✅ `components/file-upload.tsx` - Updated to use Cloudinary
- ✅ All admin pages will use the updated FileUpload component

## Benefits of Cloudinary

- **No billing issues** - Free tier includes 25 credits/month
- **Better performance** - CDN delivery
- **Automatic optimization** - Image/video transformation
- **No region restrictions** - Works globally
- **Advanced features** - AI cropping, format optimization

## File Storage Structure

Files will be organized as:
```
csf-website/
├── gallery/
├── alumni/
├── events/
├── leadership/
├── testimonials/
└── resources/
```

## Next Steps

1. Set up your Cloudinary account
2. Add credentials to `.env.local`
3. Test file uploads in admin dashboard
4. Remove Firebase Storage references (optional)

## Migration Notes

- Firebase Authentication and Firestore remain unchanged
- Existing Firebase Storage URLs in database will still work
- New uploads will go to Cloudinary
- Delete functionality works with Cloudinary public IDs
