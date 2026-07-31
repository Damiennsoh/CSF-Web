# Multi-Platform Deployment Guide

This app is configured for deployment on both **Vercel** and **Cloudflare Workers**. Choose the platform that best fits your needs.

## Quick Start

### Deploy to Vercel (Recommended)

Vercel is the recommended platform for Next.js apps with the best performance and easiest setup.

#### Using Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your repository
5. Add your environment variables in "Settings" → "Environment Variables"
6. Click "Deploy"

#### Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
npm run deploy:vercel

# Preview deployment (staging)
npm run preview:vercel
```

#### Environment Variables for Vercel
Add these in Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_GEMINI_API_KEY`

### Deploy to Cloudflare Pages/Workers

Cloudflare offers a globally distributed edge network with excellent performance.

#### Prerequisites
1. Create a [Cloudflare account](https://dash.cloudflare.com)
2. Install Wrangler CLI:
   ```bash
   npm install -g @cloudflare/wrangler
   ```

#### Setup Wrangler
1. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

2. Update `wrangler.toml` with your Cloudflare details:
   - `account_id`: Your Cloudflare Account ID (found in Dashboard)
   - `zone_id`: Your domain's Zone ID (if using custom domain)

#### Deploy Commands

**Build for Cloudflare**
```bash
npm run build:cloudflare
```

**Deploy to Cloudflare**
```bash
npm run deploy:cloudflare
```

**Preview locally**
```bash
npm run preview:cloudflare
```

#### Environment Variables for Cloudflare
Set environment variables via Wrangler:
```bash
# For production environment
wrangler secret put CLOUDINARY_API_SECRET --env production
wrangler secret put NEXT_PUBLIC_GEMINI_API_KEY --env production

# For staging environment
wrangler secret put CLOUDINARY_API_SECRET --env staging
wrangler secret put NEXT_PUBLIC_GEMINI_API_KEY --env staging
```

Or add to `wrangler.toml`:
```toml
[env.production.vars]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY = "your-api-key"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "csf-mullana-web-preset"

[env.staging.vars]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY = "your-api-key"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "csf-mullana-web-preset"
```

## Platform Comparison

| Feature | Vercel | Cloudflare |
|---------|--------|-----------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Cost** | Free tier available | Free tier available |
| **Scaling** | Automatic | Automatic |
| **Custom Domain** | ✅ | ✅ |
| **SSL/TLS** | ✅ Free | ✅ Free |
| **Analytics** | ✅ | ✅ |
| **Environment Variables** | ✅ | ✅ |
| **Preview Deployments** | ✅ | ✅ (limited) |
| **GitHub Integration** | ✅ | ✅ |

## Local Development

Run the app locally with hot reload:
```bash
npm run dev
```

Visit `http://localhost:3000`

## Building Locally

**For Vercel:**
```bash
npm run build:vercel
npm start
```

**For Cloudflare:**
```bash
npm run build:cloudflare
npm run preview:cloudflare
```

## Project Structure

```
├── app/                      # Next.js App Router
├── components/              # Reusable React components
├── public/                  # Static assets
├── .next/                   # Build output (Vercel)
├── .opennext/              # Build output (Cloudflare)
├── next.config.mjs         # Next.js configuration
├── vercel.json             # Vercel deployment config
├── wrangler.toml           # Cloudflare Workers config
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## Key Features

- **Multi-platform compatible**: Works on both Vercel and Cloudflare
- **PWA support**: Progressive Web App capabilities with service workers
- **Image optimization**: Unoptimized images for edge compatibility
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **UI Components**: Radix UI + shadcn/ui
- **File Uploads**: Cloudinary integration
- **AI Integration**: Gemini API support

## Troubleshooting

### Build Errors
If the build fails, check:
1. Node.js version compatibility (use Node 18+)
2. All environment variables are set correctly
3. No TypeScript errors: `npm run type-check`

### Environment Variables Not Working
- **Vercel**: Check Project Settings → Environment Variables
- **Cloudflare**: Verify `wrangler.toml` or run `wrangler secret list`

### Performance Issues
- Check build size: `npm run build`
- Review lighthouse metrics in deployment logs
- Optimize images in `public/` folder

## Support

For platform-specific help:
- **Vercel**: https://vercel.com/docs/
- **Cloudflare**: https://developers.cloudflare.com/
- **Next.js**: https://nextjs.org/docs/

## Next Steps

1. Choose your deployment platform (Vercel recommended for simplicity)
2. Set up environment variables
3. Deploy using the commands above
4. Monitor your deployment logs
5. Set up custom domain (optional)

---

For questions or issues, check the respective platform's documentation or reach out to their support teams.
