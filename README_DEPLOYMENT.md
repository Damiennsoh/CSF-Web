# 🚀 CSF Website - Multi-Platform Deployment Guide

Welcome! Your app is configured for deployment to both **Vercel** and **Cloudflare**. This guide will get you up and running quickly.

## 📖 Documentation Index

Choose your path based on your needs:

### 🟢 Just Getting Started?
👉 **Start here**: [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)
- 5-minute setup guide
- Two deployment options
- Quick checklist

### 🔴 Need Full Details?
👉 **Read this**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Comprehensive guide
- Platform comparison
- Troubleshooting
- Project structure

### 🟡 Setting Up GitHub Actions?
👉 **Follow this**: [GITHUB_SETUP.md](./GITHUB_SETUP.md)
- Step-by-step secrets setup
- GitHub Actions configuration
- Automatic deployment setup

### 🔵 Need Command Reference?
👉 **Check this**: [COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md)
- All CLI commands
- Development commands
- Deployment commands
- Troubleshooting commands

### ⚫ Verify Everything is Set Up?
👉 **See this**: [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
- What's been configured
- Getting started options
- Next steps
- Pro tips

## ⚡ Quick Start (2 Options)

### Option A: Automatic Deployment (GitHub Actions)
Best for: Production environments, hands-off deployments

```bash
# 1. Follow GITHUB_SETUP.md to add GitHub Secrets
# 2. Push to main:
git push origin main
# 3. Watch GitHub Actions deploy automatically!
```

### Option B: Manual CLI Deployment
Best for: Testing, staging, manual control

```bash
# 1. Install CLIs
npm install -g vercel @cloudflare/wrangler
vercel login
wrangler login

# 2. Deploy
./scripts/deploy.sh vercel        # Vercel only
./scripts/deploy.sh cloudflare    # Cloudflare only
./scripts/deploy.sh both          # Both platforms
```

## 🛠️ Essential Commands

```bash
# Development
npm run dev                    # Start dev server
npm run type-check            # Check TypeScript

# Building
npm run build:vercel          # Build for Vercel
npm run build:cloudflare      # Build for Cloudflare

# Deploying
npm run deploy:vercel         # Deploy to Vercel
npm run deploy:cloudflare     # Deploy to Cloudflare
./scripts/deploy.sh both      # Deploy to both
```

## 📊 Deployment Options Comparison

| Aspect | GitHub Actions | Manual CLI |
|--------|---|---|
| **Setup Time** | 10 minutes | 5 minutes |
| **Deployment Trigger** | Auto on push | Manual |
| **Best For** | Production | Testing |
| **Learning Curve** | Easy | Medium |
| **Cost** | Free | Free |

## 📋 Pre-Deployment Checklist

Before your first deployment:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment variables set (copy from `.env.example`)
- [ ] Local dev works (`npm run dev`)
- [ ] Build succeeds (`npm run build:vercel`)

For GitHub Actions:
- [ ] GitHub Secrets configured (see [GITHUB_SETUP.md](./GITHUB_SETUP.md))
- [ ] `wrangler.toml` has your Cloudflare account ID

## 🎯 My Recommended Flow

1. **Local Development**
   ```bash
   npm run dev  # Make changes locally
   ```

2. **Test Build**
   ```bash
   npm run build:vercel  # Verify it builds
   npm start             # Test locally
   ```

3. **Push & Deploy**
   ```bash
   git push origin main  # GitHub Actions handles deployment
   ```

4. **Monitor**
   - Vercel: https://vercel.com/dashboard
   - Cloudflare: https://dash.cloudflare.com

## 🔗 Important Links

| Resource | Link |
|----------|------|
| **GitHub Repo** | https://github.com/Damiennsoh/CSF-website |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Cloudflare Dashboard** | https://dash.cloudflare.com |
| **Vercel Docs** | https://vercel.com/docs |
| **Cloudflare Docs** | https://developers.cloudflare.com |

## ❓ Frequently Asked Questions

**Q: Which platform is better?**
A: Both are excellent! Vercel is easier to set up, Cloudflare has great edge performance. Use GitHub Actions to deploy to both.

**Q: Do I need both platforms?**
A: No! You can use just one. GitHub Actions will deploy to both by default - you can modify `.github/workflows/deploy.yml` to remove either.

**Q: Can I use custom domains?**
A: Yes! Configure domains in each platform's dashboard after deployment.

**Q: Where are my secrets stored?**
A: GitHub Secrets (for CI/CD), Vercel environment variables, Cloudflare secrets. None are stored in the repo.

**Q: How do I preview before deploying?**
A: Use pull requests (automatic preview) or `npm run preview:*` locally.

## 🆘 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Build fails locally | See [COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md#troubleshooting) |
| GitHub Actions fails | Check [GITHUB_SETUP.md](./GITHUB_SETUP.md#troubleshooting) |
| Need all commands | See [COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md) |
| Want full guide | Read [DEPLOYMENT.md](./DEPLOYMENT.md) |

## 📚 File Overview

```
Your Project
├── DEPLOYMENT_QUICK_START.md    ← Start here!
├── DEPLOYMENT.md                ← Full guide
├── GITHUB_SETUP.md              ← GitHub Actions setup
├── COMMANDS_REFERENCE.md        ← All commands
├── SETUP_COMPLETE.md            ← What's configured
├── README_DEPLOYMENT.md         ← This file
├── .env.example                 ← Environment template
├── vercel.json                  ← Vercel config
├── wrangler.toml               ← Cloudflare config
├── next.config.mjs             ← Next.js config
├── .github/workflows/
│   └── deploy.yml              ← GitHub Actions CI/CD
└── scripts/
    └── deploy.sh               ← Manual deployment script
```

## ✅ Verification Checklist

Confirm your setup is correct:

```bash
# 1. Check Node version
node --version          # Should be 18+

# 2. Check npm scripts
cat package.json | grep "deploy"

# 3. Check config files exist
ls -la vercel.json wrangler.toml

# 4. Verify build commands work
npm run build:vercel

# 5. Check GitHub Actions file
ls -la .github/workflows/deploy.yml
```

## 🎓 What's Included

✅ **Multi-Platform Ready**
- Vercel deployment configured
- Cloudflare Pages ready
- GitHub Actions CI/CD setup

✅ **Security**
- Security headers configured
- Environment variables properly handled
- No secrets in code

✅ **Developer Experience**
- Multiple deployment options
- Clear documentation
- Helper scripts included

✅ **Production Ready**
- Type checking enabled
- Lint configuration
- Performance optimized

## 🚀 Next Steps

1. **Read**: Start with [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)
2. **Choose**: Decide between GitHub Actions or manual CLI
3. **Setup**: Follow the appropriate guide
4. **Deploy**: Push code or run deployment script
5. **Monitor**: Check deployment logs in respective dashboards

## 💬 Need Help?

1. **Check docs**: Read relevant guide (see index above)
2. **View logs**: GitHub Actions or platform dashboards
3. **Test locally**: Run `npm run build` to debug
4. **Platform help**:
   - Vercel: https://vercel.com/support
   - Cloudflare: https://support.cloudflare.com

## 📞 Support Resources

- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Cloudflare**: https://developers.cloudflare.com
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 🎉 You're Ready!

Your app is configured and ready to deploy. Choose one of the options above and you're good to go!

**Happy deploying!** 🚀

---

**Last Updated**: July 31, 2024  
**Status**: ✅ Multi-Platform Deployment Ready  
**Next**: Choose Option A (GitHub Actions) or Option B (Manual CLI) above
