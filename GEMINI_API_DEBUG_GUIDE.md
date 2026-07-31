# Gemini API Debug Guide

## Issue: API request failed with status 400

If you're encountering "API request failed with status 400" when clicking the "Generate Verses" button, follow these steps:

## 1. Test the API Connection

First, use the new "Test Gemini API" button in the Half Night tab to diagnose the issue:

1. Go to the Half Night tab
2. Click the "Test Gemini API" button
3. Check the toast notification for detailed error information

## 2. Check Your API Key

### Verify API Key Format
Your Gemini API key should look like: `AIzaSyD...` (starts with "AIzaSy")

### Common Issues:
- **Missing API Key**: Add `NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here` to `.env.local`
- **Invalid API Key**: Ensure you're using a valid Gemini API key from Google AI Studio
- **Expired API Key**: Regenerate a new key if needed

### How to Get a Gemini API Key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local` file

## 3. Environment Variable Setup

Create or update your `.env.local` file:

```env
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- The file must be named `.env.local` (not `.env`)
- Place it in the root directory of your project
- Restart your development server after adding/changing the key
- Never commit this file to version control

## 4. API Quota and Limits

### Common 400 Errors:
- **Rate Limiting**: Too many requests in a short time
- **Invalid Request**: Malformed prompt or request body
- **Quota Exceeded**: Daily/monthly limit reached

### Solutions:
- Wait a few minutes between requests
- Check your Google AI Studio quota
- Reduce request frequency

## 5. Debug Steps

### Step 1: Check Console Logs
Open browser dev tools and check the console for detailed error messages.

### Step 2: Test API Endpoint Directly
Visit: `http://localhost:3000/api/test-gemini` to test the API directly.

### Step 3: Verify Environment Variables
Add this temporary check to see if your key is loaded:
```javascript
console.log('API Key exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY)
console.log('API Key length:', process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length)
```

## 6. Fallback Behavior

When the API fails, the system automatically uses fallback verses:
- Psalm 23:1-3
- John 3:16  
- Philippians 4:6-7

## 7. Common Error Messages and Solutions

### "API Key Missing"
- **Cause**: Environment variable not set
- **Solution**: Add `NEXT_PUBLIC_GEMINI_API_KEY` to `.env.local`

### "Invalid API Key Format"
- **Cause**: API key is too short or malformed
- **Solution**: Get a new key from Google AI Studio

### "API Request Error (400)"
- **Cause**: Malformed request or invalid prompt
- **Solution**: Check prayer points format, try again

### "API Access Denied (403)"
- **Cause**: Invalid or expired API key
- **Solution**: Regenerate API key

### "Rate Limit Exceeded (429)"
- **Cause**: Too many requests
- **Solution**: Wait and try again later

## 8. Testing Checklist

- [ ] API key is added to `.env.local`
- [ ] API key starts with "AIzaSy"
- [ ] Development server was restarted after adding key
- [ ] "Test Gemini API" button shows success
- [ ] Prayer points are added before generating verses
- [ ] Internet connection is stable

## 9. Support

If issues persist:
1. Check the browser console for detailed errors
2. Verify your Google AI Studio account status
3. Ensure your API key has the correct permissions
4. Contact support if needed

---

**Note**: The system will always provide fallback verses if the API fails, so the Half Night schedule functionality remains usable even with API issues.
