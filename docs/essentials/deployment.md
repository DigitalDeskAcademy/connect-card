# Preview Deployment Setup Guide

## Overview

This guide walks through setting up preview deployments with GitHub and Vercel, allowing you to test changes in a production-like environment before merging to main.

**Benefits:**

- Test features before production deployment
- Share preview links with team/clients for feedback
- Catch deployment issues early
- Separate preview database (optional) for safe testing

## Current Setup

- **Production Domain**: Main domain (configured in Vercel)
- **Preview Domain**: sidecaronboarding.io (or your preview domain)
- **Repository**: `DigitalDeskAcademy/sidecar-platform`
- **Deployment Platform**: Vercel

## Step-by-Step Configuration

### 1. GitHub Configuration

#### Branch Protection (Recommended)

While not required for preview deployments, branch protection ensures quality control:

1. Go to **GitHub → Settings → Branches**
2. Add rule for `main` branch
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Dismiss stale pull request approvals
   - ✅ Require branches to be up to date before merging

#### OAuth Configuration

Update your GitHub OAuth app to support preview URLs:

1. Go to **GitHub → Settings → Developer settings → OAuth Apps**
2. Add these callback URLs:

   ```
   # Production
   https://your-production-domain.com/api/auth/callback/github
   https://your-production-domain.com/auth/callback

   # Preview
   https://sidecaronboarding.io/api/auth/callback/github
   https://sidecaronboarding.io/auth/callback

   # Vercel Preview URLs
   https://*.vercel.app/api/auth/callback/github
   https://*.vercel.app/auth/callback
   ```

### 2. Vercel Environment Variables

Configure separate environment variables for preview deployments:

#### Navigate to Settings

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. For each variable, you'll set different values for Production vs Preview

#### Required Variables for Preview

Add these with **"Preview"** environment selected:

```bash
# Database (Choose one option)
DATABASE_URL="postgresql://..."  # Option A: Same as production (shared data)
                                 # Option B: Create separate preview database

# Authentication - CRITICAL: Different from production!
BETTER_AUTH_SECRET="[generate-new-32-char-secret]"  # MUST be different
BETTER_AUTH_URL="https://sidecaronboarding.io"      # Your preview domain

# GitHub OAuth (usually same as production)
AUTH_GITHUB_CLIENT_ID="[same-as-production]"
AUTH_GITHUB_CLIENT_SECRET="[same-as-production]"

# Email Service
RESEND_API_KEY="[same-as-production]"

# Security
ARCJET_KEY="[same-as-production]"

# S3/Tigris Storage
AWS_ACCESS_KEY_ID="[same-as-production]"
AWS_SECRET_ACCESS_KEY="[same-as-production]"
AWS_ENDPOINT_URL_S3="https://t3.storage.tigris.dev"
AWS_ENDPOINT_URL_IAM="[same-as-production]"
AWS_REGION="[same-as-production]"
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES="[same-as-production]"

# Stripe - USE TEST KEYS!
STRIPE_SECRET_KEY="sk_test_..."        # Test key, NOT production
STRIPE_WEBHOOK_SECRET="whsec_test_..."  # Test webhook secret
```

### 3. Domain Configuration

#### Set Up Preview Domain

1. Go to **Vercel → Project → Settings → Domains**
2. Add `sidecaronboarding.io` (or your preview domain)
3. Configure as:
   - **Type**: Preview
   - **Git Branch**: All preview branches OR specific pattern (e.g., `preview-*`)

#### Domain Assignment Options

- **Option A**: Redirect to latest preview deployment
- **Option B**: Assign to specific branch pattern
- **Option C**: Use Vercel's auto-generated preview URLs only

### 4. Database Strategy

#### Option A: Shared Database (Simpler)

Use the same database as production:

- **Pro**: Simpler setup, real data testing
- **Con**: Preview changes affect production data
- **Use**: Same `DATABASE_URL` for both environments

#### Option B: Separate Preview Database (Recommended)

Create a dedicated preview database:

1. **Create Database** (using Neon as example):

   ```bash
   # In Neon dashboard, create new database
   Database Name: sidecar-preview
   ```

2. **Run Migrations**:

   ```bash
   # Set preview DATABASE_URL in .env
   npx prisma migrate deploy
   ```

3. **Seed Data** (optional):

   ```bash
   npx prisma db seed
   ```

4. **Update Vercel**: Use preview DATABASE_URL for Preview environment

### 5. Stripe Configuration

#### Create Test Mode Webhook

1. Go to **Stripe Dashboard → Webhooks**
2. Switch to **Test Mode**
3. Add endpoint:
   ```
   https://sidecaronboarding.io/api/webhook/stripe
   ```
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook secret (starts with `whsec_test_`)
6. Add to Vercel Preview environment variables

### 6. Testing Your Setup

#### Create Test Branch

```bash
git checkout -b test/preview-deployment
echo "<!-- Preview test -->" >> README.md
git add . && git commit -m "test: preview deployment"
git push origin test/preview-deployment
```

#### Verify Deployment

1. Check **Vercel Dashboard** for new deployment
2. Access via:
   - Direct URL: `sidecar-platform-[branch]-[hash].vercel.app`
   - Preview domain: `sidecaronboarding.io` (if configured)

