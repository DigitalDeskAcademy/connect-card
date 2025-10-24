# Agency Signup/Signin Flow - Phase Plan

## Current Problem Analysis

### The Issue

Currently, the `/login` page is the **same for everyone**:

- New users who need to create an account
- Existing users who want to sign in
- No way to create an organization during signup
- Users created via OAuth have no organizationId (required field)
- No role assignment during signup

### Current Flow Problems

1. **Landing Page** → "Start Free Trial" → `/login` (wrong - should go to signup)
2. **Login Page** → OAuth/Email → Creates user WITHOUT organization
3. **Database** → User missing required `organizationId` field
4. **Result** → User can't access any part of the app properly

### What We Need

- Separate **signup** flow for new agencies
- Keep **login** flow for existing users
- Create organization + user together during signup
- Assign proper roles (AGENCY_OWNER for new signups)
- Handle trial activation

---

## Phase 1: Fix Entry Points & User Journey

**Goal**: Separate signup from login in the UI

### Changes Required

1. **Update Landing Page CTAs** (`app/(public)/page.tsx`)

   - "Start Free Trial" → `/signup` (not `/login`)
   - "Login" stays → `/login`

2. **Update Signup Page** (`app/(public)/signup/page.tsx`)

   - "Create Free Account" → `/agency-signup` (not `/login`)
   - Add "Already have an account? Login" link

3. **Create Clear Distinction**
   - `/login` = Existing users only
   - `/agency-signup` = New agency registration
   - `/signup` = Marketing page that leads to `/agency-signup`

### Testing

- [ ] Landing page CTAs go to correct destinations
- [ ] Clear path for new vs existing users
- [ ] No dead ends or circular redirects

---

## Phase 2: Build Agency Signup Flow

**Goal**: Complete signup that creates organization + user

### New Pages & Components

1. **Create `/agency-signup` page**

   ```
   Fields:
   - Agency Name (for organization)
   - Agency Website (optional)
   - Your Name
   - Your Email
   - Choose Authentication:
     - Continue with GitHub
     - Continue with Email (OTP)
   ```

2. **Signup Process Flow**
   ```
   User fills form → Clicks "Create Account" →
   Backend creates:
   1. Organization (type: AGENCY, status: TRIAL)
   2. User (role: AGENCY_OWNER, organizationId: new org)
   3. 30-day trial activation
   → Redirect to agency dashboard
   ```

### Implementation Approach

**Option A: Custom Signup with Better Auth Hooks**

- Use Better Auth's `signUp` method
- Hook into `onUserCreated` to add organization
- Complex but uses Better Auth flow

**Option B: Server Action Before Auth**

- Create organization first via server action
- Store in session/cookie temporarily
- Complete auth flow
- Link on callback

**Option C: Post-Auth Organization Creation**

- Let Better Auth create user normally
- On first login, detect no organization
- Redirect to "Complete Setup" page
- Create organization and update user

### Recommended: Option C (Safest)

- Works with existing Better Auth flow
- No modifications to auth pipeline
- Clear separation of concerns
- Easy to test and debug

---

## Phase 3: Implement Post-Auth Setup Flow

**Goal**: Handle organization creation after authentication

### Implementation

1. **Update `/auth/callback/page.tsx`**

   ```typescript
   // Check if user has organization
   if (!user.organizationId) {
     // New user - needs setup
     redirect("/setup/organization");
   }
   ```

2. **Create `/setup/organization/page.tsx`**

   - Form to collect agency details
   - Create organization
   - Update user with organizationId and role
   - Start trial
   - Redirect to dashboard

3. **Protect Setup Route**
   - Must be authenticated
   - Only accessible if no organization
   - One-time setup per user

### Data Flow

```
OAuth/Email Signup → User created (no org) →
Redirect to /setup/organization →
Create org + update user →
Redirect to /agency/[slug]/admin
```

---

## Phase 4: Update Login Flow for Existing Users

**Goal**: Ensure smooth login for existing users

### Changes

1. **Login Page** (`app/(auth)/login/page.tsx`)

   - Add "Don't have an account? Sign up" link
   - Keep existing OAuth + Email OTP options
   - No changes to authentication logic

2. **Smart Redirects** (already implemented)
   - Platform admins → `/platform/admin`
   - Agency owners → `/agency/[slug]/admin`
   - End users → `/agency/[slug]/learning`

### Testing

- [ ] Existing users can login normally
- [ ] Proper role-based redirects work
- [ ] No impact on current users

---

## Phase 5: Handle Edge Cases

**Goal**: Robust error handling and UX

### Scenarios to Handle

1. **User signs up with email already in system**

   - Better Auth handles this
   - Show "Email already registered, please login"

2. **OAuth account already exists**

   - Better Auth links accounts automatically
   - Check organization on callback

3. **Trial expiration**

   - Check in middleware
   - Redirect to billing page

4. **Organization slug conflicts**
   - Generate from agency name
   - Add random suffix if needed
   - Allow editing later

### Error States

- Organization creation failure
- Database transaction rollback
- Clear error messages
- Recovery paths

---

## Phase 6: Testing & Validation

**Goal**: Ensure everything works end-to-end

### Test Scenarios

1. **New Agency Signup**

   - [ ] Can create account via GitHub
   - [ ] Can create account via Email OTP
   - [ ] Organization created correctly
   - [ ] User has AGENCY_OWNER role
   - [ ] Trial activated (30 days)
   - [ ] Redirected to agency dashboard

2. **Existing User Login**

   - [ ] Can login via GitHub
   - [ ] Can login via Email OTP
   - [ ] Redirected to correct dashboard
   - [ ] Organization data accessible

3. **Edge Cases**
   - [ ] Duplicate email handling
   - [ ] OAuth account linking
   - [ ] Missing organization handling

---

## Implementation Order

### Quick Win Path (Recommended)

1. **Phase 3 first** - Add post-auth organization setup (fixes immediate issue)
2. **Phase 1** - Fix entry points (better UX)
3. **Phase 4** - Ensure login works (maintain existing functionality)
4. **Phase 5** - Handle edge cases (robustness)
5. **Phase 6** - Test everything (validation)

### Why This Order?

- Gets us unstuck immediately (Phase 3)
- Minimal changes to existing auth flow
- Can test with real users quickly
- Progressive enhancement approach

---

## Success Criteria

- [ ] New users can sign up and get organization
- [ ] Existing users can login normally
- [ ] All users have required organizationId
- [ ] Proper roles assigned (AGENCY_OWNER for new)
- [ ] Trial activation works
- [ ] Clear UX distinction between signup/login
- [ ] No breaking changes to current system

---

## Rollback Plan

If issues arise:

1. Revert to previous branch
2. Users can still use manual seed scripts
3. Document issues for next iteration
4. No data loss (additions only)

---

## Next Steps After This Phase

Once signup/login is fixed:

1. Return to `feat/production-cleanup` branch
2. Test B2B subscription model changes
3. Create courses without Stripe prices
4. Implement subscription-based access control
