# Deployment & Branching Strategy for Claimtech

## 🌿 Overview

This document explains how Claimtech uses Git branches integrated with Vercel deployments and Supabase database branches for local development, cloud testing, and production environments.

## 📊 Branch Structure

```
GitHub Repository: Jcvdm/ClaimTech
├── main (production)           → Vercel Production + Supabase Production
├── vercel-dev (Vercel testing) → Vercel Preview + Supabase Dev Branch
└── dev (local development)     → Local only + Supabase Dev Branch
```

### Branch Details

| Git Branch | Purpose | Vercel Deployment | Supabase Branch | Environment |
|------------|---------|-------------------|-----------------|-------------|
| **main** | Production | Auto-deploy to production | Production (cfblmkzleqtvtfxujikf) | `.env` (production) |
| **vercel-dev** | Vercel speed/cloud testing | Auto-deploy to preview | Dev branch | `.env.development` |
| **dev** | Local development | No deploy | Dev branch | `.env.development` |

### Why This Structure?

✅ **Separation of Concerns**
- `dev` = Fast local iteration without cloud costs
- `vercel-dev` = Cloud testing (speed, serverless functions, PDF generation) without affecting production
- `main` = Stable production

✅ **Cost Efficiency**
- Only deploy to Vercel when needed for testing
- Local dev is free and fast

✅ **Safety**
- Test on Vercel preview before production
- Both `dev` and `vercel-dev` use same Supabase dev branch (data consistency)
- Production stays isolated

---

## 🔑 Environment Configuration

### Local Development vs Vercel Deployment

The app uses **environment variables** to determine which Supabase instance to connect to:
- **Local**: Uses `.env` files in project root
- **Vercel**: Uses environment variables set in Vercel Dashboard

### Environment Files Structure (Local)

```
.env                    # Default (production) - gitignored
.env.local              # Local overrides - gitignored
.env.development        # Development mode - gitignored
.env.example            # Template (committed to git)
```

### Configuration Files

#### `.env` (Production - Default)
```bash
# Production Supabase Configuration
PUBLIC_SUPABASE_URL=https://cfblmkzleqtvtfxujikf.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key_here
```

#### `.env.development` (Development Branch - Used by both `dev` and `vercel-dev`)
```bash
# Development Branch Supabase Configuration
# Get these from Supabase Dashboard → Branches → development → Settings → API
PUBLIC_SUPABASE_URL=https://[dev-branch-ref].supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_dev_branch_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_dev_branch_service_key_here
```

### Vercel Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

#### Production Environment (main branch)
```
PUBLIC_SUPABASE_URL = https://cfblmkzleqtvtfxujikf.supabase.co
PUBLIC_SUPABASE_ANON_KEY = production_anon_key
SUPABASE_SERVICE_ROLE_KEY = production_service_key
```
**Apply to**: Production

#### Preview Environment (vercel-dev branch)
```
PUBLIC_SUPABASE_URL = https://[dev-branch-ref].supabase.co
PUBLIC_SUPABASE_ANON_KEY = dev_anon_key
SUPABASE_SERVICE_ROLE_KEY = dev_service_key
```
**Apply to**: Preview

---

## 🚀 Development Workflow

### 1. Local Development (`dev` branch)

**Use for**: Daily development, fast iteration, testing locally

```bash
# Switch to dev branch
git checkout dev

# Run with development database
npm run dev:development

# Uses .env.development (Supabase dev branch)
# Runs on http://localhost:5173
# No Vercel deployment
```

### 2. Vercel Testing (`vercel-dev` branch)

**Use for**: Testing speed, serverless functions, PDF generation in cloud environment

```bash
# Merge dev changes to vercel-dev
git checkout vercel-dev
git merge dev

# Push to trigger Vercel deployment
git push origin vercel-dev

# Vercel automatically deploys to preview URL:
# https://claimtech-git-vercel-dev-jcvdms-projects.vercel.app

# Uses Vercel environment variables (Supabase dev branch)
```

### 3. Production Deployment (`main` branch)

**Use for**: Deploying to production after thorough testing

