---
description: Comprehensive security audit against OWASP Top 10 and project standards
model: claude-sonnet-4-5-20250929
---

# Check Security

Deep security audit covering authentication, authorization, input validation, secrets, and OWASP Top 10 vulnerabilities.

## Your Tasks:

### Phase 1: Scope Definition

**Step 1: Determine Scope**

Ask user: **"Security audit scope? (all/recent/critical)"**

- **all** - Full codebase security audit
- **recent** - Only changed files since main
- **critical** - Only critical security areas (auth, server actions, db)

```bash
# If recent
git diff main...HEAD --name-only
```

---

### Phase 2: Authentication & Authorization

**Step 2: Check Authentication Implementation**

**Verify Better Auth setup:**

```bash
# Check auth configuration
cat lib/auth.ts
cat lib/auth-client.ts
```

Verify:

- [ ] Better Auth properly configured
- [ ] Session management secure
- [ ] OAuth providers configured correctly
- [ ] Email OTP enabled
- [ ] No hardcoded credentials

**Step 3: Check Route Protection**

Find all protected routes:

```bash
# Church admin routes
find app/church -name "page.tsx" -type f

# Platform admin routes
find app/platform -name "page.tsx" -type f
```

For each route, verify authentication:

```bash
grep -A 10 "export default async function" <file> | grep -E "requireUser|requireAdmin|requireDashboardAccess"
```

**Violations:**

```typescript
// ❌ VIOLATION: No auth check
export default async function AdminPage() {
  // Anyone can access this!
  const data = await prisma.churchMember.findMany();
  return <div>{data}</div>;
}

// ✅ CORRECT: Auth required
export default async function AdminPage() {
  await requireAdmin(); // Throws if not authenticated
  const data = await prisma.churchMember.findMany();
  return <div>{data}</div>;
}
```

**Step 4: Check Authorization (Role-Based Access)**

Verify role checks:

```bash
# Find all role checks
grep -r "role ===" app/ actions/ --include="*.ts" --include="*.tsx"
```

Check for:

- [ ] Platform admin checks use `requireAdmin()`
- [ ] Church admin checks use `requireDashboardAccess()`
- [ ] Never manual role checks (use helpers)

**Step 5: Generate Auth Report**

```markdown
# Authentication & Authorization

Protected Routes Found: X
✅ Properly Protected: X
❌ Missing Auth: X

CRITICAL Issues:

1. File: app/church/[slug]/admin/members/page.tsx
   Issue: No authentication check
   Risk: CRITICAL - Unauthenticated access to member data
   Fix: Add await requireDashboardAccess(slug) at start

2. File: app/platform/admin/analytics/page.tsx
   Issue: No admin check
   Risk: CRITICAL - Non-admins can access platform data
   Fix: Add await requireAdmin() at start
```

---

### Phase 3: Input Validation & Injection Prevention

**Step 6: Find All Input Points**

```bash
# Server actions (form inputs)
find actions -name "*.ts" -type f

# API routes
find app/api -name "route.ts" -type f 2>/dev/null

# Search params in pages
grep -r "searchParams" app/ --include="*.tsx"
```

**Step 7: Check Zod Validation**

For each server action:

```bash
grep -A 20 "export async function" <file> | grep "safeParse"
```

Verify:

- [ ] Has Zod schema import
- [ ] Uses `.safeParse()` not `.parse()`
- [ ] Checks `validation.success`
- [ ] Returns error if validation fails
- [ ] NEVER trusts raw input

**Violations:**

```typescript
// ❌ VIOLATION: No validation
export async function createMember(data: any) {
  await prisma.churchMember.create({ data }); // SQL injection risk!
}

// ❌ VIOLATION: Using .parse() (throws error, not handled)
export async function createMember(data: unknown) {
  const validated = MemberSchema.parse(data); // Can crash
}

// ✅ CORRECT: Safe validation
export async function createMember(
  data: MemberSchemaType
): Promise<ApiResponse> {
  const validation = MemberSchema.safeParse(data);
  if (!validation.success) {
    return { status: "error", message: "Invalid input" };
  }
  await prisma.churchMember.create({ data: validation.data });
}
```

**Step 8: Check for SQL Injection**

Prisma prevents SQL injection, but check for:

```bash
# Raw SQL queries (dangerous)
grep -r "prisma.\$executeRaw" app/ actions/ lib/
grep -r "prisma.\$queryRaw" app/ actions/ lib/

# String concatenation in queries (dangerous)
grep -r "prisma.*\`.*\${" app/ actions/ lib/
```

If found, verify using `Prisma.sql` tagged template.

**Step 9: Check for XSS Vulnerabilities**

