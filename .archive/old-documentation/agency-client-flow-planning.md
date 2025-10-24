# Agency-Client Flow Planning Document

This document outlines the implementation planning for the Digital Desk → Infusion Vibes client onboarding flow.

## Overview

**Goal**: Enable Digital Desk (agency) to invite Infusion Vibes (client) to access platform courses provided by SideCar.

**Document Guidelines**: When reviewing each section, provide:

1. Industry standard approaches
2. Recommended solution based on enterprise B2B SaaS best practices
3. Rationale for the recommendation

---

## Section 1: Platform Courses (SideCar's Core Content)

### Questions to Address:

1. **Ownership Model**: Should platform courses be "owned" by a system user or have a special flag?

2. **Distribution Model**: When Digital Desk (agency) gets access, do they:

   - See platform courses in their course list automatically?
   - Need to "enable" or "subscribe" to specific platform courses?
   - Get all platform courses or select which ones to offer clients?

3. **Customization Rights**: Can agencies add their own intro/outro to platform courses, or are they completely locked?

4. **Branding**: Do platform courses show "Powered by SideCar" or can agencies white-label them?

### Decision:

**MVP Approach**:

1. **Ownership Model**: Use `isPlatformCourse: Boolean` flag
2. **Distribution Model**: All agencies automatically see ALL platform courses (no opt-in for MVP)
3. **Client Access**: All platform courses visible to agency are visible to their clients
4. **Agency Control**: Simple hide/show toggle per course for their clients (if not complex)
5. **Content**: 3-4 platform courses created via seed script

**Rationale**: Get to market fast, validate with real users, iterate based on feedback

---

## Section 2: Agency Capabilities (Digital Desk)

### Questions to Address:

1. **Course Creation**: Can Digital Desk create their own custom courses in addition to platform courses?

2. **Course Management UI**: Should they see two sections - "Platform Courses" and "My Courses"?

3. **Course Control**: What level of control do agencies have over platform courses?

### Decision:

**MVP Approach**:

1. **Course Creation**: Yes - feature already exists, agencies can create custom courses
2. **Course Management UI**: Simple list showing both platform courses and custom courses together
3. **Platform Course Control**: Read-only (no edit/delete), optional hide/show from clients

**MVP Focus**: Get platform courses working first, custom course creation is bonus since it already exists

---

## Section 3: Client Invitation Flow

### Industry Standard Options:

#### Option A: Magic Link Pattern (Recommended)

- Agency enters client email
- System sends branded email with secure magic link
- Link contains token that expires (24-48 hours typical)
- Client clicks link → creates account → auto-assigned to agency
- No password needed initially (can set one later)

**Pros**: Frictionless, secure, no password sharing
**Cons**: Requires email delivery reliability

#### Option B: Invitation Code Pattern

- Agency generates unique invitation code
- Shares code with client (email/text/call)
- Client signs up with code
- System validates code and assigns to agency

**Pros**: Flexible sharing methods, doesn't rely on email
**Cons**: Less secure, codes can be shared inappropriately

#### Option C: Pre-provisioned Account

- Agency creates client account with temporary password
- Client receives email with username/temp password
- Forced password change on first login

**Pros**: Agency has full control
**Cons**: Password sharing concerns, more friction

### Decision:

**MVP Approach**: Organization Invitation System (Better Auth built-in)

**Flow**:

1. Agency admin goes to "Clients" section in dashboard
2. Clicks "Invite Client", enters email address
3. System creates invitation record and sends branded email
4. Client clicks link, creates account, auto-joins agency
5. Agency has full visibility of pending/accepted invitations

**Why This Approach**:

- Uses Better Auth's existing organization invitation system
- Provides full audit trail and user management
- Industry standard (Slack, Notion, Linear all use this)
- 2-day implementation for MVP
- Gives agencies the control and visibility they need

---

## Section 4: Client Experience (Infusion Vibes)

### Questions to Address:

1. **Course Access Model**: Should clients see ALL agency courses or need enrollment per course?

2. **Multi-Agency Support**: Can a client belong to multiple agencies?

   - Example: Infusion Vibes works with Digital Desk AND another agency

3. **Progress Tracking**: Is progress tracked per organization or per user globally?

4. **Course Assignment**:
   - Automatic access to all agency courses?
   - Manual assignment by agency?
   - Self-service enrollment from available courses?

### Decision:

**MVP Approach**:

1. **Course Access**: Clients see ALL courses their agency has (platform + custom)
2. **No Enrollment Step**: If you're in the org, you can access the courses
3. **Agency Control**: Agencies can hide specific courses from clients (simple toggle)
4. **Multi-Agency**: NOT SUPPORTED - one client belongs to one agency only
5. **Progress Tracking**: Per user globally (Sarah's progress is Sarah's)

