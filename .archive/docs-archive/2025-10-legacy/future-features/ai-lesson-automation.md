# AI Lesson Automation - Feature Handoff

**Branch**: `feature/ai-lesson-automation`
**Created**: 2025-10-12
**Status**: Planning Phase
**Priority**: Medium (Post-MVP Enhancement)

---

## 🎯 Feature Goal

**Enable AI-powered course creation from uploaded documents**

Users upload training documents (PDF, DOCX, MD, TXT) → AI analyzes content → Generates structured course seed script → User reviews & approves → Course automatically created in database.

### Business Value

- **Time Savings**: 10+ hours → 30 minutes for course creation
- **Consistency**: AI ensures proper structure and formatting
- **Compliance Focus**: Ideal for HIPAA/Finance training content standardization
- **Scalability**: Enables rapid content creation for training platform

---

## 📊 Project Context

### Current Platform Status

- **Type**: Training Platform (formerly LMS) for compliance-heavy industries
- **Focus**: HIPAA (Healthcare), Finance, Legal, Manufacturing
- **Test Market**: GoHighLevel agencies (IV therapy clinics)
- **Production Status**: 90% ready (2 blockers: video management, security headers)

### Technical Stack

- **Framework**: Next.js 15.3.4 with App Router, TypeScript
- **Database**: Prisma + Neon PostgreSQL
- **Auth**: Better Auth (multi-tenant, role-based)
- **Storage**: Tigris S3
- **File Upload**: Custom React dropzone + S3 presigned URLs

### Existing Patterns

- **Server Actions**: Rate-limited with Arcjet, generic error messages
- **Multi-tenant**: Organization-based data isolation (agency vs platform)
- **Component Architecture**: Shared UI components in `/components`, context wrappers for routing
- **See**: `/docs/essentials/coding-patterns.md` for all standards

---

## 🏗️ Technical Approach

### Architecture Decision: Dev Feature First

**Build as experimental admin tool, not production feature**

- Platform admin only (role check required)
- Separate route: `/platform/admin/ai/course-builder`
- No multi-tenant support initially (platform courses only)
- Can expand to agency use later

### AI Provider Options

**Option 1: Anthropic Claude (Recommended)**

- Best for document analysis and structured output
- Already Claude Code in use (familiarity)
- Good at understanding training content structure

**Option 2: OpenAI GPT-4**

- Structured output via function calling
- Good alternative/fallback

**Option 3: Both with fallback**

- Primary: Claude, Fallback: GPT-4
- More complex but resilient

**Decision Needed**: User preference on provider?

---

## 🔧 Implementation Plan

### Phase 1: Document Upload & Storage (2-3 hours)

**Goal**: Accept document uploads and store securely

**Tasks**:

1. Create admin page: `/app/platform/admin/ai/course-builder/page.tsx`
2. Build document dropzone component
   - Accept: `.pdf`, `.docx`, `.md`, `.txt`
   - Max size: 10MB per file
   - Multiple file support
3. Upload to S3: `/ai-uploads/{timestamp}-{filename}`
4. Store metadata in temp table (or just S3 keys in session)

**Existing Patterns to Reference**:

- `/components/file-uploader/Uploader.tsx` (S3 upload logic)
- `/app/api/s3/upload/route.ts` (presigned URL generation)

---

### Phase 2: AI Document Parser (4-5 hours)

**Goal**: Extract course structure from uploaded documents

**Tasks**:

1. Create API route: `/app/api/ai/parse-documents/route.ts`
2. Implement document text extraction:
   - PDF: Use pdf-parse or pdf.js
   - DOCX: Use mammoth.js
   - MD/TXT: Direct reading
3. Send to AI with prompt:

   ```
   Analyze this training document and extract:
   - Course title
   - Course description (200-300 words)
   - Course category
   - Chapters (3-8 chapters recommended)
   - Lessons per chapter (3-5 lessons recommended)
   - Lesson descriptions

   Format output as JSON matching our Prisma schema
   ```

4. Return structured JSON matching seed script format

**Dependencies to Install**:

```bash
pnpm add @anthropic-ai/sdk pdf-parse mammoth
# or
pnpm add openai pdf-parse mammoth
```

**Rate Limiting**: Apply same Arcjet pattern as other server actions

---

### Phase 3: Preview & Review Interface (3-4 hours)