```bash
# Merge vercel-dev to main
git checkout main
git merge vercel-dev

# Push to deploy to production
git push origin main

# Vercel deploys to production URL:
# https://claimtech.vercel.app (or your custom domain)

# Uses Vercel production environment variables
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "vite dev",
    "dev:development": "vite dev --mode development",
    "build": "vite build",
    "build:development": "vite build --mode development",
    "preview": "vite preview"
  }
}
```

---

## 🔄 How Vercel + Supabase Integration Works

### Vercel Automatic Deployments

Vercel monitors your GitHub repository and automatically deploys:

| Branch | Vercel Deployment | URL Pattern | Environment |
|--------|-------------------|-------------|-------------|
| `main` | Production | `claimtech.vercel.app` | Production env vars |
| `vercel-dev` | Preview | `claimtech-git-vercel-dev-*.vercel.app` | Preview env vars |
| `dev` | None | N/A (local only) | Local `.env.development` |

### Supabase Branch Integration

Supabase branches are created manually or via PR:
1. Create Supabase dev branch in Supabase Dashboard
2. Get API credentials from branch settings
3. Add credentials to Vercel environment variables (Preview)
4. Add credentials to local `.env.development`

### What Gets Deployed

✅ **Deployed to Vercel:**
- Application code (SvelteKit app)
- Serverless functions (API routes)
- Static assets
- Build output

✅ **Synced to Supabase:**
- Database migrations (`supabase/migrations/*.sql`)
- Schema changes
- RLS policies

❌ **Not Deployed/Synced:**
- `.env` files (use Vercel environment variables)
- `node_modules` (rebuilt on Vercel)
- Database data (managed in Supabase)
- Storage files (managed in Supabase)

---

## 🎯 Development Workflow

### Scenario 1: Daily Development Flow

```bash
# 1. Work on local dev branch
git checkout dev
npm run dev:development

# 2. Make changes, test locally
git add .
git commit -m "feat: new feature"

# 3. When ready to test speed on Vercel
git checkout vercel-dev
git merge dev
git push origin vercel-dev

# 4. Vercel auto-deploys to preview URL
# Test speed, performance, serverless functions

# 5. If all good, merge to production
git checkout main
git merge vercel-dev
git push origin main
```

### Scenario 2: Feature Branch Development

```bash
# 1. Create feature branch from dev
git checkout dev
git checkout -b feature/new-assessment-fields

# 2. Make changes to code and database
# - Edit application code
# - Create migration: supabase/migrations/007_new_fields.sql

# 3. Test locally
npm run dev:development

# 4. Commit and merge back to dev
git add .
git commit -m "feat: add new assessment fields"
git checkout dev
git merge feature/new-assessment-fields

# 5. Test on Vercel
git checkout vercel-dev
git merge dev
git push origin vercel-dev

# 6. If tests pass, deploy to production
git checkout main
git merge vercel-dev
git push origin main
```

### Scenario 3: Hotfix for Production

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug

# 2. Fix the bug and test locally
npm run dev

# 3. Commit and merge to main
git add .
git commit -m "fix: resolve critical bug"
git checkout main
git merge hotfix/critical-bug
git push origin main

# 4. Vercel deploys to production
# 5. Backport to dev
git checkout dev
git merge main
```

### Scenario 4: Testing Vercel-Specific Features

```bash
# Test PDF generation, serverless functions, etc.
git checkout vercel-dev

# Make changes if needed
git add .
git commit -m "test: optimize PDF generation"
git push origin vercel-dev

