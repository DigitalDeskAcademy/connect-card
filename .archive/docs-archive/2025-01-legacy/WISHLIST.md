# Feature Wishlist

This file tracks nice-to-have features and enhancements that can be implemented after production deployment.

## 🔬 OPTIONAL FEATURES

### Lesson Completion Enhancements

- [ ] **Enrollment verification** - Add enrollment check in markLessonComplete action for enhanced security
- [ ] **Rate limiting** - Add Arcjet rate limiting to completion actions to prevent abuse
- [ ] **Bulk completion** - Allow marking multiple lessons complete simultaneously
- [ ] **Completion analytics** - Track completion patterns and time-to-complete metrics
- [ ] **Undo completion** - Allow users to mark lessons as incomplete if needed
- [ ] **Completion timestamps** - Add detailed audit trail with completion dates/times
- [ ] **Learning path progression** - Automatic unlocking of next lessons/chapters upon completion
- [ ] **Achievement system** - Badges, certificates, or rewards for course/chapter completion
- [ ] **Progress notifications** - Email/SMS alerts for milestone achievements
- [ ] **Completion requirements** - Minimum watch time or quiz scores before allowing completion

### UI/UX Improvements

- [ ] **Cancel button on course creation** - Add a Cancel button next to "Create Course" that returns to course list
- [ ] **Placeholder image preview in uploader** - Show placeholder thumbnail in upload component, allow deletion/replacement
- [ ] **Unsaved changes warning** - Warn users before navigating away from forms with unsaved changes
- [ ] **Bulk actions** - Select multiple courses for bulk delete/status change
- [ ] **Keyboard shortcuts** - Quick navigation and actions for power users

### Video & Content Enhancements

- [ ] **Video progress tracking** - Save and resume video playbook position
- [ ] **Video completion detection** - Auto-mark lessons complete when video reaches 90%+ watched
- [ ] **Interactive video features** - Quiz overlays, chapter markers, speed controls
- [ ] **Download for offline** - Allow content download for offline learning
- [ ] **Closed captions** - Accessibility improvements with subtitle support

### Advanced Onboarding Features

- [ ] **Conditional workflows** - Branch onboarding paths based on role/department/responses
- [ ] **Due date management** - Automatic task assignment with deadlines and escalations
- [ ] **Manager approval workflows** - Required sign-offs for sensitive onboarding steps
- [ ] **Integration webhooks** - Real-time notifications to HRIS/Slack/Teams systems
- [ ] **Custom field collection** - Dynamic forms for organization-specific data gathering
- [ ] **Document signing** - E-signature integration for policies and agreements

### Platform Admin Analytics Dashboard (Alex Hormozi Metrics)