**Rationale**: Simplest implementation, covers 99% of use cases, can iterate based on feedback

---

## Section 5: Technical Implementation

### Database Schema Considerations:

```typescript
// Current Course model has:
- userId (owner)
- organizationId (which org)

// Potential additions needed:
- isPlatformCourse: Boolean
- allowAgencyCustomization: Boolean
- sourceId: String? (for cloned courses)
- platformCourseId: String? (reference to original)
```

### Permissions Matrix:

| Role           | Platform Courses   | Custom Courses     | Invite Clients | View Progress |
| -------------- | ------------------ | ------------------ | -------------- | ------------- |
| Platform Admin | Create/Edit/Delete | N/A                | N/A            | All           |
| Agency Admin   | View/Enable        | Create/Edit/Delete | Yes            | Their clients |
| Agency Client  | View Assigned      | None               | No             | Own only      |

### Decision:

**MVP Approach**: Minimal schema changes, maximum leverage of existing structure

**Schema Changes Required**:

```prisma
// Add to Course model:
isPlatformCourse    Boolean @default(false)  // Identifies SideCar platform courses
isHiddenFromClients Boolean @default(false)  // Agencies can hide from clients
```

**That's it!** Everything else already exists.

**Permission Logic (in code)**:

- Platform Admin: Create/edit platform courses
- Agency Admin: View platform courses, toggle hide/show for clients
- Agency Client: See all non-hidden courses in their org

**Data Structure**:

- Platform courses: `isPlatformCourse = true`, owned by platform
- Agency courses: `isPlatformCourse = false`, owned by agency
- Better Auth handles all invitation/member management

---

## Section 6: Email & Notifications

### Questions to Address:

1. **Email Branding**:

   - Use agency's branding or SideCar branding?
   - Include agency logo if available?
   - Custom email domains?

2. **Email Templates Needed**:

   - Client invitation
   - Welcome email after signup
   - Course assignment notification
   - Progress reminders

3. **Resend Configuration**:
   - Currently configured
   - Need to create templates

### Decision:

**MVP Approach**: WHITE-LABEL - Agency branding only

- **From**: "[Agency Name] <onboarding@resend.dev>"
- **Subject**: "You're invited to [Agency Name]'s training platform"
- **Content**: Agency name and branding only, NO SideCar mention
- **This is a white-label service** - clients never see SideCar branding

---

## Section 7: Course Lifecycle Management

### Questions to Address:

1. **Platform Course Creation**:

   - How do platform courses get created initially?
   - Seed data? Admin UI? Import tool?

2. **Platform Course Updates**:

   - Can platform courses be updated?
   - How do updates propagate to agencies?
   - Version control needed?

3. **Agency Course Lifecycle**:
   - Can agencies archive courses?
   - What happens to client progress if course is removed?

### Decision:

**MVP Approach**:

1. **Platform Courses**: Created via seed script (3-4 courses), no updates in MVP
2. **Agency Courses**: Can create/edit/delete their own
3. **White-Label Display**: Platform courses appear as agency content to clients
4. **No versioning** in MVP - keep it simple

---

## Section 8: Billing & Analytics

### Questions to Address:

1. **Access Control**:

   - Does course access tie to subscription status?
   - Different tiers with different platform course access?

2. **Usage Tracking**:

   - Track which clients use which courses?
   - Analytics dashboard for agencies?
   - Platform-wide analytics?

3. **Limits**:
   - Limit number of clients per agency?
   - Limit number of courses?

### Decision:

**MVP Approach**:

1. **Billing Model**: Agency pays SideCar $297/month subscription
2. **Client Access**: Unlimited clients for MVP (monitor usage)
3. **Analytics**: Basic - count of clients, courses accessed
4. **No limits initially** - gather data, then create pricing tiers

---

## Implementation Phases

### Phase 1: Foundation

- [ ] Add platform course flags to database
- [ ] Create platform course seeding
- [ ] Update course permissions

### Phase 2: Agency Features

- [ ] Agency course management UI
- [ ] Platform course viewing
- [ ] Client invitation system

### Phase 3: Client Onboarding

- [ ] Invitation acceptance flow
- [ ] Client dashboard
- [ ] Course enrollment

### Phase 4: Polish

- [ ] Email templates
- [ ] Analytics
- [ ] Admin tools

---

## Next Steps

1. Review Section 1 (Platform Courses) first
2. Make decisions on each section
3. Update this document with decisions
4. Create detailed technical implementation plan
5. Begin development

---

_Last Updated: [Date]_
_Status: Planning Phase_
