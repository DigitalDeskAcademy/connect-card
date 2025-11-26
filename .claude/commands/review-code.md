---
description: Launch code-reviewer agent to analyze code quality and security
---

# Code Review

Launch the code-reviewer agent to analyze recent changes for quality, security, and pattern compliance.

## Your Tasks:

### 1. Identify Changes to Review

Run git status to see what files have changed:

```bash
git status
git diff --name-only
```

### 2. Launch Code Reviewer Agent

Use the Task tool with subagent_type="code-reviewer" to review the changes:

**Prompt for code-reviewer:**

```
Review the following files for:

1. Code Quality
   - Following project patterns from coding-patterns.md
   - No duplicate code
   - Clear variable names
   - Proper error handling

2. Security Issues
   - Rate limiting on server actions
   - Authentication checks
   - Multi-tenant data isolation (organizationId)
   - No exposed secrets or API keys
   - Input validation with Zod
   - SQL injection prevention

3. Pattern Compliance
   - Server actions return ApiResponse
   - PageContainer usage with correct variant
   - No duplicate headers (SiteHeader handles titles)
   - Navigation config updated in /lib/navigation.ts
   - Shadcn components used (not custom UI)
   - Multi-tenant fingerprinting in rate limits

4. Performance
   - No unnecessary client components
   - Proper use of Server Components
   - Efficient database queries
   - No N+1 query problems

5. TypeScript
   - No 'any' types
   - Proper type safety
   - No TypeScript errors

Files to review:
<list changed files here>

Provide specific feedback with file:line references and actionable recommendations.
```

### 3. Present Review Results

After code-reviewer completes:

**Categorize findings:**

- 🚨 **Critical Issues** (security, data leakage, auth bypass)
- ⚠️ **Warnings** (pattern violations, performance issues)
- 💡 **Suggestions** (improvements, optimizations)

**For each issue, provide:**

- File and line number
- Description of problem
- Recommended fix
- Code example if applicable

### 4. Create Fix Plan

If critical issues found:

1. List all issues that MUST be fixed before commit
2. Provide step-by-step fix instructions
3. Offer to implement fixes automatically

Ask user: "Should I fix these issues now, or would you like to review first?"

### 5. Run Again After Fixes

After applying fixes, run review again to verify all issues resolved.

## When to Use This Command:

✅ **Before committing code** - Catch issues before they enter git history
✅ **After major refactoring** - Verify patterns still followed
✅ **Before creating PR** - Ensure code meets quality standards
✅ **When adding security-sensitive code** - Double-check auth and validation
✅ **When uncertain about patterns** - Get expert validation

## What Gets Checked:

### Security (Critical)

- [ ] Rate limiting on all server actions
- [ ] Authentication checks (requireUser/requireAdmin)
- [ ] Multi-tenant data isolation (organizationId filters)
- [ ] Input validation with Zod schemas
- [ ] No secrets in code or commits
- [ ] Generic error messages (no info disclosure)

### Patterns (Important)

- [ ] Server actions use ApiResponse type
- [ ] PageContainer with correct variant
- [ ] No duplicate headers in pages
- [ ] Navigation config updated
- [ ] Shadcn components used
- [ ] Server Components by default

### Code Quality

- [ ] No duplicate code
- [ ] Clear naming conventions
- [ ] Proper error handling
- [ ] TypeScript strict mode compliance
- [ ] No console.log/error statements

### Performance

- [ ] Efficient database queries
- [ ] No N+1 problems
- [ ] Proper use of Server vs Client Components
- [ ] Minimal client bundle size

## Important Notes:

- This is a **non-blocking review** - Use for guidance, not gatekeeping
- Focus on **security and pattern compliance** first
- Suggestions are **recommendations**, not requirements
- Use **professional judgment** when applying feedback
- **Document deviations** from patterns in ADRs if intentional

## Example Output:

```
Code Review Results
===================

🚨 CRITICAL ISSUES (Must Fix)
1. Missing rate limiting in createChurchMember action
   File: actions/church/members/actions.ts:15
   Fix: Add arcjet rate limiting before business logic

2. Missing organizationId filter in query
   File: app/church/[slug]/admin/members/page.tsx:23
   Fix: Add where: { organizationId: organization.id }

⚠️ WARNINGS (Should Fix)
1. Using wrong PageContainer variant
   File: app/church/[slug]/admin/events/page.tsx:12
   Current: variant="fill"
   Recommended: variant="default" (standard page with cards)

2. Duplicate navigation title
   File: app/church/[slug]/admin/volunteers/page.tsx:8
   Issue: Page has <h1>, but SiteHeader already shows title
   Fix: Remove <h1> tag from page content

💡 SUGGESTIONS (Consider)
1. Could use shadcn Empty component
   File: components/dashboard/events/events-list.tsx:45
   Current: Plain text "No events found"
   Better: Use <Empty> component for consistency

2. Consider extracting shared logic
   File: actions/church/members/actions.ts:78
   Duplicate validation logic in createMember and updateMember
   Consider: Extract to shared validator function
```