#### Test Critical Features

- [ ] GitHub OAuth login
- [ ] Stripe test payments
- [ ] S3 file uploads
- [ ] Email sending (if configured)
- [ ] Database operations

## Deployment Workflow

### Standard Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. Create Pull Request
# GitHub will show preview URL in PR comments

# 5. After testing and approval
# Merge PR → Auto-deploy to production
```

### Preview-Specific Branch

For changes you want to keep in preview longer:

```bash
git checkout -b preview/experimental-feature
git push origin preview/experimental-feature
# This creates a persistent preview environment
```

## Environment Variable Checklist

### Preview Environment (Vercel)

- [ ] `DATABASE_URL` - Preview or shared database
- [ ] `BETTER_AUTH_SECRET` - Different from production!
- [ ] `BETTER_AUTH_URL` - Set to preview domain
- [ ] `AUTH_GITHUB_CLIENT_ID` - GitHub OAuth
- [ ] `AUTH_GITHUB_CLIENT_SECRET` - GitHub OAuth
- [ ] `RESEND_API_KEY` - Email service
- [ ] `ARCJET_KEY` - Security service
- [ ] `AWS_ACCESS_KEY_ID` - S3 storage
- [ ] `AWS_SECRET_ACCESS_KEY` - S3 storage
- [ ] `AWS_ENDPOINT_URL_S3` - Tigris endpoint
- [ ] `AWS_ENDPOINT_URL_IAM` - Tigris IAM
- [ ] `AWS_REGION` - AWS region
- [ ] `NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES` - Public bucket name
- [ ] `STRIPE_SECRET_KEY` - TEST key only!
- [ ] `STRIPE_WEBHOOK_SECRET` - TEST webhook secret!

## Troubleshooting

### Common Issues

#### "OAuth Redirect Mismatch"

**Solution**: Add all possible preview URLs to GitHub OAuth app callbacks

#### "Stripe Webhook Failed"

**Solution**: Ensure using TEST keys and webhook endpoint is configured for preview domain

#### "Database Connection Failed"

**Solution**: Check DATABASE_URL is correct for preview environment

#### "Preview Not Updating"

**Solution**:

1. Check Vercel dashboard for build errors
2. Ensure environment variables are set for "Preview" scope
3. Try force deploy from Vercel dashboard

#### "Environment Variables Not Loading"

**Solution**:

1. Verify variables are set for "Preview" environment in Vercel
2. Check for typos in variable names
3. Redeploy after adding variables

### Debug Checklist

1. **Check Build Logs**: Vercel → Deployment → View Build Logs
2. **Verify Environment**: Vercel → Settings → Environment Variables → Preview tab
3. **Test Locally**: Use preview environment variables locally to debug
4. **Check Domains**: Ensure preview domain is properly configured

## Security Considerations

### Critical Rules

1. **NEVER use production Stripe keys in preview**
2. **ALWAYS use different BETTER_AUTH_SECRET for preview**
3. **Consider data sensitivity when choosing database strategy**
4. **Regularly rotate preview environment secrets**

### Data Isolation

If handling sensitive data:

- Use separate preview database
- Implement data masking for preview
- Restrict preview access to authorized users only

## Advanced Configuration

### Branch-Specific Environments

Create different preview environments for different branches:

```javascript
// vercel.json
{
  "env": {
    "FEATURE_FLAG_NEW_UI": {
      "preview": "true",
      "production": "false"
    }
  }
}
```

### Automatic Preview Cleanup

Set up automatic cleanup of old preview deployments:

1. Vercel → Settings → General
2. Set "Preview Deployment Deletion" to desired retention period

### Preview Protection

Password-protect preview deployments:

1. Vercel → Settings → General → Preview Protection
2. Enable password protection
3. Share password with authorized testers only

## Quick Reference

### Deployment URLs

- **Production**: `https://your-domain.com`
- **Preview (Custom)**: `https://sidecaronboarding.io`
- **Preview (Auto)**: `https://sidecar-platform-[branch]-[hash].vercel.app`
- **PR Preview**: Linked automatically in GitHub PR comments

### Git Workflow

```bash
# Feature development
git checkout -b feature/name
git push origin feature/name
# → Creates preview deployment

# Hotfix
git checkout -b hotfix/urgent-fix
git push origin hotfix/urgent-fix
# → Creates preview, test, then merge to main

# Long-running preview
git checkout -b preview/next-version
git push origin preview/next-version
# → Persistent preview environment
```

### Vercel CLI Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy to preview
vercel --target preview

# Deploy specific branch
vercel --target preview --git-branch feature/test

# View deployments
vercel list

# Inspect deployment
vercel inspect [deployment-url]
```

## Maintenance

### Regular Tasks

- **Monthly**: Review and clean up old preview deployments
- **Quarterly**: Rotate preview environment secrets
- **Per Release**: Update preview database with production data (if separate)

### Monitoring

- Set up alerts for failed preview deployments
- Monitor preview deployment build times
- Track preview environment costs (if using separate resources)

---

**Last Updated**: 2025-01-21
**Maintained By**: Platform Team
**Questions**: Create issue in GitHub repository