# Check Vercel deployment logs
# Test on preview URL
# If good, merge to main
```

---

## 🚀 Setting Up Vercel Deployment

### Initial Setup

1. **Connect GitHub Repository to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository: `Jcvdm/ClaimTech`
   - Vercel auto-detects SvelteKit ✅
   - Click **Deploy**

2. **Configure Branch Deployments:**
   - Vercel Dashboard → Settings → Git
   - **Production Branch**: `main`
   - **Preview Branches**: Enable for `vercel-dev`
   - **Ignored Build Step**: Leave empty (deploy all branches)

3. **Add Environment Variables:**

   **For Production (main branch):**
   - Vercel Dashboard → Settings → Environment Variables
   - Add variables and select **Production** environment:
   ```
   PUBLIC_SUPABASE_URL = https://cfblmkzleqtvtfxujikf.supabase.co
   PUBLIC_SUPABASE_ANON_KEY = [production_anon_key]
   SUPABASE_SERVICE_ROLE_KEY = [production_service_key]
   ```

   **For Preview (vercel-dev branch):**
   - Add same variables and select **Preview** environment:
   ```
   PUBLIC_SUPABASE_URL = https://[dev-branch-ref].supabase.co
   PUBLIC_SUPABASE_ANON_KEY = [dev_anon_key]
   SUPABASE_SERVICE_ROLE_KEY = [dev_service_key]
   ```

4. **Update Supabase Allowed URLs:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add Vercel URLs:
     - Production: `https://claimtech.vercel.app`
     - Preview: `https://claimtech-git-vercel-dev-*.vercel.app`
   - Add redirect URLs:
     - `https://claimtech.vercel.app/auth/confirm`
     - `https://claimtech-git-vercel-dev-*.vercel.app/auth/confirm`

---

## 📝 Getting Supabase Branch Credentials

### Creating a Supabase Dev Branch:

1. **Via Supabase Dashboard:**
   - Go to: https://app.supabase.com/project/cfblmkzleqtvtfxujikf
   - Click **"Branches"** in sidebar
   - Click **"Create Branch"**
   - Name it `development`
   - Select schema to copy from production

2. **Get API Credentials:**
   - Select your dev branch
   - Go to **Settings** → **API**
   - Copy URL and keys

3. **Update Local Environment:**
   ```bash
   # Create .env.development
   PUBLIC_SUPABASE_URL=https://[dev-branch-ref].supabase.co
   PUBLIC_SUPABASE_ANON_KEY=[dev-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[dev-service-key]
   ```

4. **Update Vercel Environment Variables:**
   - Add same credentials to Vercel Preview environment

---

## 🔒 Security Best Practices

### 1. Never Commit Actual Keys

Your `.gitignore` should include:
```
.env
.env.local
.env.development
.env.staging
.env.production
.env*.local
```

### 2. Use .env.example as Template