```bash
# dangerouslySetInnerHTML (potential XSS)
grep -r "dangerouslySetInnerHTML" app/ components/ --include="*.tsx"

# Direct HTML insertion
grep -r "\.innerHTML" app/ components/ --include="*.tsx" --include="*.ts"
```

If found, verify input is sanitized.

**Step 10: Check for Command Injection**

```bash
# exec/spawn (dangerous)
grep -r "exec\(" app/ actions/ lib/ --include="*.ts"
grep -r "spawn\(" app/ actions/ lib/ --include="*.ts"

# eval (extremely dangerous)
grep -r "eval\(" app/ actions/ lib/ --include="*.ts"
```

Should have ZERO instances in production code.

**Step 11: Generate Injection Report**

```markdown
# Input Validation & Injection Prevention

Server Actions: X
✅ Properly Validated: X
❌ Missing Validation: X

SQL Injection Risks: X
XSS Vulnerabilities: X
Command Injection: X

CRITICAL Issues:

1. File: actions/church/members/actions.ts:23
   Issue: No Zod validation
   Risk: HIGH - SQL injection via unvalidated input
   Fix: Add schema validation with safeParse()

2. File: components/dashboard/notes.tsx:45
   Issue: dangerouslySetInnerHTML without sanitization
   Risk: HIGH - XSS vulnerability
   Fix: Remove dangerouslySetInnerHTML or sanitize with DOMPurify
```

---

### Phase 4: Rate Limiting & DoS Protection

**Step 12: Check Rate Limiting on Server Actions**

```bash
# Find all server actions
find actions -name "*.ts" -type f

# Check for arcjet import
grep -l "from '@/lib/arcjet'" actions/**/*.ts

# Check for rate limiting
grep -l "fixedWindow" actions/**/*.ts
```

For each server action, verify:

- [ ] Imports arcjet
- [ ] Configures fixedWindow rate limit
- [ ] Calls `aj.protect()` before business logic
- [ ] Returns error if rate limited

**Violations:**

```typescript
// ❌ VIOLATION: No rate limiting
export async function createMember(
  data: MemberSchemaType
): Promise<ApiResponse> {
  const session = await requireUser();
  // No rate limiting - vulnerable to abuse!
  await prisma.churchMember.create({ data });
}

// ✅ CORRECT: Rate limiting present
const aj = arcjet.withRule(fixedWindow({ mode: "LIVE", window: "1m", max: 5 }));

export async function createMember(
  data: MemberSchemaType
): Promise<ApiResponse> {
  const session = await requireUser();

  const req = await request();
  const decision = await aj.protect(req, { fingerprint: session.user.id });

  if (decision.isDenied()) {
    return { status: "error", message: "Rate limited" };
  }

  await prisma.churchMember.create({ data });
}
```

**Step 13: Check API Route Rate Limiting**

```bash
find app/api -name "route.ts" -type f 2>/dev/null
```

Verify each API route has rate limiting.

**Step 14: Generate Rate Limiting Report**

```markdown
# Rate Limiting & DoS Protection

Server Actions: X
✅ Rate Limited: X
❌ Missing Rate Limiting: X

API Routes: X
✅ Rate Limited: X
❌ Missing Rate Limiting: X

CRITICAL Issues:

1. File: actions/church/members/actions.ts
   Function: createChurchMember
   Issue: No rate limiting
   Risk: HIGH - Vulnerable to abuse/DoS
   Fix: Add arcjet fixedWindow rate limiting

2. File: actions/church/connectcards/actions.ts
   Function: processConnectCard
   Issue: No rate limiting on expensive AI operation
   Risk: CRITICAL - API cost abuse possible
   Fix: Add strict rate limiting (2 req/min)
```

---

### Phase 5: Secret & Credential Management

**Step 15: Check for Hardcoded Secrets**

```bash
# API keys
grep -ri "api_key\s*=\s*['\"]" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# Passwords
grep -ri "password\s*=\s*['\"]" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# Tokens
grep -ri "token\s*=\s*['\"]" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# Connection strings
grep -ri "postgresql://" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# AWS keys
grep -ri "AKIA[0-9A-Z]{16}" --include="*.ts" --include="*.tsx" app/ actions/ lib/
```

Should find ZERO hardcoded secrets.

**Step 16: Verify Environment Variable Usage**

```bash
# Check env.ts configuration
cat lib/env.ts

# Find all environment variable access
grep -r "process.env" app/ actions/ lib/ --include="*.ts" --include="*.tsx"
```

Verify:

- [ ] All env vars go through `lib/env.ts` validation
- [ ] No direct `process.env.XXX` access
- [ ] Zod validation for all env vars
- [ ] No env vars exposed to client (unless PUBLIC\_)

**Step 17: Check for Secrets in Git History**

```bash
# Check current files
git ls-files | xargs grep -i "api_key\|password\|secret\|token" | grep -v node_modules

# Check git history (last 50 commits)
git log -p -50 | grep -i "api_key\|password\|secret\|token"
```

