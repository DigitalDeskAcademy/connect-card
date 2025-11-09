# E2E Test Suite - Church Connect Card MVP

Comprehensive end-to-end testing suite designed to find bugs, security vulnerabilities, and edge cases in the MVP features.

## Test Coverage

### 🔒 Security Tests (`01-security-multi-tenant.spec.ts`)

**Critical multi-tenant isolation tests - ALL should FAIL to breach security:**

1. **URL Manipulation** - Cannot access other church's admin by changing slug
2. **API Endpoint Isolation** - Cannot fetch other org's data via API
3. **Session Token Reuse** - Cannot reuse session across organizations
4. **Invitation Cross-Org** - Cannot invite users to different organizations
5. **File Upload Scoping** - Files are scoped to correct organization
6. **Permission Escalation** - Staff cannot escalate to platform admin
7. **Organization Enumeration** - Cannot list all organizations
8. **Database Query Filtering** - All queries include organizationId filter

**Attack Vectors Tested:**

- Direct URL manipulation
- Cookie/session hijacking
- API request injection
- Cross-org resource access
- Permission bypass attempts

### 📋 Connect Card Tests (`02-connect-cards.spec.ts`)

**Full workflow + edge cases:**

1. **Happy Path** - Upload → Extract → Review → Save workflow
2. **Invalid File Types** - Rejects non-image files
3. **Oversized Files** - Enforces file size limits
4. **Corrupted Images** - Handles invalid image data gracefully
5. **XSS Prevention** - Sanitizes AI-extracted data (script tags, HTML injection)
6. **SQL Injection** - Search fields escape special characters
7. **Concurrent Uploads** - Multiple simultaneous uploads work correctly
8. **Duplicate Detection** - Identifies duplicate image uploads
9. **Batch Workflow** - Batch creation, navigation, and management
10. **Empty Batch** - Cannot process empty batches
11. **Field Validation** - Review queue validates email/phone formats
12. **Large Batch Performance** - Tests with 10+ cards (< 2 min target)

**Edge Cases:**

- AI extraction errors
- Network failures during upload
- Validation failures
- Rate limiting
- Concurrent operations

### 👥 Team Management Tests (`03-team-management.spec.ts`)

**Invitation workflow + permission enforcement:**

1. **Invitation Flow** - Send, receive, accept invitations
2. **Duplicate Invitations** - Prevents duplicate pending invitations
3. **Email Validation** - Rejects invalid email formats
4. **Last Owner Protection** - Cannot remove last Account Owner
5. **Permission Checks** - Staff cannot access team management
6. **Cross-Org Invites** - Cannot invite to different organization
7. **Multi-Campus Access** - Location-based permission enforcement
8. **Resend Cooldown** - 24-hour cooldown on resending invitations
9. **Role Changes** - Validates role change permissions
10. **Rate Limiting** - Arcjet enforces 5 invites/minute limit

**Permission Matrix Tested:**

- Account Owner → Full access
- Admin → Manage team (not delete owner)
- Staff → No team access

### 📚 LMS/Training Tests (`04-lms-training.spec.ts`)

**Course management + enrollment:**

1. **Course Creation** - Create and publish courses
2. **Duplicate Slugs** - Handles duplicate course names
3. **Cross-Org Access** - Cannot access other org's courses
4. **Delete with Enrollments** - Warns before deleting courses with students
5. **Drag-Drop Ordering** - Chapter/lesson reordering works
6. **Enrollment Flow** - Enroll → Start → Complete lessons
7. **Unenrolled Access** - Cannot access lessons without enrollment
8. **Concurrent Enrollment** - Multiple users can enroll simultaneously
9. **Video Playback** - Videos load and play correctly
10. **Staff Permissions** - Staff cannot delete courses

## Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Ensure test database is seeded
pnpm seed
```

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Suites

```bash
# Security tests only (CRITICAL before production)
pnpm test:security

# Connect card functionality
pnpm test:connect-cards

# Team management
pnpm test:team