```bash
# .env.example (committed to Git)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

### 3. Separate Keys Per Environment

- ✅ Production keys for production (Vercel Production + local `.env`)
- ✅ Dev keys for development (Vercel Preview + local `.env.development`)
- ✅ Never use production keys in development
- ✅ Never commit `.env` files to Git

### 4. Vercel Environment Variables Security

- Mark `SUPABASE_SERVICE_ROLE_KEY` as **sensitive** in Vercel
- Use different keys for Production vs Preview
- Rotate keys periodically
- Never expose service role key to client-side code

---

## 📊 Current Setup Status

### Git Branches

```bash
✅ main          # Production code → Vercel Production
✅ vercel-dev    # Vercel testing → Vercel Preview
✅ dev           # Local development → No deployment
```

### Vercel Deployment

```
✅ Repository: Jcvdm/ClaimTech
✅ Production: main branch → claimtech.vercel.app
✅ Preview: vercel-dev branch → claimtech-git-vercel-dev-*.vercel.app
✅ Adapter: @sveltejs/adapter-vercel@5.6.3
✅ Max Duration: 300 seconds (requires Vercel Pro for PDF generation)
```

### Supabase Branches

```
✅ Production (cfblmkzleqtvtfxujikf)  # Main database
⏳ Development branch (to be created)  # Dev/testing database
```

---

## 🆘 Troubleshooting

### Vercel Deployment Issues

#### Issue: Vercel build fails

**Solution:**
1. Check Vercel build logs in dashboard
2. Verify all dependencies are in `package.json`
3. Ensure environment variables are set correctly
4. Check that `@sveltejs/adapter-vercel` is installed

#### Issue: Environment variables not working on Vercel

**Solution:**
1. Verify variables are set in Vercel Dashboard → Settings → Environment Variables
2. Check that variables are assigned to correct environment (Production vs Preview)
3. Redeploy after adding/changing variables
4. Check variable names match exactly (case-sensitive)

#### Issue: PDF generation timeout on Vercel

**Solution:**
1. Verify you're on Vercel Pro plan (Hobby plan has 10s limit)
2. Check `svelte.config.js` has `maxDuration: 300`
3. Consider switching to `@sparticuz/chromium` for better serverless compatibility
4. Check Vercel function logs for timeout errors

#### Issue: Wrong Supabase database on Vercel

**Solution:**
1. Check Vercel environment variables match intended Supabase branch
2. Verify Production uses production Supabase URL
3. Verify Preview uses dev Supabase URL
4. Redeploy after fixing environment variables

### Local Development Issues

#### Issue: Wrong database connection locally

**Solution:**
1. Check which npm script you're running (`dev` vs `dev:development`)
2. Verify correct `.env` file exists (`.env` or `.env.development`)
3. Check URL in browser console:
   ```javascript
   console.log(import.meta.env.PUBLIC_SUPABASE_URL)
   ```

#### Issue: Environment variables not updating locally

**Solution:**
1. Stop dev server
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart with correct mode: `npm run dev:development`
4. Verify `.env.development` file exists and has correct values

### Supabase Branch Issues

#### Issue: Supabase dev branch not created

**Solution:**
1. Manually create branch in Supabase Dashboard
2. Go to Branches → Create Branch
3. Name it `development`
4. Copy schema from production

#### Issue: Can't access Supabase dev branch

**Solution:**
1. Verify you have correct API credentials
2. Check branch is active in Supabase Dashboard
3. Verify RLS policies allow access
4. Test connection with Supabase MCP tools

---

## 📚 Quick Reference

### Common Commands

```bash
# Switch branches
git checkout main
git checkout vercel-dev
git checkout dev

# Create feature branch
git checkout -b feature/name

# Push new branch
git push -u origin branch-name

# Run with different environments
npm run dev                    # Production (local)
npm run dev:development        # Development (local)

# Merge workflow
git checkout vercel-dev
git merge dev                  # Merge dev to vercel-dev
git push origin vercel-dev     # Trigger Vercel preview deploy

