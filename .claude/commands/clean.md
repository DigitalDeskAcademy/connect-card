---
description: Clean unused code, imports, files, and dependencies
model: claude-opus-4-5-20251101
---

# Clean

Comprehensive codebase cleanup: remove unused imports, dead code, obsolete files, and unnecessary dependencies.

## Your Tasks:

### Phase 1: Unused Imports

**Step 1: Find Unused Imports**

```bash
# Run ESLint to find unused imports
pnpm lint | grep "is defined but never used"

# Or use TypeScript compiler
pnpm tsc --noEmit 2>&1 | grep "is declared but its value is never read"
```

**Step 2: Categorize Unused Imports**

Group by severity:

- **Safe to remove:** Never used
- **Type-only:** Can convert to `import type`
- **Side-effect:** Keep even if "unused" (e.g., CSS imports)

**Step 3: Generate Unused Import Report**

```markdown
# Unused Imports Analysis

Total Unused Imports: X

Safe to Remove: X files

- app/church/[slug]/admin/members/page.tsx:3
  import { Button } from "@/components/ui/button" (never used)

- actions/church/members/actions.ts:5
  import { revalidatePath } from "next/cache" (never used)

Can Convert to Type Import: X files

- lib/types.ts:2
  import { Prisma } from "@prisma/client"
  → import type { Prisma } from "@prisma/client"

Keep (Side Effects): X files

- app/layout.tsx:1
  import "./globals.css" (keep - needed for styles)
```

**Step 4: Remove Unused Imports**

Ask user: **"Remove X unused imports automatically? (yes/no/review)"**

If yes, automatically remove safe imports.
If review, show each import and ask confirmation.

---

### Phase 2: Dead Code Detection

**Step 5: Find Unused Functions**

```bash
# Find all exported functions
grep -r "export function\|export const.*=.*function" app/ actions/ lib/ --include="*.ts" --include="*.tsx" | cut -d: -f1-2

# For each function, search for usage
# (this is a heuristic - may need manual verification)
```

**Step 6: Find Unused Components**

```bash
# Find all component files
find components -name "*.tsx" -type f

# For each component, check if imported anywhere
for file in components/**/*.tsx; do
  component=$(basename "$file" .tsx)
  count=$(grep -r "import.*$component" app/ components/ --include="*.tsx" | wc -l)
  if [ "$count" -eq "0" ]; then
    echo "Unused: $file"
  fi
done
```

**Step 7: Find Commented-Out Code**

```bash
# Find commented code blocks
grep -r "// .*\(function\|const\|export\)" app/ actions/ lib/ --include="*.ts" --include="*.tsx"

# Find multi-line comments
grep -r "/\*.*\*/" app/ actions/ lib/ --include="*.ts" --include="*.tsx"
```

**Step 8: Generate Dead Code Report**

```markdown
# Dead Code Analysis

Unused Functions: X

- lib/utils/oldHelper.ts:45
  export function formatOldDate() - No references found

- actions/church/deprecated.ts:12
  export async function oldAction() - Replaced by new action

Unused Components: X

- components/old/LegacyCard.tsx
  No imports found (replaced by new Card component)

- components/temp/TestComponent.tsx
  Created for testing, never used in app

Commented-Out Code: X files

- app/church/[slug]/admin/members/page.tsx:67
  Large commented block (15 lines) - remove or uncomment

- actions/church/members/actions.ts:89
  Old implementation commented - safe to remove
```

**Step 9: Ask About Removal**

Ask user: **"Remove dead code? (yes/no/review)"**

For each item:

1. Show the code
2. Explain why it's considered unused
3. Ask for confirmation
4. Remove if approved

---

### Phase 3: Obsolete Files

**Step 10: Find Old/Obsolete Files**

Check for common obsolete patterns:

```bash
# Files from old architecture
find app -path "*agency*" -type f 2>/dev/null
find app -path "*@header*" -type f 2>/dev/null

# Test/temp files in production code
find app -name "*test*.tsx" -type f
find app -name "*temp*.tsx" -type f
find app -name "*.bak" -type f

# Old migration files
find prisma -name "*.old" -type f

# Backup files
find . -name "*~" -type f
find . -name "*.backup" -type f
```