**Goal**: Show AI-generated structure, allow editing before creation

**Tasks**:

1. Display parsed course structure in cards
2. Allow inline editing:
   - Course title/description
   - Chapter titles
   - Lesson titles/descriptions
3. Validation:
   - Ensure all required fields present
   - Check slug uniqueness
   - Validate structure (min 1 chapter, min 1 lesson)
4. Save to state (React context or form state)

**UI Components**:

- Collapsible chapters (reuse existing patterns)
- Inline editing (similar to `EditCourseForm.tsx`)
- Review summary panel

---

### Phase 4: Course Generation (2-3 hours)

**Goal**: Create actual course in database from approved structure

**Tasks**:

1. Create server action: `createCourseFromAI()`
2. Use Prisma transaction:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const course = await tx.course.create({ ... });
     for (chapter of chapters) {
       const ch = await tx.chapter.create({ ... });
       for (lesson of chapter.lessons) {
         await tx.lesson.create({ ... });
       }
     }
   });
   ```
3. Generate slugs using existing `slugify` package
4. Set default values:
   - `status: Draft`
   - `isFree: true` initially
   - `isPlatformCourse: true`
   - Placeholder images from `/public`
5. Redirect to course edit page after creation

**Existing Patterns to Reference**:

- `/prisma/seed-courses.ts` (nested course creation)
- `/app/platform/admin/courses/create/actions.ts` (course creation logic)

---

### Phase 5: Polish & Error Handling (1-2 hours)

**Goal**: Production-quality error handling and UX

**Tasks**:

1. Handle AI failures gracefully
2. Show loading states during AI processing
3. Allow retry on failures
4. Add toast notifications
5. Cleanup uploaded files after processing
6. Add usage tracking (optional)

---

## 📁 File Structure

```
app/
├── platform/admin/ai/
│   └── course-builder/
│       ├── page.tsx              # Main AI course builder page
│       ├── actions.ts            # Server actions
│       └── _components/
│           ├── DocumentUploader.tsx
│           ├── CoursePreview.tsx
│           └── StructureEditor.tsx
│
├── api/ai/
│   ├── parse-documents/
│   │   └── route.ts              # AI document parsing endpoint
│   └── check-status/
│       └── route.ts              # Optional: async job status
│
lib/
├── ai/
│   ├── anthropic-client.ts       # AI client wrapper
│   ├── document-parser.ts        # Text extraction
│   └── prompt-templates.ts       # AI prompts
│
docs/
└── ai-sessions/
    └── AI-LESSON-AUTOMATION-HANDOFF.md  # This file