git checkout main
git merge vercel-dev           # Merge to production
git push origin main           # Trigger Vercel production deploy
```

### Branch Naming Convention

```
main                          # Production
vercel-dev                    # Vercel testing
dev                          # Local development
feature/description          # New features
hotfix/description           # Bug fixes
```

### Deployment URLs

```
Production:  https://claimtech.vercel.app
Preview:     https://claimtech-git-vercel-dev-jcvdms-projects.vercel.app
Local:       http://localhost:5173
```

---

## 🧹 Branch Hygiene & Development Workflow

### Active Branch Strategy

We use a **3-tier workflow** optimized for local development and Vercel cloud testing:

```
dev (local) → vercel-dev (Vercel preview) → main (production)
```

### Daily Development Workflow

1. **Work on `dev` branch locally**
   ```bash
   git checkout dev
   # Make changes, test locally with npm run dev:development
   git add .
   git commit -m "feat: your feature description"
   git push origin dev
   ```

2. **Create feature branches for larger work** (optional)
   ```bash
   git checkout dev
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: implement feature"
   # Open PR: feature/* → dev
   ```

3. **Test on Vercel preview**
   ```bash
   # When ready to test in cloud environment
   git checkout vercel-dev
   git merge dev
   git push origin vercel-dev
   # Vercel auto-deploys to preview URL
   # Test at: https://claimtech-git-vercel-dev-*.vercel.app
   ```

4. **Deploy to production**
   ```bash
   # After testing on vercel-dev preview
   git checkout main
   git merge vercel-dev
   git push origin main
   # Vercel auto-deploys to production URL
   ```

### Branch Purpose & Rules

| Branch | Purpose | Deploy Target | When to Use |
|--------|---------|---------------|-------------|
| **dev** | Daily development | Local only | All feature work, bug fixes |
| **vercel-dev** | Cloud testing | Vercel Preview | Test before production |
| **main** | Production | Vercel Production | Stable, tested code only |

### Important Rules

✅ **DO:**
- Make all changes on `dev` branch
- Test locally before merging to `vercel-dev`
- Test on Vercel preview before merging to `main`
- Keep `main` and `vercel-dev` clean (no direct commits)

❌ **DON'T:**
- Don't commit directly to `main` or `vercel-dev`
- Don't skip testing on `vercel-dev` before production
- Don't merge untested code to `main`

### About the `staging` Branch

The `staging` branch exists but is **deprecated** in favor of `vercel-dev`.
- `vercel-dev` serves as our staging/pre-production environment
- If you need `staging` for other purposes, document it separately

---

## 🧹 Branch Hygiene (Recommended Next Steps)

If your current working branch `vercel-dev` is functionally the same as `dev`, align with the documented flow:

1. Align development branch
   - If `vercel-dev` ≈ `dev`, either rename it to `dev` or create `dev` and set it as the active development branch.
   - Ensure CI/CD and Supabase preview branches point to `dev` for day-to-day work.

2. Use short-lived feature branches
   - Create branches as `feature/<description>` for each unit of work.
   - Open PRs from `feature/*` into `dev`.

3. Promote via staging before production
   - When `dev` is stable, open PR `dev → staging` for pre-production testing.
   - After sign-off, open PR `staging → main` to release to production.

This keeps the environment mapping consistent:
```
main     → Production
staging  → Pre-production testing
dev      → Active development
```

> Note: If `vercel-dev` must remain for historical CI reasons, document it as an alias of `dev` and keep only one as the canonical target for PRs.

---

## 🧹 Branch Hygiene (Recommended Next Steps)

If your current working branch `vercel-dev` is functionally the same as `dev`, align with the documented flow:

1. Align development branch
   - If `vercel-dev` ≈ `dev`, either rename it to `dev` or create `dev` and set it as the active development branch.
   - Ensure CI/CD and Supabase preview branches point to `dev` for day-to-day work.

2. Use short-lived feature branches
   - Create branches as `feature/<description>` for each unit of work.
   - Open PRs from `feature/*` into `dev`.

3. Promote via staging before production
   - When `dev` is stable, open PR `dev → staging` for pre-production testing.
   - After sign-off, open PR `staging → main` to release to production.

This keeps the environment mapping consistent:
```
main     → Production
staging  → Pre-production testing
dev      → Active development
```

> Note: If `vercel-dev` must remain for historical CI reasons, document it as an alias of `dev` and keep only one as the canonical target for PRs.

---

## 🧹 Branch Hygiene (Recommended Next Steps)

If your current working branch `vercel-dev` is functionally the same as `dev`, align with the documented flow:

1. Align development branch
   - If `vercel-dev` ≈ `dev`, either rename it to `dev` or create `dev` and set it as the active development branch.
   - Ensure CI/CD and Supabase preview branches point to `dev` for day-to-day work.

2. Use short-lived feature branches
   - Create branches as `feature/<description>` for each unit of work.
   - Open PRs from `feature/*` into `dev`.

3. Promote via staging before production
   - When `dev` is stable, open PR `dev → staging` for pre-production testing.
   - After sign-off, open PR `staging → main` to release to production.

This keeps the environment mapping consistent:
```
main     → Production
staging  → Pre-production testing
dev      → Active development
```

> Note: If `vercel-dev` must remain for historical CI reasons, document it as an alias of `dev` and keep only one as the canonical target for PRs.

---

## 🔄 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-30 | 2.0 | Added Vercel deployment strategy, renamed staging to vercel-dev |
| 2025-10-23 | 1.0 | Initial setup with GitHub integration, dev and staging branches |

---

## 📖 Additional Resources

- [Supabase Branching Docs](https://supabase.com/docs/guides/platform/branching)
- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-public)
- [Vite Modes](https://vitejs.dev/guide/env-and-mode.html)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

