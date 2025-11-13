# CLAUDE.md Creation Instructions

**Purpose:** This guide ensures CLAUDE.md files contain technical context for AI coding assistants, not project management content.

---

## MUST Include (In Priority Order)

### 1. Tech Stack (With Versions)

```markdown
## Tech Stack

- Language: TypeScript 5.x
- Framework: Next.js 14 (App Router)
- Database: PostgreSQL 16
- Package Manager: pnpm
```

### 2. Essential Commands

```markdown
## Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm test` - Run tests (must pass before commit)
- `pnpm build` - Build for production
```

### 3. Code Conventions (Specific, Not Generic)

```markdown
## Code Conventions

- TypeScript strict mode - no `any` types
- Functional components with hooks only
- Import order: 1) Framework, 2) Third-party, 3) Local
- PascalCase for components, camelCase for functions
```

### 4. Architecture Overview (Concise)

```markdown
## Architecture

- `/app` - Next.js App Router pages
- `/components` - Reusable UI components
- `/lib` - Utilities and API clients
- `/tests` - Co-located with source files
```

### 5. Critical Rules (What AI Must Never Do)

```markdown
## Do NOT

- Commit API keys or credentials
- Edit files in `/legacy` directory
- Skip tests before committing
- Use `any` type in TypeScript
```

### 6. Testing Requirements

```markdown
## Testing

- Framework: Jest + React Testing Library
- Coverage target: 80%+
- Tests co-located with components
- All tests must pass before commit
```

---

## MUST NOT Include

❌ **Project timelines** - Belongs in project management tools  
❌ **Sprint schedules** - Belongs in Jira/Linear/etc  
❌ **Feature roadmaps** - Belongs in separate planning docs  
❌ **Phase definitions** - Belongs in project planning  
❌ **Milestone dates** - Belongs in project management system  
❌ **Meeting notes** - Belongs in meeting documentation  
❌ **Team assignments** - Belongs in project management system  
❌ **Budget information** - Not relevant to code generation  
❌ **Business requirements** - Belongs in PRD documents  
❌ **Long narrative explanations** - AI needs directives, not prose  
❌ **API keys or secrets** - Security violation  
❌ **Duplicate information** - Link to docs instead with @imports

---

## File Size Guidelines

- **Target:** Under 100 lines for main CLAUDE.md
- **Maximum:** 40,000 characters before performance degrades
- **Character count:** Run `wc -c CLAUDE.md` to check
- **Optimization:** Use @imports for detailed documentation

```markdown
## Additional Documentation

- Architecture: @docs/architecture.md
- API Reference: @docs/api-spec.md
```

---

## Standard Template

```markdown
# [Project Name]

## Tech Stack

- Language: [Language + Version]
- Framework: [Framework + Version]
- Database: [Database + Version]
- Package Manager: [pnpm/npm/yarn]
- [Other key dependencies with versions]

## Commands

- `[install command]` - Install dependencies
- `[dev command]` - Start development server
- `[test command]` - Run tests
- `[build command]` - Build for production
- `[lint command]` - Lint code
- `[deploy command]` - Deploy (if applicable)

## Code Conventions

- [Specific style rule 1]
- [Specific style rule 2]
- [Naming conventions]
- [Import ordering]
- [Formatting preferences]

## Architecture

- `/[directory]` - [Purpose]
- `/[directory]` - [Purpose]
- See @docs/architecture.md for detailed flow

## Testing

- Framework: [Test framework + version]
- Coverage: [Target percentage]
- Location: [Where tests live]
- Run before commit: `[test command]`

## Critical Rules

<rule id="1" name="[Rule Name]">
[Specific, enforceable rule]
</rule>

<rule id="2" name="[Rule Name]">
[Specific, enforceable rule]
</rule>

## Do NOT

- [Prohibited action 1]
- [Prohibited action 2]
- [Prohibited action 3]

## Additional Documentation

