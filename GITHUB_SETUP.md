# GitHub Actions Setup Guide

This guide will help you configure GitHub Actions to automatically deploy your app to both Vercel and Cloudflare.

## Step 1: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

### For Vercel Deployment

Add the following secrets:

| Secret Name | Where to Find | Instructions |
|------------|---------------|--------------|
| `VERCEL_TOKEN` | [Vercel Tokens](https://vercel.com/account/tokens) | Create a new personal access token in Vercel settings |
| `VERCEL_ORG_ID` | [Vercel Project Settings](https://vercel.com/docs/cli/using-vercel#vercel-cli-reference) | Run `vercel whoami` locally, or find in project settings |
| `VERCEL_PROJECT_ID` | [Vercel Project Settings](https://vercel.com/dashboard) | Found in project settings or run `vercel link` |

#### How to get Vercel credentials:

1. **VERCEL_TOKEN**:
   - Go to https://vercel.com/account/tokens
   - Click "Create"
   - Name it "GitHub CI/CD"
   - Copy the token and add as `VERCEL_TOKEN` secret

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   ```bash
   # Run locally in your project directory
   vercel link
   ```
   Then check `.vercel/project.json` for the IDs, or:
   - Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
   - Click project settings
   - Copy the Project ID

### For Cloudflare Deployment

Add the following secrets:

| Secret Name | Where to Find | Instructions |
|------------|---------------|--------------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) | Create token with Pages deploy permissions |
| `CLOUDFLARE_ACCOUNT_ID` | [Cloudflare Dashboard](https://dash.cloudflare.com) | Found in account details |
| `CLOUDFLARE_PROJECT_NAME` | [Cloudflare Pages](https://dash.cloudflare.com) | Name of your Pages project |

#### How to get Cloudflare credentials:

1. **CLOUDFLARE_API_TOKEN**:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Cloudflare Pages - Edit" template (or create custom with `pages:build:write` permission)
   - Copy the token

2. **CLOUDFLARE_ACCOUNT_ID**:
   - Go to https://dash.cloudflare.com
   - Right sidebar shows "Account ID"
   - Copy it

3. **CLOUDFLARE_PROJECT_NAME**:
   - Go to https://dash.cloudflare.com/pages
   - Create a Pages project if you haven't
   - Project name goes here (e.g., `csf-website`)

### Environment Variables (Shared by Both Platforms)

Add these secrets for your application:

| Secret Name | Value |
|------------|-------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `csf-mullana-web-preset` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Your Google Gemini API key |

## Step 2: Configure wrangler.toml for Cloudflare

Update `/wrangler.toml` with your Cloudflare account details:

```toml
name = "csf-website"
account_id = "YOUR_ACCOUNT_ID"  # From Cloudflare dashboard
zone_id = "YOUR_ZONE_ID"         # If using custom domain
```

## Step 3: Verify Configuration

Check that:
1. ✅ All secrets are added to GitHub
2. ✅ `wrangler.toml` has your Cloudflare account_id
3. ✅ `vercel.json` exists in repo
4. ✅ `package.json` has build scripts

## Step 4: Test the Workflow

Push a commit to `main` branch:

```bash
git add .
git commit -m "Configure multi-platform deployment"
git push origin main
```

Then:
1. Go to GitHub repository → Actions
2. Watch the "Multi-Platform Deploy" workflow
3. Check job progress for Vercel and Cloudflare

## Workflow Behavior

### On Push to Main
- ✅ Build and Test
- ✅ Deploy to Vercel (production)
- ✅ Deploy to Cloudflare Pages (production)

### On Pull Request
- ✅ Build and Test
- ✅ Preview deployment to Vercel (non-production)
- ✅ No Cloudflare deployment (PR builds skip production)

### On Push to Develop
- ✅ Build and Test only
- ✅ No deployment (can be customized)

## Troubleshooting

### "Deployment failed" in GitHub Actions

1. **Check secrets are set correctly**:
   - Go to Settings → Secrets → Review all entries
   - Make sure no typos

2. **Check build logs**:
   - Click on failed workflow
   - Scroll to "Build & Test" job
   - Look for error messages

3. **Vercel deployment issues**:
   - Verify `VERCEL_TOKEN` is still valid (tokens can expire)
   - Check `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct

4. **Cloudflare deployment issues**:
   - Verify `CLOUDFLARE_API_TOKEN` has correct permissions
   - Check `wrangler.toml` has valid `account_id`
   - Make sure Cloudflare Pages project exists

### Build fails locally but passes in GitHub

This usually means:
1. Environment variables not set locally
2. Different Node.js version (check `node-version` in workflow vs your local)
3. Platform-specific code issues

**Fix**:
```bash
# Use same Node version as CI
nvm use 20  # or whatever version in workflow

# Set env vars
cp .env.example .env.development.local
# Edit and fill in your secrets

# Try building locally
npm run build:vercel
npm run build:cloudflare
```

## Advanced: Custom Environments

To deploy to different Cloudflare environments (staging, production):

1. Create separate `wrangler.json` entries:
```toml
[env.staging]
name = "csf-website-staging"

[env.production]
name = "csf-website-prod"
```

2. Update workflow to deploy to specific environment:
```yaml
- run: wrangler deploy --env production
```

## Support

- **Vercel Issues**: https://vercel.com/docs/
- **Cloudflare Issues**: https://developers.cloudflare.com/
- **GitHub Actions**: https://docs.github.com/en/actions

---

Once configured, your app will automatically deploy to both platforms on every push to main!
