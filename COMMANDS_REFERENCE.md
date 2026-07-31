# Commands Reference

Quick reference for all deployment and development commands.

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## Building

```bash
# Build for Vercel
npm run build

# Build for Cloudflare
npm run build:cloudflare

# Build for Vercel (explicit)
npm run build:vercel
```

## Deploying

### Vercel

```bash
# Deploy to production
npm run deploy:vercel

# Preview (staging)
npm run preview:vercel

# Or use the script
./scripts/deploy.sh vercel
```

### Cloudflare

```bash
# Deploy to Cloudflare
npm run deploy:cloudflare

# Preview locally
npm run preview:cloudflare

# Or use the script
./scripts/deploy.sh cloudflare
```

### Both Platforms

```bash
# Deploy to both Vercel and Cloudflare
./scripts/deploy.sh both
```

## CLI Setup

### Vercel CLI

```bash
# Install
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# View deployment status
vercel list
```

### Cloudflare Wrangler

```bash
# Install
npm install -g @cloudflare/wrangler

# Login
wrangler login

# Check configuration
wrangler whoami

# List deployments
wrangler deployments list
```

## Environment Variables

### Local Development

```bash
# Copy example file
cp .env.example .env.development.local

# Edit with your values
nano .env.development.local
```

### Vercel

```bash
# View secrets
vercel env list

# Add secret
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# Delete secret
vercel env rm NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

### Cloudflare

```bash
# View secrets
wrangler secret list

# Add secret
wrangler secret put CLOUDINARY_API_SECRET

# Delete secret
wrangler secret delete CLOUDINARY_API_SECRET

# For specific environment
wrangler secret put CLOUDINARY_API_SECRET --env production
```

## Monitoring & Logs

### Vercel

```bash
# View live logs
vercel logs --tail

# View deployment logs
vercel logs [deployment-url]

# List deployments
vercel list

# Show project info
vercel info
```

### Cloudflare

```bash
# View tail logs
wrangler tail

# View build logs
wrangler deployments list

# Check status
wrangler deployments tail
```

## Troubleshooting

### Clear Cache & Rebuild

```bash
# Remove all build artifacts
rm -rf .next .opennext .turbo

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install --no-frozen-lockfile

# Rebuild
npm run build
```

### Test Build Locally

```bash
# For Vercel
npm run build:vercel
npm start

# For Cloudflare
npm run build:cloudflare
npm run preview:cloudflare
```

### Check Node Version

```bash
node --version

# Should be 18 or 20 (matching .github/workflows/deploy.yml)
```

## GitHub Actions

### View Workflow Status

1. Go to: https://github.com/Damiennsoh/CSF-website/actions
2. Click "Multi-Platform Deploy"
3. View job status and logs

### Workflow Commands

```bash
# Push to trigger workflow
git push origin main

# View workflow file
cat .github/workflows/deploy.yml

# Test workflow locally (requires act)
npm install -g act
act push
```

## Performance

### Analyze Build Size

```bash
# Vercel
npm run build:vercel
npm ls

# Cloudflare
npm run build:cloudflare
```

### Check Bundle Size

```bash
# Requires bundle-analyzer
# Add to next.config.mjs and rebuild
npm run build:vercel
```

## Safety

### Pre-deployment Checks

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Test (if tests added)
npm test
```

### Deployment Preview

```bash
# Vercel preview
npm run preview:vercel

# Cloudflare preview
npm run preview:cloudflare
```

## Git Commands

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: describe changes"

# Push to GitHub
git push origin feature/my-feature

# Create Pull Request (on GitHub)
# Then push to main to trigger deployment:
git push origin main
```

## Package Manager

The project uses **pnpm**. Common commands:

```bash
# Install dependencies
pnpm install

# Add package
pnpm add package-name

# Remove package
pnpm remove package-name

# Run script
pnpm run script-name

# Update all packages
pnpm up
```

## Configuration Files

### Edit Configuration

```bash
# Next.js config
nano next.config.mjs

# Vercel config
nano vercel.json

# Cloudflare config
nano wrangler.toml

# GitHub Actions
nano .github/workflows/deploy.yml

# Environment template
nano .env.example
```

## Quick Copy-Paste Commands

### First Time Setup
```bash
cp .env.example .env.development.local
npm install
npm run dev
```

### Local Test Build
```bash
npm run build:vercel && npm start
```

### Deploy to Both
```bash
./scripts/deploy.sh both
```

### Fix Common Issues
```bash
rm -rf .next .opennext node_modules
npm install
npm run build
```

---

For more details, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) - Quick start
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub Actions setup