```

---

## 🔐 Security Considerations

### Access Control

- Platform admin only: `requireAdmin()` on all routes
- Rate limit AI API calls: 10 per hour per user
- Validate file types and sizes before upload

### Data Privacy

- Documents uploaded are temporary (delete after 24 hours)
- No PII/PHI in uploaded documents (user's responsibility)
- AI requests logged for debugging only

### Cost Management

- Track AI API usage per organization
- Set monthly spending limits
- Alert on unusual patterns

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Document Upload**:

- [ ] Upload PDF successfully
- [ ] Upload DOCX successfully
- [ ] Upload MD/TXT successfully
- [ ] Reject invalid file types
- [ ] Reject oversized files
- [ ] Handle multiple file uploads

**AI Parsing**:

- [ ] Extract course structure from simple document
- [ ] Extract from complex document (20+ pages)
- [ ] Handle poorly formatted documents
- [ ] Graceful failure on parsing errors
- [ ] Retry mechanism works

**Preview & Edit**:

- [ ] Display all extracted data
- [ ] Edit course title inline
- [ ] Edit chapter/lesson titles
- [ ] Validation prevents empty fields
- [ ] Can add/remove chapters manually

**Course Creation**:

- [ ] Creates course in database
- [ ] All chapters created
- [ ] All lessons created
- [ ] Slugs are unique
- [ ] Redirects to edit page
- [ ] Can immediately edit created course

### Sample Test Documents

**Create these in `/docs/test-data/`**:

1. `simple-training.md` - 3 chapters, 9 lessons
2. `hipaa-compliance.pdf` - Real HIPAA training content
3. `finance-regulations.docx` - Financial compliance document
4. `malformed.txt` - Edge case testing

---

## 📊 Success Metrics

### MVP Success (Phase 1-4 Complete)

- ✅ Platform admin can upload documents
- ✅ AI successfully parses 80%+ of documents
- ✅ Generated courses require minimal editing
- ✅ Course creation time: 10+ hours → 30 minutes
- ✅ No security vulnerabilities

### Future Enhancements (Post-MVP)

- Agency admin access (multi-tenant support)
- Video script generation from content
- Quiz/assessment generation
- Bulk document processing (upload folder)
- Integration with content libraries
- Version control (iterate on existing courses)

---

## 🚧 Known Limitations & Trade-offs

### Current Limitations

1. **No Video Content**: AI generates structure only, videos added manually
2. **Text-Based Only**: No image/diagram extraction from PDFs
3. **English Only**: No multi-language support initially
4. **Platform Admin Only**: Not available to agency admins yet
5. **Sync Processing**: User waits for AI (no background jobs)

### Why These Limitations Are Acceptable

- MVP focus: Prove value first
- Video upload already solved (existing workflow)
- Most compliance training is text-heavy
- English covers 80%+ of initial market
- Can add async processing later if needed

---

## 🔄 Integration Points

### Existing Systems to Connect

**Course Management**:

- Uses existing `/components/courses/CreateCourseForm.tsx` patterns
- Integrates with Prisma schema (no changes needed)
- Works with existing slug generation

**File Storage**:

- Uses existing S3 integration
- Follows same folder structure patterns
- Reuses presigned URL logic

**Authentication**:

- Uses existing `requireAdmin()` helper
- Respects role-based access control
- No multi-tenant complexity initially

**UI Components**:

- Reuses existing shadcn/ui components
- Follows established design patterns
- Maintains consistency with platform

---

## 🎯 MVP Definition of Done

**Phase 1-4 Complete**:

- [ ] Admin can access `/platform/admin/ai/course-builder`
- [ ] Can upload PDF/DOCX/MD/TXT documents
- [ ] AI parses documents and returns structured JSON
- [ ] Preview interface shows extracted structure
- [ ] Can edit course/chapter/lesson details before creation
- [ ] "Generate Course" button creates course in database
- [ ] Redirects to course edit page after creation
- [ ] Error handling for all failure cases
- [ ] Rate limiting applied
- [ ] Build passes, no TypeScript errors

**Documentation**:

- [ ] Update STATUS.md with AI feature status
- [ ] Add usage instructions to admin docs
- [ ] Document AI provider configuration
- [ ] Add .env.example entries for API keys

---

## 🚀 Getting Started

### Prerequisites

1. **AI Provider Setup**:

   ```bash
   # Add to .env.local
   ANTHROPIC_API_KEY=sk-ant-...
   # or
   OPENAI_API_KEY=sk-...
   ```

2. **Install Dependencies**:

   ```bash
   pnpm add @anthropic-ai/sdk pdf-parse mammoth
   ```

3. **Read Project Patterns**:
   - `/docs/essentials/coding-patterns.md`
   - `/docs/essentials/architecture.md`
   - `/prisma/seed-courses.ts` (reference)

### Development Workflow

1. **Start with Phase 1**: Document upload UI
2. **Test Incrementally**: Each phase works standalone
3. **Follow Patterns**: Copy existing components/actions
4. **Ask Questions**: Unclear? Check docs or ask user

---

## 📞 Questions for User

Before implementation begins:

1. **AI Provider**: Anthropic Claude, OpenAI GPT-4, or both?
2. **Scope**: Start with MVP (Phases 1-4) or add Phase 5 polish?
3. **Timeline**: Target completion date?
4. **Priority**: Should this block video management fixes?
5. **Testing**: Should I create sample test documents?

---

## 🎬 Next Steps

**Immediate Actions**:

1. User answers questions above
2. Set up AI provider API key in `.env.local`
3. Install dependencies
4. Begin Phase 1: Document upload UI

**Estimated Timeline**:

- Phase 1: 2-3 hours
- Phase 2: 4-5 hours
- Phase 3: 3-4 hours
- Phase 4: 2-3 hours
- Phase 5: 1-2 hours
- **Total MVP**: 12-17 hours

---

**End of Handoff Document**

This document serves as a complete reference for any AI session picking up this feature. All context, decisions, and implementation details are captured above.