**Step 11: Check Last Modified Date**

```bash
# Files not modified in 6+ months
find app components lib -type f -mtime +180 -name "*.ts" -o -name "*.tsx"
```

For each old file, determine:

- Is it still imported?
- Is it still relevant?
- Has it been replaced?

**Step 12: Generate Obsolete Files Report**

```markdown
# Obsolete Files Analysis

Old Architecture Files: X

- app/agency/old-route/page.tsx
  From pre-fork architecture (should be removed)

- app/@header/layout.tsx
  Named Slots pattern (deprecated Oct 2025)

Test Files in Production: X

- app/test/debug-page.tsx
  Test page (move to development only or remove)

Backup Files: X

- lib/utils.backup.ts
  Backup from refactoring (safe to remove)

Old/Stale Files (6+ months): X

- components/old/deprecated-card.tsx
  Last modified: 8 months ago
  No recent imports
  Candidate for removal
```

**Step 13: Move to Archive**

Instead of deleting, offer to archive:

Ask user: **"Archive X obsolete files to .archive/? (yes/no/delete)"**

- **yes**: Move to `.archive/` directory with date stamp
- **no**: Keep files
- **delete**: Permanently delete (requires confirmation)

```bash
# Archive pattern
mkdir -p .archive/$(date +%Y-%m-%d)
mv <obsolete-file> .archive/$(date +%Y-%m-%d)/
```

---

### Phase 4: Unused Dependencies

**Step 14: Check Package Dependencies**

```bash
# Find declared dependencies
cat package.json | jq '.dependencies'

# Check for unused packages
pnpm exec depcheck

# Or use npm-check
npx npm-check
```

**Step 15: Categorize Dependencies**

For each dependency, determine:

- **Used:** Imported in code
- **Unused:** Never imported (safe to remove)
- **DevOnly:** Used in dev but in dependencies (should be devDependencies)
- **Outdated:** Has major version updates available

**Step 16: Check for Duplicate Packages**

```bash
# Find duplicate package versions
pnpm list --depth=1 | grep -B 1 "WARN"
```

**Step 17: Generate Dependency Report**

```markdown
# Dependency Analysis

Total Dependencies: X
Total DevDependencies: X

Unused Dependencies: X

- lodash (4.17.21)
  Never imported
  Size: 1.4MB
  Recommendation: Remove

- moment (2.29.4)
  Replaced by date-fns
  Size: 288KB
  Recommendation: Remove

Should be DevDependencies: X

- @types/node
  Currently in dependencies
  Recommendation: Move to devDependencies

Outdated (Major): X

- react (18.2.0 → 19.0.0)
  Breaking changes possible
  Recommendation: Review changelog before update

Duplicate Versions: X

- uuid@8.3.2 and uuid@9.0.0
  Multiple versions installed
  Recommendation: Align to single version
```

**Step 18: Remove Unused Dependencies**

Ask user: **"Remove X unused dependencies? (yes/no/review)"**

```bash
# Remove unused dependency
pnpm remove lodash

# Move to devDependencies
pnpm remove @types/node
pnpm add -D @types/node
```

---

### Phase 5: Code Duplication

**Step 19: Find Duplicate Code Blocks**

```bash
# Find duplicate function signatures
grep -r "export function\|export const.*=" app/ lib/ --include="*.ts" | sort | uniq -c | sort -rn | grep -v "^   1 "

# Find similar component patterns
# (This is heuristic - manual review needed)
```

**Step 20: Identify Candidates for Extraction**

Look for:

- Same function in multiple files
- Similar components with minor differences
- Repeated logic blocks
- Copy-pasted code

**Step 21: Generate Duplication Report**

```markdown
# Code Duplication Analysis

Duplicate Functions: X

- formatPhoneNumber()
  Found in 3 files:
  - app/church/[slug]/admin/members/utils.ts
  - app/church/[slug]/admin/volunteers/utils.ts
  - components/dashboard/members/phone-formatter.ts
    Recommendation: Extract to lib/utils/phone.ts

Similar Components: X

- MemberCard and VolunteerCard
  80% code similarity
  Differ only in: displayed fields
  Recommendation: Create generic PersonCard component

Repeated Logic: X

- organizationId validation
  Repeated in 15 server actions
  Recommendation: Create validateOrgAccess() helper
```