# LMS/Training
pnpm test:lms
```

### Debug Tests

```bash
# Run with UI (visual test runner)
pnpm test:ui

# Run in headed mode (see browser)
pnpm test:headed

# Debug specific test
pnpm test:debug
```

## Test Environment

- **Base URL**: `http://localhost:3000`
- **Test Users**: Defined in `tests/helpers/auth.ts`
  - Platform Admin: `platform@test.com`
  - Church Owner: `test@playwright.dev` (newlife)
  - Church Admin: `admin@newlife.test`
  - Church Staff: `staff@newlife.test`

**Authentication**: Uses Email OTP flow with console-captured codes (dev mode only)

## Expected Findings

### Security (Should ALL Pass)

- ✅ **Multi-tenant isolation enforced**
- ✅ **No cross-organization data leaks**
- ✅ **XSS prevention working**
- ✅ **SQL injection prevention working**
- ✅ **Rate limiting active**
- ✅ **Permission checks enforced**

### Potential Issues to Watch For

1. **Race Conditions**

   - Concurrent uploads causing duplicate records
   - Batch count mismatches
   - Session conflicts

2. **Validation Gaps**

   - Missing phone number validation
   - Email format edge cases
   - File size limits not enforced

3. **Error Handling**

   - AI extraction failures not gracefully handled
   - S3 upload failures causing data loss
   - Network timeout issues

4. **Permission Bugs**

   - Staff accessing restricted pages
   - Admin deleting protected resources
   - Cross-org permission leaks

5. **Performance**
   - Large batch uploads timing out
   - Memory leaks on repeated operations
   - Slow database queries

## Test Data

- **Test Images**: `public/connect-card-examples/`

  - Connect-Card-Test-01.png (Tanner Brandt, First Visit)
  - Connect-Card-Test-02.png (Leanna Upchurch, Second Visit)
  - Connect-Card-Test-03.png (Leanna Upchurch, Member)

- **Seeded Data**: Run `pnpm seed` to populate test organizations and users

## Continuous Integration

For CI/CD pipelines:

```bash
# Set CI env variable for proper retries
CI=true pnpm test

# Generate HTML report
pnpm test --reporter=html

# Generate JSON report for analysis
pnpm test --reporter=json
```

## Debugging Failed Tests

1. **Check Screenshots**: `test-results/` folder contains failure screenshots
2. **View Traces**: `playwright-report/` contains detailed execution traces
3. **Console Logs**: Tests capture console output for debugging
4. **Video Recordings**: Failed tests include video recordings

## Contributing New Tests

When adding new tests:

1. **Follow Naming Convention**: `NN-feature-name.spec.ts`
2. **Document Attack Vectors**: Comment what each test is trying to break
3. **Use Test Data Factories**: Don't hardcode test data
4. **Clean Up**: Reset state between tests
5. **Be Specific**: Test one thing per test case
6. **Expect Failures**: Security tests should document expected denials

## Security Test Failures = CRITICAL

**If any security test fails, DO NOT deploy to production.**

These tests are designed to attempt to breach security. If they succeed:

1. File a security issue immediately
2. Mark as CRITICAL priority
3. Fix before any production deployment
4. Add regression test for the specific vulnerability

## Performance Benchmarks

- **Single Card Upload**: < 10 seconds
- **10 Card Batch**: < 2 minutes
- **Page Load**: < 3 seconds
- **AI Extraction**: < 8 seconds per card

## Known Limitations

1. **Email OTP**: Tests only work in dev mode (console logging)
2. **File Uploads**: Limited to test images in repo
3. **External APIs**: No mocking of Anthropic/S3 (tests hit real APIs in dev)
4. **Database**: Tests run against dev database (not isolated)

## Future Test Coverage

- [ ] Mobile responsive testing
- [ ] Cross-browser testing (Firefox, Safari)
- [ ] Load testing (100+ concurrent users)
- [ ] API endpoint testing (without UI)
- [ ] Accessibility testing (WCAG compliance)
- [ ] Integration tests (unit-level)
- [ ] Performance regression tests
