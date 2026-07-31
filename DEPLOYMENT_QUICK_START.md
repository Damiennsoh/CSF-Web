# Quick Start: Multi-Platform Deployment

Your app is now configured to deploy to **both Vercel and Cloudflare**. Choose your approach below.

## 🚀 Option 1: Automatic Deployment with GitHub (Recommended)

Set up once, deploy automatically on every push to `main`.

### Setup (5 minutes)
1. Follow [GITHUB_SETUP.md](./GITHUB_SETUP.md) to add GitHub Secrets
2. Push to `main`: `git push origin main`
3. Watch GitHub Actions → All done! ✨

**That's it!** From now on:
- Every push to `main` deploys to both Vercel and Cloudflare
- Pull requests get preview deployments
- No more manual deployments

---

## 🎯 Option 2: Manual Deployment from CLI

Deploy manually whenever you want.

### Prerequisites
```bash
# Install Vercel CLI
npm install -g vercel

# Install Cloudflare Wrangler
npm install -g @cloudflare/wrangler

# Authenticate
vercel login
wrangler login
```

### Deploy to Vercel
```bash
npm run build:vercel
npm run deploy:vercel
```
Or use the script:
```bash
./scripts/deploy.sh vercel
```

### Deploy to Cloudflare
```bash
npm run build:cloudflare
npm run deploy:cloudflare
```
Or use the script:
```bash
./scripts/deploy.sh cloudflare
```

### Deploy to Both
```bash
./scripts/deploy.sh both
```

---

## 📋 Deployment Checklist

Before your first deployment:

- [ ] Clone/pull latest code
- [ ] Set up environment variables (see `.env.example`)
- [ ] Run `npm install` or `pnpm install`
- [ ] Test locally: `npm run dev`
- [ ] Verify build: `npm run build:vercel` or `npm run build:cloudflare`

For **GitHub Actions** deployment, also:
- [ ] Follow [GITHUB_SETUP.md](./GITHUB_SETUP.md)
- [ ] Add all GitHub Secrets
- [ ] Push to `main` branch

---

## 🛠️ Local Development

Start the dev server:
```bash
npm run dev
```

Visit http://localhost:3000

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `package.json` | NPM scripts and dependencies |
| `next.config.mjs` | Next.js configuration |
| `vercel.json` | Vercel deployment config |
| `wrangler.toml` | Cloudflare deployment config |
| `.github/workflows/deploy.yml` | GitHub Actions automation |
| `.env.example` | Environment variables template |
| `scripts/deploy.sh` | Manual deployment script |

---

## 📊 Deployment Comparison

| Feature | GitHub Actions | Manual CLI |
|---------|---|---|
| **Setup Time** | ~10 min | ~5 min |
| **Frequency** | Auto on push | Manual |
| **Best For** | Production | Testing/Staging |
| **Cost** | Free | Free |

**Recommendation**: Use GitHub Actions for production, CLI for testing.

---

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Repository**: https://github.com/Damiennsoh/CSF-website
- **Vercel Docs**: https://vercel.com/docs
- **Cloudflare Docs**: https://developers.cloudflare.com

---

## ❓ Need Help?

1. **Local development issues**: Check `npm run dev` errors
2. **Build errors**: Run `npm run build:vercel` locally to debug
3. **GitHub Actions**: Check [GITHUB_SETUP.md](./GITHUB_SETUP.md)
4. **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎓 What's Included

✅ Multi-platform configuration  
✅ GitHub Actions workflow  
✅ Vercel integration  
✅ Cloudflare Pages integration  
✅ Environment variable templates  
✅ Deployment scripts  
✅ Full documentation  

**You're all set!** 🎉

Next steps:
1. Set up GitHub Secrets (if using GitHub Actions)
2. Push your code
3. Watch your app deploy automatically!