**Step 22: Offer to Refactor**

Ask user: **"Refactor X duplicates? (yes/no/review)"**

For each duplicate:

1. Create shared utility/component
2. Replace all instances
3. Remove duplicates
4. Test functionality

---

### Phase 6: Environment & Config Cleanup

**Step 23: Check Environment Variables**

```bash
# List all env vars in code
grep -r "process.env" --include="*.ts" --include="*.tsx" app/ actions/ lib/

# Compare with .env.example
diff <(grep "^[A-Z]" .env.example | cut -d= -f1 | sort) <(grep -r "process.env\." --include="*.ts" -h | sed 's/.*process\.env\.\([A-Z_]*\).*/\1/' | sort | uniq)
```

**Step 24: Find Unused Environment Variables**

```bash
# For each var in .env.example, check if used
while read var; do
  if ! grep -r "process.env.$var\|env.$var" --include="*.ts" app/ actions/ lib/ > /dev/null; then
    echo "Unused: $var"
  fi
done < <(grep "^[A-Z]" .env.example | cut -d= -f1)
```

**Step 25: Check Config Files**

```bash
# Find config files
find . -maxdepth 2 -name "*.config.*" -type f

# Check for old configs
ls -la | grep -E "webpack|rollup|gulp"
```

**Step 26: Generate Config Cleanup Report**

```markdown
# Environment & Config Cleanup

Unused Environment Variables: X

- OLD_API_KEY
  Defined in .env.example
  Never used in code
  Recommendation: Remove from .env.example

- DEPRECATED_FEATURE_FLAG
  From old feature (removed 6 months ago)
  Recommendation: Remove

Missing from .env.example: X

- NEW_INTEGRATION_KEY
  Used in: lib/integrations/new-service.ts
  Not documented in .env.example
  Recommendation: Add to .env.example

Old Config Files: X

- webpack.config.js
  Not used (Next.js has its own config)
  Recommendation: Remove

- .babelrc
  Not needed for Next.js 15
  Recommendation: Remove
```

---

### Phase 7: Generate Final Report

**Step 27: Consolidate All Findings**

````markdown
# Codebase Cleanup Report

Generated: <timestamp>

## Summary

Total Cleanup Opportunities: X

Unused Imports: X files
Dead Code: X functions/components
Obsolete Files: X files
Unused Dependencies: X packages
Duplicate Code: X instances
Config Cleanup: X items

Estimated Space Savings: X MB
Estimated Complexity Reduction: X LOC removed

## Impact Analysis

Bundle Size:

- Before: X MB
- After (estimated): X MB
- Savings: X MB (X%)

Code Maintainability:

- Lines of Code: X → X (-X%)
- Files: X → X (-X%)
- Dependencies: X → X (-X%)

## Detailed Findings

### Unused Imports (X files)

<report from Phase 1>

### Dead Code (X items)

<report from Phase 2>

### Obsolete Files (X files)

<report from Phase 3>

### Unused Dependencies (X packages)

<report from Phase 4>

### Code Duplication (X instances)

<report from Phase 5>

### Environment & Config (X items)

<report from Phase 6>

## Recommendations by Priority

### High Priority (Do First)

1. Remove unused dependencies

   - Impact: Bundle size reduction
   - Effort: 5 minutes
   - Risk: Low

2. Remove obsolete files from old architecture
   - Impact: Clarity, reduced confusion
   - Effort: 10 minutes
   - Risk: Low (verified unused)

### Medium Priority (Do Soon)

1. Clean up unused imports

   - Impact: Faster builds, cleaner code
   - Effort: 15 minutes (automated)
   - Risk: Very low

2. Extract duplicate code
   - Impact: Maintainability
   - Effort: 1 hour
   - Risk: Medium (requires testing)

### Low Priority (Nice to Have)

1. Archive old files

   - Impact: Tidiness
   - Effort: 5 minutes
   - Risk: None