- [ ] **Real-time SaaS Metrics Dashboard** - Comprehensive business health monitoring with key metrics Alex Hormozi emphasizes

  **Core Metrics to Display**:

  - **Churn Analytics**

    - Monthly churn rate (% customers lost per month)
    - Annual churn rate (1 - (1 - monthly_churn)^12)
    - Gross revenue churn vs Net revenue retention
    - Churn by cohort and reason analysis

  - **LTV (Lifetime Value)**

    - Average customer LTV: (Average Revenue per User × Gross Margin %) / Monthly Churn Rate
    - LTV by acquisition channel
    - LTV by customer segment
    - LTV:CAC ratio (target 3:1 minimum, ideally 5:1+)

  - **CAC (Customer Acquisition Cost)**

    - Blended CAC (total sales & marketing / new customers)
    - Paid CAC vs Organic CAC
    - CAC payback period in months
    - CAC by channel (GitHub OAuth, Email OTP, direct signup)

  - **MRR Movement**

    - New MRR (new customers × price)
    - Expansion MRR (upgrades, additional seats)
    - Contraction MRR (downgrades)
    - Churned MRR (cancellations)
    - Net MRR growth rate
    - MRR momentum (compound monthly growth)

  - **Conversion Metrics**

    - Trial → Paid conversion rate (target: 15-25% for B2B)
    - Signup → Active user rate
    - Time to first value (onboarding completion)
    - Feature adoption rates (which modules get used)

  - **Unit Economics**
    - Gross margin per customer
    - Contribution margin (Revenue - Variable Costs)
    - Months to break-even per customer
    - Revenue per employee

  **Dashboard Features**:

  - Real-time data refresh (live metrics)
  - Period comparison (MoM, QoQ, YoY)
  - Cohort analysis views
  - Exportable reports
  - Alert thresholds (e.g., churn spike warnings)
  - Mobile-responsive design for checking on the go

  **Technical Implementation**:

  - Dedicated `/platform/admin/metrics` route
  - Aggregated database queries with caching
  - Chart.js or Recharts for visualizations
  - Webhook integration for real-time Stripe events
  - Daily/weekly email reports option

  **Why These Metrics Matter** (Hormozi's Framework):

  - LTV:CAC ratio determines profitability and growth potential
  - Churn rate is the silent killer of SaaS businesses
  - MRR momentum shows true growth trajectory
  - Conversion rates reveal product-market fit
  - Unit economics determine scalability

  **Complexity**: High (2-3 days for full implementation)
  **Value**: Critical - Can't scale what you can't measure
  **Priority**: High - Implement after core platform stability

### Organization Branding & Customization

- [ ] **Logo/Icon Upload System** - Allow organizations to upload custom logos and icons

  **Features**:

  - Logo upload in organization settings
  - Icon format (square) for sidebar display
  - Full logo format for larger displays
  - Default placeholder system (initials or generic icon)
  - Image optimization and CDN storage
  - Dark/light mode variants support

  **Technical Implementation**:

  - Add `logoUrl` and `iconUrl` fields to Organization model
  - S3/Tigris storage for uploaded images
  - Image processing for proper sizing (icon: 32x32, logo: varied)
  - Fallback to organization initials if no logo uploaded
  - Cache headers for performance

  **UI Locations**:

  - Sidebar header (icon or initials)
  - Login page (full logo)
  - Email templates (logo)
  - Agency portal navigation

  **Complexity**: Medium (1-2 days)
  **Value**: Medium - Nice professional touch but not critical
  **Priority**: Low - Core functionality more important

### Authentication Enhancements

- [ ] **Google OAuth authentication** - Add Google OAuth as third authentication method alongside GitHub OAuth and Email OTP

  - **Complexity**: Medium (2-3 hours implementation)
  - **Value**: High - Google OAuth is the most prevalent authentication method
  - **Implementation**: Leverages existing Better Auth OAuth infrastructure
  - **Requirements**: Google Cloud Console OAuth app setup, environment variables, callback URL configuration
  - **Benefits**: Industry-standard authentication options, improved user conversion rates

- [ ] **Secure account switching with session termination** - Server-side sign-out flow for switching accounts

  - **Complexity**: Low (1-2 hours implementation)
  - **Value**: Medium - Better security and UX for account switching
  - **Implementation**: Server action with Better Auth session termination
  - **Benefits**: Prevents session confusion, clean account switching

- [ ] **Multi-factor authentication (MFA) support** - Add 2FA/MFA for enhanced security

  - **Complexity**: High (6-8 hours implementation)
  - **Value**: High - Enterprise requirement for many B2B customers
  - **Implementation**: TOTP support via Better Auth plugins
  - **Benefits**: Enterprise-grade security, compliance requirements

- [ ] **Session management dashboard** - User can view and manage active sessions

  - **Complexity**: Medium (3-4 hours implementation)
  - **Value**: Medium - Transparency and control for users
  - **Implementation**: Track sessions, allow remote termination
  - **Benefits**: Security awareness, device management

- [ ] **Login history and device tracking** - Audit trail of authentication events
  - **Complexity**: Medium (3-4 hours implementation)
  - **Value**: Medium - Security monitoring and compliance
  - **Implementation**: Log auth events with IP, device info
  - **Benefits**: Security alerts, suspicious activity detection

### Team Management Features

- [ ] **Team invitation system** - Allow agency owners to invite additional admins and team members
  - **Complexity**: High (8-10 hours implementation)
  - **Value**: Critical for B2B SaaS - agencies need multiple admins
  - **Current Limitation**: MVP supports one admin per organization
  - **Implementation Requirements**:
    - Email invitation system with secure tokens
    - Role selection during invitation (AGENCY_ADMIN vs END_USER)
    - Invitation management dashboard
    - Email templates for invitations
    - Expiration and revocation of invites
  - **Benefits**:
    - Support larger agency teams
    - Better delegation of admin responsibilities
    - Improved enterprise readiness
  - **Security Considerations**:
    - Secure token generation and validation
    - Rate limiting on invitation sending
    - Permission checks for invitation creation

### UI/UX Enhancements

- [ ] **AI placeholder text** - Add clickable 'Generate with AI' functionality to input fields

### Security Enhancements

- [ ] **Production Security Headers** - Add comprehensive security headers to middleware

  - **Complexity**: Medium (2-3 hours implementation)
  - **Value**: Critical for production security (prevents XSS, clickjacking, etc.)
  - **Priority**: High for production, not needed for MVP
  - **Headers to implement**:
    - X-Frame-Options: DENY (prevents clickjacking)
    - X-Content-Type-Options: nosniff (prevents MIME sniffing)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: camera=(), microphone=(), geolocation=()
    - Content-Security-Policy (requires careful configuration)
    - Strict-Transport-Security (HTTPS only)
  - **Considerations**:
    - CSP needs to whitelist Stripe, GitHub API, Tigris S3
    - Next.js requires 'unsafe-inline' for dev mode
    - Consider using nonces for production CSP
  - **Additional improvements**:
    - Replace console.warn with structured logging
    - Add request ID generation for security tracing
    - Add rate limiting per IP address
    - Create /well-known/security.txt file

- [ ] **Production security headers** - Add comprehensive security headers to next.config.ts:
  - Content Security Policy (CSP) for XSS protection
  - HSTS (HTTP Strict Transport Security) for HTTPS enforcement
  - X-Frame-Options to prevent clickjacking
  - X-Content-Type-Options to prevent MIME sniffing
  - Referrer-Policy for privacy control

## 🤖 AI-POWERED FEATURES

### AI Course Creation Assistant

- [ ] **Real-time AI Course Builder** - Above-industry-standard AI integration for course creation
  - **Interactive wizard** during course creation with live AI suggestions as admin types
  - **Contextual awareness** - AI learns from successful courses on your platform
  - **Embedded experience** - AI assistant panel integrated directly in course creator UI
  - **Selective application** - Admin can accept/reject individual suggestions (not all-or-nothing)
- [ ] **Intelligent Structure Generation**

  - **Topic analysis** - AI analyzes course title/description to suggest proven module structures
  - **Industry-specific templates** - Leverages successful B2B software onboarding patterns
  - **Learning objectives** - Auto-generates measurable learning outcomes for each module
  - **Prerequisite mapping** - Creates logical learning path dependencies

- [ ] **Progressive Content Enhancement**

  - **Phase 1**: AI generates course skeleton (modules, lessons, objectives)
  - **Phase 2**: Admin reviews and approves structure modifications
  - **Phase 3**: AI fills in detailed content (lesson outlines, exercises, assessments)
  - **Phase 4**: Generate supplementary materials (quizzes, practice exercises, resources)

- [ ] **Multi-Model AI Architecture**
  - **GPT-4** for course structure and learning objectives
  - **Claude** for detailed explanations and tutorial content
  - **Specialized models** for code examples and technical content
  - **Quality scoring** - AI rates its own suggestions with confidence scores
- [ ] **Adaptive Learning Engine**

  - **Feedback loop** - AI learns from admin edits and preferences
  - **A/B testing integration** - Suggests variations based on engagement data
  - **Completion prediction** - Analyzes structure for likely learner success rates
  - **Continuous improvement** - AI suggestions get better with platform usage

- [ ] **Advanced Content Generation**
  - **Assessment creation** - Auto-generate quizzes and practical exercises
  - **Multiple difficulty levels** - Create beginner/intermediate/advanced versions
  - **Interactive elements** - Suggest engagement techniques and activities
  - **Resource recommendations** - Link to relevant external materials and tools

**Implementation Notes:**

- **UI Pattern**: Similar to Notion AI, GitHub Copilot, Grammarly (embedded, contextual)
- **User Experience**: AI as collaborative partner, not batch generator
- **Technical Architecture**: Real-time suggestions with streaming responses
- **Data Privacy**: Admin content never leaves secure environment
- **Cost Management**: Token optimization and caching for efficiency

**Success Metrics:**

- Course creation time reduction (target: 60%+ faster)
- Course completion rates (AI-structured vs manually created)
- Admin satisfaction with AI suggestions (acceptance rate)
- Platform-wide content quality improvement

## 🔍 Logging & Monitoring Infrastructure

- [ ] **Implement structured logging system** - Add Pino or Winston for server-side logs

  - **Complexity**: Medium (4-6 hours for basic setup)
  - **Value**: Critical for production debugging
  - **Priority**: High once in production

- [ ] **Set up error tracking with Sentry** - Frontend and backend error monitoring

  - **Complexity**: Low (2-3 hours)
  - **Value**: Very high - catch errors before users report them
  - **Free tier**: 5k errors/month

- [ ] **Add authentication audit logging** - Track all auth events

  - Login attempts (success/failure)
  - OTP sent/verified/failed
  - Session created/destroyed
  - Organization switches
  - Permission denials
  - **Complexity**: Medium (4-5 hours)
  - **Value**: Critical for security and compliance

- [ ] **Implement API request/response logging** - Log external API calls

  - Stripe API calls and webhooks
  - Resend email sending (success/failure)
  - S3/Tigris operations
  - Better Auth API calls
  - **Complexity**: Medium (3-4 hours)
  - **Value**: High for debugging integration issues

- [ ] **Set up log aggregation service** - Centralized log management

  - **Options**: Axiom (100GB/month free), Logtail, DataDog
  - **Complexity**: Medium (4-6 hours)
  - **Value**: Essential for production troubleshooting

- [ ] **Add APM monitoring** - Application Performance Monitoring

  - Track slow queries
  - Monitor API response times
  - Identify performance bottlenecks
  - **Options**: New Relic, DataDog APM, AppSignal
  - **Complexity**: High (8-10 hours)

- [ ] **Create debugging dashboard** - Internal tool for support team

  - View user sessions
  - Check organization status
  - Debug auth issues
  - View recent errors
  - **Complexity**: High (10-12 hours)

- [ ] **Implement webhook event logging** - Track webhook processing

  - Log all incoming webhooks
  - Track processing success/failure
  - Alert on webhook failures
  - **Complexity**: Low (2-3 hours)

- [ ] **Add session replay for UX debugging** - Visual debugging

  - **Options**: LogRocket, FullStory, Hotjar
  - Record user sessions for bug reproduction
  - **Complexity**: Low (2-3 hours)
  - **Value**: High for UX issues

- [ ] **Set up alerting rules** - Proactive monitoring
  - High error rate alerts
  - Failed payment alerts
  - Authentication failure spikes
  - Database connection issues
  - **Complexity**: Medium (4-5 hours)

**Implementation Priority:**

1. **Phase 1 (Immediate)**: Sentry + Basic server logs
2. **Phase 2 (Pre-scale)**: Log aggregation + Auth audit logs
3. **Phase 3 (Growth)**: APM + Session replay + Full monitoring

---

_Last updated: 2025-09-20_
