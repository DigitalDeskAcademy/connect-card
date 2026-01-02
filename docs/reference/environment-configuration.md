# Environment Configuration

**Status:** Documentation Complete
**Last Updated:** 2025-11-30

---

## Overview

This document lists all environment variables required for the Church Connect Hub platform. When forking or deploying to a new environment, ensure all credentials are unique to avoid data leakage.

---

## Environment Files

| File         | Purpose                         | Git Status  |
| ------------ | ------------------------------- | ----------- |
| `.env`       | Shared defaults (non-sensitive) | Tracked     |
| `.env.local` | Local overrides with secrets    | **Ignored** |
| `.envrc`     | direnv automatic loading        | Tracked     |

---

## Required Variables

### Database

| Variable       | Description                     | Example                                          |
| -------------- | ------------------------------- | ------------------------------------------------ |
| `DATABASE_URL` | Neon Postgres connection string | `postgresql://user:pass@host/db?sslmode=require` |

**Fork Checklist:**

- [ ] Create new Neon project
- [ ] Update connection string
- [ ] Run `pnpm db:push` to create schema

---

### Authentication

| Variable                            | Description              | Notes                                |
| ----------------------------------- | ------------------------ | ------------------------------------ |
| `BETTER_AUTH_SECRET`                | Session encryption key   | Generate: `openssl rand -base64 32`  |
| `BETTER_AUTH_URL`                   | Auth callback URL        | Optional, auto-detected              |
| `AUTH_GITHUB_CLIENT_ID`             | GitHub OAuth app ID      | Create new OAuth app per environment |
| `AUTH_GITHUB_CLIENT_SECRET`         | GitHub OAuth secret      |                                      |
| `AUTH_GITHUB_CLIENT_ID_PREVIEW`     | Preview deployment OAuth | Optional                             |
| `AUTH_GITHUB_CLIENT_SECRET_PREVIEW` | Preview OAuth secret     | Optional                             |

**Fork Checklist:**

- [ ] Generate new `BETTER_AUTH_SECRET`
- [ ] Create new GitHub OAuth app at github.com/settings/developers
- [ ] Set callback URL to `{your-domain}/api/auth/callback/github`

---

### S3/Tigris Storage

| Variable                            | Description              | Example                          |
| ----------------------------------- | ------------------------ | -------------------------------- |
| `AWS_ACCESS_KEY_ID`                 | Tigris access key        |                                  |
| `AWS_SECRET_ACCESS_KEY`             | Tigris secret key        |                                  |
| `AWS_ENDPOINT_URL_S3`               | Tigris S3 endpoint       | `https://fly.storage.tigris.dev` |
| `AWS_ENDPOINT_URL_IAM`              | Tigris IAM endpoint      | `https://fly.storage.tigris.dev` |
| `AWS_REGION`                        | Region                   | `auto`                           |
| `NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES` | Bucket name              | `connect-card-testing`           |
| `S3_UPLOAD_ALLOWED_DOMAINS`         | CORS domains (comma-sep) | `example.com,www.example.com`    |

**Fork Checklist:**

- [ ] Create new Tigris bucket at console.tigris.dev
- [ ] Generate new access keys
- [ ] Update bucket name
- [ ] Configure CORS in Tigris console

**Bucket CORS Configuration:**

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

---

### AI Services

| Variable              | Description          | Notes                               |
| --------------------- | -------------------- | ----------------------------------- |
| `ANTHROPIC_API_KEY`   | Claude API key       | Can share if same billing           |
| `CLAUDE_VISION_MODEL` | Model for extraction | Default: `claude-sonnet-4-20250514` |

**Fork Checklist:**

- [ ] Decide: Share key (same billing) or create new
- [ ] Verify API key has vision capabilities

---

### Email (Resend)

| Variable            | Description    | Example                  |
| ------------------- | -------------- | ------------------------ |
| `RESEND_API_KEY`    | Resend API key |                          |
| `RESEND_FROM_EMAIL` | Sender email   | `noreply@yourdomain.com` |

**Fork Checklist:**

- [ ] Create Resend account or use existing
- [ ] Verify sender domain in Resend dashboard
- [ ] Update from email

---

### Payments (Stripe)

| Variable                | Description            | Notes                              |
| ----------------------- | ---------------------- | ---------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe secret key      | **MUST be different per business** |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Create new webhook endpoint        |

**Fork Checklist:**

- [ ] Create new Stripe account (different business = different account)
- [ ] Generate new API keys
- [ ] Create webhook endpoint pointing to `/api/webhooks/stripe`
- [ ] Update webhook secret

---

### Security (Arcjet)

| Variable     | Description        | Notes                        |
| ------------ | ------------------ | ---------------------------- |
| `ARCJET_KEY` | Arcjet project key | Separate project recommended |

**Fork Checklist:**

- [ ] Create new Arcjet project at arcjet.com
- [ ] Update API key

---

### Optional Services

| Variable               | Description           | Notes                           |
| ---------------------- | --------------------- | ------------------------------- |
| `PLATFORM_ADMIN_EMAIL` | Auto-promote to admin | Email that gets admin on signup |
| `GHL_CLIENT_ID`        | GoHighLevel OAuth     | Phase 5 feature                 |
| `GHL_CLIENT_SECRET`    | GoHighLevel secret    |                                 |
| `GHL_REDIRECT_URI`     | GoHighLevel callback  |                                 |

---

## Client-Side Variables

These are exposed to the browser (prefix: `NEXT_PUBLIC_`):

| Variable                            | Description                |
| ----------------------------------- | -------------------------- |
| `NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES` | S3 bucket for display URLs |
| `NEXT_PUBLIC_APP_URL`               | Application base URL       |

---

## Fork Checklist Summary

When forking this project, you **MUST** change:

| Priority     | Service    | Variables                                    |
| ------------ | ---------- | -------------------------------------------- |
| **Critical** | Database   | `DATABASE_URL`                               |
| **Critical** | S3 Storage | `AWS_*`, `NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES` |
| **Critical** | Stripe     | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Critical** | Auth       | `BETTER_AUTH_SECRET`, `AUTH_GITHUB_*`        |
| Recommended  | Arcjet     | `ARCJET_KEY`                                 |
| Recommended  | Resend     | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`        |
| Optional     | Anthropic  | `ANTHROPIC_API_KEY` (can share)              |

---

## Validation

The app validates all required env vars at startup using `@t3-oss/env-nextjs`. Missing or invalid values will throw an error.

See `/lib/env.ts` for the full schema.

---

## Related Documentation

- `/docs/features/tech-debt/s3-bucket-structure.md` - S3 organization
- `/lib/env.ts` - Environment validation schema