2. Clean up commented code
   - Impact: Readability
   - Effort: 30 minutes
   - Risk: None

## Automated Cleanup Script

Created cleanup script that can be run:

```bash
# Remove unused imports (safe)
pnpm run clean:imports

# Remove unused dependencies
pnpm remove lodash moment old-package

# Move obsolete files to archive
./scripts/archive-obsolete.sh

# Remove commented code
./scripts/remove-comments.sh
```
````

## Manual Review Required

These items need manual verification:

1. File: components/old/DeprecatedCard.tsx

   - Appears unused but large component
   - Recommendation: Review before deleting

2. Function: lib/utils/complexHelper.ts:formatData()

   - Only 1 usage found
   - Could be part of public API
   - Recommendation: Verify not used externally

3. Dependency: rarely-used-package
   - Only imported once
   - Large size (5MB)
   - Recommendation: Consider lighter alternative

## Next Steps

1. Review this report
2. Approve automated cleanup
3. Run cleanup scripts
4. Test application thoroughly
5. Commit with: "chore: clean unused code and dependencies"
6. Monitor for any issues

## Rollback Plan

All changes reversible:

- Archived files in .archive/ (can be restored)
- Dependencies in package.json history (can reinstall)
- Git history preserves all removed code

````

**Step 28: Ask for Approval**

Present summary and ask: **"Proceed with cleanup? (yes/review/no)"**

- **yes**: Execute automated cleanup
- **review**: Show each change individually
- **no**: Save report only, no changes

**Step 29: Execute Cleanup**

If approved:

```bash
# 1. Remove unused imports (via ESLint fix)
pnpm eslint --fix app/ components/ lib/ actions/

# 2. Remove unused dependencies
pnpm remove <packages>

# 3. Archive obsolete files
mkdir -p .archive/$(date +%Y-%m-%d)
mv <files> .archive/$(date +%Y-%m-%d)/

# 4. Remove commented code
# (manual or scripted)

# 5. Verify build still works
pnpm build

# 6. Run tests (if exist)
pnpm test
````

**Step 30: Generate Cleanup Summary**

```markdown
# Cleanup Complete!

Changes Applied:
✅ Removed X unused imports
✅ Removed X dead code blocks
✅ Archived X obsolete files
✅ Removed X unused dependencies
✅ Cleaned X config files

Results:

- Bundle size: X MB → X MB (-X%)
- Lines of code: X → X (-X%)
- Dependencies: X → X (-X packages)

Archived:

- All obsolete files in .archive/<date>/

Build Status: ✅ PASSING

Next: Review changes and commit
```

---

## Safety Measures:

**Before Cleanup:**

- [ ] Create git checkpoint: `git add -A && git commit -m "checkpoint before cleanup"`
- [ ] Run full build: `pnpm build`
- [ ] Run tests: `pnpm test`

**During Cleanup:**

- [ ] Archive don't delete (reversible)
- [ ] One category at a time
- [ ] Build after each phase

**After Cleanup:**

- [ ] Run build again
- [ ] Run tests again
- [ ] Manual smoke test
- [ ] Review git diff

**Rollback:**

```bash
# If something breaks
git reset --hard HEAD~1
# or
git checkout <file> # restore specific file
```

---

## When to Use:

✅ **Monthly maintenance**
✅ **Before major releases**
✅ **After large refactoring**
✅ **When bundle size grows**
✅ **After removing features**
✅ **Code review prep**
✅ **Onboarding (reduce confusion)**

---

## Integration:

**Can be called by:**

- Manual maintenance
- Pre-release checklist
- Monthly cleanup routine

**Works with:**

- `/review-code` - Find code quality issues
- `/check-patterns` - Find pattern violations
- `/update-docs` - Clean obsolete docs

**Run after:**

- Major refactoring
- Dependency updates
- Architecture changes

---

## Configuration:

Create `.cleanrc` to customize:

```json
{
  "ignorePatterns": ["**/*.test.ts", "**/temp/**"],
  "archiveEnabled": true,
  "autoFix": {
    "unusedImports": true,
    "commentedCode": false
  }
}
```
