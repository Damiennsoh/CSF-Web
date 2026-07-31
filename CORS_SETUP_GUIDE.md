# Firebase Storage CORS Configuration Guide

## The Problem
The browser console shows CORS errors like:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

This happens because Firebase Storage hasn't been configured to allow uploads from your website domain.

## The Solution

### Option 1: Using gsutil (Recommended)

1. **Install Google Cloud SDK** if not already installed:
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or run: `gcloud components update`

2. **Authenticate with your Firebase project**:
   ```bash
   gcloud auth login
   gcloud config set project csf-website-ba751
   ```

3. **Apply the CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://csf-website-ba751.firebasestorage.app
   ```

4. **Verify the configuration**:
   ```bash
   gsutil cors get gs://csf-website-ba751.firebasestorage.app
   ```

### Option 2: Using Google Cloud Console (Web UI)

1. Go to https://console.cloud.google.com/storage/browser
2. Find your bucket: `csf-website-ba751.firebasestorage.app`
3. Click on the bucket name
4. Go to the "Configuration" tab
5. In the "CORS configuration" section, click "Edit"
6. Add the following CORS configuration:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": [
         "Content-Type",
         "Access-Control-Allow-Origin",
         "Authorization"
       ],
       "maxAgeSeconds": 3600
     }
   ]
   ```
7. Click "Save"

### Option 3: Using Firebase CLI

If you have Firebase CLI installed:

```bash
firebase login
firebase init storage  # if not already initialized
```

Then update `firebase.json` to include storage configuration, or use the gsutil method above.

## CORS Configuration File

The `cors.json` file in your project contains:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
       "Authorization",
      "X-Requested-With",
      "X-Upload-Content-Type",
      "X-Upload-Content-Length"
    ],
    "maxAgeSeconds": 3600
  }
]
```

**Note**: Using `"*"` allows all origins. For production, replace with your specific domains:
```json
"origin": [
  "http://localhost:3000",
  "https://csf-website-ba751.web.app",
  "https://csf-website-ba751.firebaseapp.com"
]
```

## After Applying CORS

1. Clear browser cache
2. Restart your dev server: `npm run dev`
3. Try uploading again in the admin panel

## Common Issues

### "gsutil command not found"
- Make sure Google Cloud SDK is installed and in your PATH
- On Windows, use Google Cloud SDK Shell

### "Access Denied" errors
- Ensure you have Owner or Storage Admin role in the Firebase project
- Run `gcloud auth login` again to refresh credentials

### Changes not taking effect
- CORS settings can take a few minutes to propagate
- Clear browser cache and try again
- Check browser console for specific error messages

## For Production

Before deploying to production, update `cors.json` to only allow your specific domains:

```json
{
  "origin": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
  ],
  "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "responseHeader": ["Content-Type", "Authorization"],
  "maxAgeSeconds": 3600
}
```

## Support

If you continue to have issues:
1. Check Firebase Storage rules in Firebase Console
2. Verify your user is authenticated (uploads require auth)
3. Check browser console for specific error codes
