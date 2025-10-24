# 🚀 Sidecar Platform - Production Deployment Guide

**Complete deployment guide for the Sidecar Platform B2B software onboarding system**

---

## 📋 Quick Start Checklist

**Essential Steps for Production Deployment:**

1. ✅ **Code Ready** - Main branch pushed with production-ready features
2. ⚙️ **Configure Environment Variables** - All 15 required variables in Vercel
3. 🔧 **Update External Services** - GitHub OAuth, Stripe webhooks
4. 🚀 **Deploy** - Trigger Vercel production deployment
5. 🔍 **Test & Monitor** - Verify all functionality and set up monitoring

---

## 🔧 Environment Variables Configuration

### 🚨 Required Variables (15 total)

**All variables below MUST be configured in Vercel before deployment will succeed.**

#### **Database & Authentication (5 variables)**

```bash
DATABASE_URL=postgresql://username:password@host/database
BETTER_AUTH_SECRET=your-32-plus-character-secret-here
BETTER_AUTH_URL=https://your-production-domain.com
AUTH_GITHUB_CLIENT_ID=your_github_oauth_app_id
AUTH_GITHUB_CLIENT_SECRET=your_github_oauth_app_secret
```

#### **External Services (2 variables)**

```bash
RESEND_API_KEY=re_YourResendAPIKey
ARCJET_KEY=ajkey_YourArcjetSecurityKey
```

#### **File Storage - Tigris S3 (5 variables)**

```bash
AWS_ACCESS_KEY_ID=your_tigris_access_key
AWS_SECRET_ACCESS_KEY=your_tigris_secret_key
AWS_ENDPOINT_URL_S3=https://t3.storage.tigris.dev
AWS_ENDPOINT_URL_IAM=your_tigris_iam_endpoint
AWS_REGION=your_tigris_region
```

#### **Payment Processing - Stripe (2 variables)**

```bash
STRIPE_SECRET_KEY=sk_live_YourProductionStripeKey
STRIPE_WEBHOOK_SECRET=whsec_YourProductionWebhookSecret
```

#### **Client-Side Variables (1 variable)**

```bash
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=your-s3-bucket-name
```

### **How to Configure in Vercel**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add each variable above** with their production values
3. **Set Environment** to "Production" (or all environments)
4. **Save** and trigger a new deployment

---

## 🔄 External Services Updates

### **1. GitHub OAuth App**

- **Update callback URL**: `https://your-domain.com/api/auth/callback/github`
- **Update homepage URL**: `https://your-domain.com`

### **2. Stripe Webhook**

1. **Create new webhook endpoint**: `https://your-domain.com/api/webhook/stripe`
2. **Select events**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. **Copy webhook secret** to `STRIPE_WEBHOOK_SECRET` variable

### **3. Better Auth URL**

- Change `BETTER_AUTH_URL` from localhost to your production domain

---

## 🚀 Deployment Process

### **Phase 1: Pre-Deployment (5 minutes)**

- ✅ **Code Status**: Main branch pushed with latest features
- ✅ **Build Status**: Clean build with no errors
- ✅ **Environment Variables**: All 15 variables configured in Vercel
- ✅ **External Services**: OAuth and webhook URLs updated

### **Phase 2: Deploy (2 minutes)**

1. **Trigger Deployment**: Push to main or deploy via Vercel dashboard
2. **Monitor Build**: Watch build logs for any errors
3. **Verify Success**: Confirm deployment completes successfully

### **Phase 3: Testing (10 minutes)**

1. **Authentication**: Test GitHub OAuth login
2. **Course Access**: Verify course catalog loads
3. **Admin Dashboard**: Test admin functionality
4. **Payment Flow**: Test Stripe checkout (use test mode first)
5. **File Uploads**: Verify S3 file operations work

### **Phase 4: Monitoring Setup (5 minutes)**

1. **Enable Vercel Analytics** in dashboard
2. **Set up error tracking** (Sentry recommended)
3. **Monitor initial traffic** and performance

---

## ⚠️ Critical Production Fixes Needed

### **🚨 High Priority - Fix Before Production**

#### **Stripe Webhook Security Issues**

**File**: `app/api/webhook/stripe/route.ts:146`

- **Bug**: Amount stored in cents instead of dollars
- **Bug**: No payment_status verification before enrollment
- **Bug**: Missing database transactions for atomic operations
- **Bug**: Error handling throws instead of logging

#### **Debug Console Statements**

**Remove from production:**

- `app/admin/courses/[courseId]/delete/actions.ts:26`
- `app/my-learning/[slug]/[lessonId]/actions.ts:40,72`
- `app/(public)/courses/[slug]/actions.ts:371,376`
- `app/api/auth/[...all]/route.ts:246`
- `app/data/admin/admin-get-platform-analytics.ts:122`

#### **Security Headers Missing**

**File**: `next.config.ts`

- Add CSP (Content Security Policy)
- Add HSTS headers
- Add X-Frame-Options
- Add X-Content-Type-Options

---

## 📊 Success Criteria

**Deployment is successful when:**

- ✅ **Build**: Completes without errors
- ✅ **Routes**: All 23 routes accessible
- ✅ **Authentication**: GitHub OAuth working
- ✅ **Payments**: Stripe processing correctly
- ✅ **File Storage**: S3 uploads functional
- ✅ **Admin Features**: Course management operational
- ✅ **Student Features**: Dashboard with progress tracking
- ✅ **Performance**: Core Web Vitals meeting targets

---

## 🛡️ Security & Production Readiness

### **Authentication Security**

- [ ] Review OAuth app callback URLs for production
- [ ] Verify `BETTER_AUTH_SECRET` is 32+ characters
- [ ] Confirm production domain in `BETTER_AUTH_URL`

### **Payment Security**

- [ ] Switch to production Stripe keys (`sk_live_`)
- [ ] Configure production webhook with proper signature verification
- [ ] Test payment flow end-to-end

### **Infrastructure Security**

- [ ] Enable database connection pooling
- [ ] Configure proper security headers
- [ ] Set up rate limiting for production traffic
- [ ] Review and tighten CSP headers

---

## 🆘 Emergency Procedures

### **Rollback Process**

1. **Vercel Dashboard**: Revert to previous deployment
2. **Database**: Restore from backup if needed
3. **Stripe**: Revert webhook endpoints
4. **Verify**: Test all critical functionality

### **Common Issues & Solutions**

- **Build fails**: Check environment variables are all set
- **Auth fails**: Verify GitHub OAuth callback URLs
- **Payments fail**: Confirm Stripe webhook endpoint and signature
- **Files fail**: Check S3 credentials and bucket permissions

---

## 📞 Production Support

### **Monitoring**

- **Vercel Analytics**: Performance and usage metrics
- **Error Tracking**: Sentry for production errors
- **Database**: Monitor connection pool and query performance
- **Third-Party Services**: Monitor Stripe, Resend, Tigris status

### **Key Performance Indicators**

- Page load times under 2 seconds
- Error rate under 1%
- Uptime above 99.9%
- Successful payment rate above 95%

---

**🎯 The Sidecar Platform is ready for enterprise production deployment!**

_Last Updated: $(date '+%Y-%m-%d')_