**Step 18: Check .env Files**

```bash
# Verify .env not committed
git ls-files | grep "^\.env$"

# Check .gitignore includes .env
grep "^\.env" .gitignore
```

**Step 19: Generate Secrets Report**

```markdown
# Secret & Credential Management

Hardcoded Secrets Found: X
✅ Using env.ts: Yes/No
✅ .env in .gitignore: Yes/No
❌ Secrets in git history: X

CRITICAL Issues:

1. File: lib/integrations/ghl.ts:12
   Issue: Hardcoded API key
   Code: const API_KEY = "sk_test_12345..."
   Risk: CRITICAL - API key exposed in source code
   Fix: Move to environment variable

2. File: .env
   Issue: .env file committed to git
   Risk: CRITICAL - All secrets exposed in repository
   Fix: Remove from git, add to .gitignore
```

---

### Phase 6: OWASP Top 10 Check

**Step 20: A01 - Broken Access Control**

Already checked in Phase 2 (Authentication & Authorization).

Summary:

- [ ] All routes require authentication
- [ ] Role-based access enforced
- [ ] Multi-tenant isolation (checked by /check-multi-tenant)

**Step 21: A02 - Cryptographic Failures**

Check:

```bash
# Find password hashing
grep -r "bcrypt\|argon2\|scrypt" lib/ --include="*.ts"

# Check for weak crypto
grep -r "MD5\|SHA1" lib/ --include="*.ts"

# Check HTTPS enforcement
grep -r "secure:\s*true" lib/ --include="*.ts"
```

Verify:

- [ ] Passwords hashed (Better Auth handles)
- [ ] No weak crypto algorithms
- [ ] Cookies are secure
- [ ] HTTPS enforced in production

**Step 22: A03 - Injection**

Already checked in Phase 3 (Input Validation).

Summary:

- [ ] Zod validation on all inputs
- [ ] No raw SQL queries
- [ ] No command injection
- [ ] No XSS vulnerabilities

**Step 23: A04 - Insecure Design**

Review architectural patterns:

- [ ] Multi-tenant isolation by design
- [ ] Rate limiting by design
- [ ] Input validation by design
- [ ] Secure defaults everywhere

**Step 24: A05 - Security Misconfiguration**

Check:

```bash
# Security headers
grep -r "helmet\|security-headers" --include="*.ts" lib/ app/

# CORS configuration
grep -r "cors" --include="*.ts" lib/ app/

# Debug mode in production
grep -r "NODE_ENV.*development" --include="*.ts" lib/ app/
```

Verify:

- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] No debug mode in production
- [ ] Error messages don't expose internals

**Step 25: A06 - Vulnerable Components**

```bash
# Check for known vulnerabilities
pnpm audit

# Check outdated packages
pnpm outdated
```

Report any HIGH or CRITICAL vulnerabilities.

**Step 26: A07 - Authentication Failures**

Already checked in Phase 2.

Additional checks:

- [ ] No default credentials
- [ ] Session timeout configured
- [ ] No credential stuffing protection needed (OAuth + OTP)

**Step 27: A08 - Software and Data Integrity Failures**

Check:

```bash
# Verify package-lock integrity
ls package-lock.json pnpm-lock.yaml

# Check for unsigned packages
pnpm audit signatures 2>/dev/null || echo "Feature not available"
```

**Step 28: A09 - Security Logging Failures**

```bash
# Check for audit logging
grep -r "audit\|log" lib/ --include="*.ts"
```

Verify:

- [ ] Authentication events logged
- [ ] Authorization failures logged
- [ ] Security-sensitive operations logged
- [ ] No sensitive data in logs

**Step 29: A10 - Server-Side Request Forgery (SSRF)**

```bash
# Find external HTTP requests
grep -r "fetch\|axios\|http.get" actions/ lib/ --include="*.ts"
```

For each external request, verify:

- [ ] URL is validated/whitelisted
- [ ] Not using user input directly
- [ ] Timeout configured
- [ ] Error handling present

**Step 30: Generate OWASP Report**

```markdown
# OWASP Top 10 Security Check

A01 - Broken Access Control: ✅/❌
A02 - Cryptographic Failures: ✅/❌
A03 - Injection: ✅/❌
A04 - Insecure Design: ✅/❌
A05 - Security Misconfiguration: ✅/❌
A06 - Vulnerable Components: ✅/❌
A07 - Authentication Failures: ✅/❌
A08 - Data Integrity Failures: ✅/❌
A09 - Security Logging Failures: ✅/❌
A10 - Server-Side Request Forgery: ✅/❌

Overall Security Score: X/10 passed

Details: <link to detailed findings above>
```

---

### Phase 7: Additional Security Checks