- [Topic]: @path/to/file.md
```

---

## Examples: Good vs Bad Content

### ✅ GOOD - Technical Context

```markdown
## Database

- ORM: Prisma 5.x
- Schema: src/prisma/schema.prisma
- Migrations: Run `pnpm prisma migrate dev` before testing
- Never bypass Prisma - always use type-safe queries
```

### ❌ BAD - Project Management

```markdown
## Project Timeline

Phase 1 (Week 1-2): Authentication
Phase 2 (Week 3-4): Dashboard
Phase 3 (Week 5-6): Reporting

Sprint Goals:

- Complete user login by Friday
- Deploy to staging by end of sprint

Milestone: MVP launch December 7th
```

---

### ✅ GOOD - Architecture

```markdown
## Architecture

- 7 microservices pattern
- Event-driven with Kafka queues
- See @docs/architecture.md for complete data flow
```

### ❌ BAD - Over-Detailed

```markdown
## Architecture

Our system uses a microservices architecture where each service is
independently deployable and scalable. We chose this pattern because
it allows teams to work independently and deploy without coordinating
releases. The services communicate via Kafka message queues which
provide durability and replay capabilities. Each service has its own
database following the database-per-service pattern...

[300 more words of architectural philosophy]
```

---

### ✅ GOOD - Code Conventions

```markdown
## Code Conventions

- TypeScript strict mode with explicit return types
- No `any` types - define proper interfaces
- Use optional chaining: `array[0]?.property`
- Import order: 1) Framework, 2) Third-party, 3) Local (@/\*)
```

### ❌ BAD - Generic Advice

```markdown
## Code Conventions

- Write clean, maintainable code
- Follow best practices
- Use descriptive variable names
- Keep functions small and focused
```

---

## Validation Checklist

Before finalizing CLAUDE.md, verify:

- [ ] Contains tech stack with explicit versions
- [ ] Lists only commands AI needs to run
- [ ] Specifies concrete, measurable code conventions
- [ ] Defines critical rules with enforcement
- [ ] Under 100 lines (or uses @imports for detail)
- [ ] No project timelines, phases, or milestones
- [ ] No sprint schedules or deadline dates
- [ ] No business requirements or feature descriptions
- [ ] No API keys, credentials, or secrets
- [ ] No long explanatory prose - only directives
- [ ] File is under 40,000 characters (`wc -c CLAUDE.md`)

---

## Common Mistakes & Fixes

### Mistake #1: Business Context

**Bad:**

```markdown
We're building a racing commentator app that will revolutionize sports
broadcasting by providing real-time AI-generated commentary with
sub-second latency, targeting the esports market with a B2B SaaS model
and projected $5M ARR by Q4 2026.
```

**Fix:**

```markdown
# Racing Commentator - Real-time AI sports commentary

Sub-400ms latency target for commentary generation and voice synthesis.
```

---

### Mistake #2: Project Timeline

**Bad:**

```markdown
## Project Phases

Phase 1 (Nov 1-15): Core infrastructure
Phase 2 (Nov 16-30): AI integration
Phase 3 (Dec 1-7): Polish and demo prep
Deadline: December 7th hackathon submission
```

**Fix:**
Remove entirely. Put in project management tool or separate planning document.

---

### Mistake #3: Generic Conventions

**Bad:**

```markdown
## Code Style

- Use TypeScript and follow best practices
- Write clean code with good naming
- Test your code
- Document complex logic
```

**Fix:**

```markdown
## Code Conventions

- TypeScript strict mode - no `any` types, explicit return types
- PascalCase for classes, camelCase for functions, UPPER_CASE for constants
- Testing: Vitest with vi.fn() mocking, 80%+ coverage required
- Comments only for non-obvious business logic, not "what" code does
```

---

### Mistake #4: Duplicate Information

**Bad:**

```markdown
## Architecture

Our system consists of 7 microservices:

1. telemetry-ingestion - This service handles incoming telemetry data
   from racing simulators via HTTP and WebSocket connections. It validates
   the data format and pushes to the message queue...
2. event-processor - This service consumes messages from the telemetry
   queue and processes them to detect significant events like overtakes,
   crashes, and pit stops...

[5 more paragraphs describing each service in detail]
```

**Fix:**

```markdown
## Architecture

- 7 microservices (telemetry-ingestion, event-processor, commentary-generator,
  voice-synthesizer, audio-streamer, dashboard-service, race-context-manager)
- See @SYSTEM_OVERVIEW.md for complete architecture and data flow
```

---

## Quick Reference: Content Placement

| Content Type              | Correct Location         |
| ------------------------- | ------------------------ |
| Tech stack with versions  | ✅ CLAUDE.md             |
| Commands to run           | ✅ CLAUDE.md             |
| Code conventions          | ✅ CLAUDE.md             |
| Architecture overview     | ✅ CLAUDE.md             |
| Critical rules            | ✅ CLAUDE.md             |
| Testing requirements      | ✅ CLAUDE.md             |
| **Project timelines**     | ❌ Project mgmt tool     |
| **Sprint schedules**      | ❌ Jira/Linear/Asana     |
| **Phase definitions**     | ❌ Planning document     |
| **Milestone dates**       | ❌ Project mgmt tool     |
| **Business requirements** | ❌ PRD document          |
| **Feature roadmap**       | ❌ Product planning      |
| **Team assignments**      | ❌ Project mgmt tool     |
| **Meeting notes**         | ❌ Meeting docs          |
| **Budget/financials**     | ❌ Finance docs          |
| Detailed architecture     | ✅ @docs/architecture.md |
| API documentation         | ✅ @docs/api-spec.md     |
| Database schemas          | ✅ @docs/database.md     |

---

## Usage Instructions

### For AI Sessions:

```
Read CLAUDE_MD_CREATION_GUIDE.md above. Generate a CLAUDE.md file
for [project description]. Include ONLY technical context.
Exclude all project management content: no timelines, phases,
deadlines, sprint schedules, or business requirements.
```

### For Manual Creation:

1. Start with the standard template above
2. Fill in each section with project-specific technical details
3. Keep descriptions concise - bullet points, not paragraphs
4. Run through validation checklist
5. Check character count: `wc -c CLAUDE.md`
6. If over 30k characters, move detailed content to @imported files

### For Review:

1. Check against "MUST NOT Include" list
2. If you see timelines, phases, or management content → remove
3. If you see generic advice → make it specific to your project
4. If you see long explanations → condense to directives
5. Run validation checklist

---

## Security Note

Create `.claude/settings.json` to technically enforce security rules:

```json
{
  "permissions": {
    "deny": [
      "Read(**/.env*)",
      "Read(**/secrets/**)",
      "Read(**/*.key)",
      "Read(**/*.pem)"
    ]
  }
}
```

Documentation alone won't prevent Claude from accessing sensitive files.
Technical controls are mandatory, not optional.

---

## Final Checklist

Your CLAUDE.md is ready when:

- [ ] Tech stack section has explicit versions
- [ ] Commands section lists only what AI needs to run
- [ ] Code conventions are specific and measurable
- [ ] Architecture is concise (details in @imported files)
- [ ] Testing requirements specify framework, coverage, location
- [ ] Critical rules use XML tags for better adherence
- [ ] "Do NOT" section lists prohibited actions
- [ ] File is under 40k characters
- [ ] Zero project management content (timelines, phases, schedules)
- [ ] Zero business strategy content
- [ ] Zero sensitive information (keys, credentials)
- [ ] Each section serves the goal: "Help Claude write correct code for THIS system"

---

**Remember:** CLAUDE.md is technical context for code generation, not project documentation. When in doubt, ask: "Does Claude need this to write correct code?" If no, it doesn't belong here.
