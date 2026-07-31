# 🚨 Fix Gemini API Key Issue - Step by Step

## Error: "API key not valid. Please pass a valid API key."

### Quick Fix Steps:

## 1. Get a Valid Gemini API Key

1. **Visit Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the API key** (it should look like: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## 2. Update Your Environment File

Create or update your `.env.local` file in the ROOT of your project:

```env
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- Replace `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual API key
- File must be named `.env.local` (not `.env`)
- Place it in the main project folder (same level as `package.json`)
- **Restart your development server** after adding the key

## 3. Verify the API Key

Your API key should:
- ✅ Start with `AIza`
- ✅ Be at least 30 characters long
- ✅ Not contain spaces or quotes

## 4. Test the Fix

1. **Stop your development server** (Ctrl+C)
2. **Restart it**: `npm run dev`
3. **Go to the Half Night tab**
4. **Click "Test Gemini API" button**
5. **Should show "API Test Successful"**

## 5. If Still Not Working

### Check Common Issues:

1. **Wrong file name**: Must be `.env.local` (not `.env` or `.env.txt`)
2. **Wrong location**: Must be in project root folder
3. **Server not restarted**: Environment variables only load on server start
4. **Invalid key**: Get a fresh key from Google AI Studio
5. **Copy-paste errors**: Ensure no extra spaces or quotes

### Debug Steps:

1. **Check console**: Open browser dev tools and look for error details
2. **Test API directly**: Visit `http://localhost:3000/api/test-gemini`
3. **Verify key format**: Should be like `AIzaSyD...` (39 characters total)

## 6. Alternative: Use Fallback Verses

If the API doesn't work, the system automatically uses these verses:
- Psalm 23:1-3
- John 3:16
- Philippians 4:6-7

The Half Night schedule will still work perfectly with these fallback verses.

## 7. Need Help?

If you're still having issues:
1. Double-check the API key format
2. Ensure the `.env.local` file is in the right location
3. Restart your development server
4. Check the browser console for detailed errors

---

**Remember**: The API key should look exactly like this: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (39 characters, starts with "AIza")