**Step 31: Check for Information Disclosure**

```bash
# Detailed error messages
grep -r "console.log\|console.error" actions/ --include="*.ts"

# Stack traces in responses
grep -r "error.stack" actions/ --include="*.ts"

# Database schema in responses
grep -r "Prisma" app/ --include="*.tsx"
```

Verify:

- [ ] Generic error messages to users
- [ ] No stack traces exposed
- [ ] No database errors shown to users
- [ ] No sensitive data in logs

**Step 32: Check CSRF Protection**

```bash
# Check for CSRF tokens
grep -r "csrf" lib/ --include="*.ts"
```

Note: Next.js server actions have built-in CSRF protection.

**Step 33: Check File Upload Security**

```bash
# Find file upload endpoints
grep -r "upload\|file" actions/ --include="*.ts"
```

If file uploads exist, verify:

- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (if applicable)
- [ ] Secure storage (S3)
- [ ] No executable uploads

**Step 34: Check for Race Conditions**

```bash
# Find concurrent operations
grep -r "Promise.all\|Promise.race" actions/ --include="*.ts"
```

Verify proper locking/transactions for:

- [ ] Payment processing
- [ ] Inventory updates
- [ ] Concurrent member updates

---

### Phase 8: Generate Final Security Report

**Step 35: Consolidate All Findings**

```markdown
# Comprehensive Security Audit Report

Generated: <timestamp>
Scope: <all/recent/critical>
Files Audited: X

## Executive Summary

Overall Security Posture: <CRITICAL/HIGH/MEDIUM/LOW RISK>

Critical Issues: X (must fix immediately)
High Priority: X (fix within 1 week)
Medium Priority: X (fix within 1 month)
Low Priority: X (fix when convenient)

## Findings by Category

### Authentication & Authorization

<report from Phase 2>

### Input Validation & Injection Prevention

<report from Phase 3>

### Rate Limiting & DoS Protection

<report from Phase 4>

### Secret & Credential Management

<report from Phase 5>

### OWASP Top 10

<report from Phase 6>

### Additional Security Checks

<report from Phase 7>

## Critical Issues (Fix Immediately)

1. **Unauthenticated Access to Member Data**

   - File: app/church/[slug]/admin/members/page.tsx
   - Risk: CRITICAL
   - Impact: Data breach, GDPR violation
   - Fix: Add await requireDashboardAccess(slug)
   - Effort: 5 minutes

2. **Hardcoded API Key**

   - File: lib/integrations/ghl.ts:12
   - Risk: CRITICAL
   - Impact: API abuse, financial loss
   - Fix: Move to environment variable
   - Effort: 10 minutes

3. **No Rate Limiting on AI Endpoint**
   - File: actions/church/connectcards/actions.ts
   - Risk: CRITICAL
   - Impact: API cost abuse ($$$)
   - Fix: Add strict rate limiting
   - Effort: 15 minutes

## High Priority Issues

<list high priority issues with fixes>

## Medium Priority Issues

<list medium priority issues>

## Low Priority Issues

<list low priority issues>

## Recommendations

1. **Immediate Actions**

   - Fix all CRITICAL issues today
   - Review HIGH priority issues with team
   - Plan medium priority fixes for next sprint

2. **Process Improvements**

   - Add /check-security to pre-commit workflow
   - Security review for all PRs
   - Quarterly security audits
   - Security training for team

3. **Monitoring**

   - Enable security logging
   - Set up alerts for auth failures
   - Monitor rate limiting events
   - Track API usage/costs

4. **Compliance**
   - GDPR compliance review
   - Data retention policy
   - Privacy policy update
   - Terms of service review

## Security Score

Current: X/100
Target: 95/100

Areas for Improvement:

- <area 1>
- <area 2>
- <area 3>

## Next Steps

1. Fix all CRITICAL issues immediately
2. Run /check-security again to verify
3. Schedule security review meeting
4. Update security documentation
5. Plan remediation for HIGH/MEDIUM issues
```

**Step 36: Ask About Fixes**

Ask user: **"Found X critical security issues. Would you like me to help fix them? (yes/no)"**

If yes, prioritize CRITICAL issues and offer to fix each one.

---

## When to Use:

✅ **Before production deployment**
✅ **After adding authentication/authorization**
✅ **After adding new endpoints**
✅ **Monthly security audits**
✅ **After security incident**
✅ **Before security compliance audit**
✅ **When handling sensitive data**

---

## Integration:

**Can be called by:**

- `/feature-wrap-up` (optional security gate)

**Works with:**

- `/check-patterns` - Pattern compliance
- `/check-multi-tenant` - Tenant isolation audit
- `/review-code` - General code review

**Critical for:**

- Production deployments
- Compliance requirements
- Security-sensitive features
- Financial transactions
- PII/PHI handling
