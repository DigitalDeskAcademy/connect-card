# Future Features - Parking Lot

**Purpose**: This folder contains fully-specified features that are ready to implement but deprioritized until after MVP launch and revenue validation.

---

## 📦 Features in Parking Lot

### 1. AI Lesson Automation

**File**: `ai-lesson-automation.md`
**Status**: Fully Specified
**Estimated Effort**: 12-17 hours
**Priority**: Post-MVP (After $10k MRR)

**Summary**: Upload training documents (PDF, DOCX, MD) → AI extracts course structure → Generate courses automatically.

**Why Parked**: Need to validate market demand and generate revenue before building automation. Manual course creation is sufficient for first 10 customers.

**Unblocking Questions** (Answer before starting):

1. AI Provider: Anthropic Claude, OpenAI GPT-4, or both?
2. Scope: MVP only or include polish phase?
3. Access: Platform admins only or agency admins too?
4. Testing: Need sample test documents created?
5. Multi-tenant: Single-tenant first or multi-tenant from start?

---

## 🎯 When to Unpark a Feature

**Revenue Milestones**:

- $1k MRR: Fix painful manual processes
- $5k MRR: Add features customers explicitly request
- $10k MRR: Build nice-to-have automation

**Customer Validation**:

- 5+ customers request the same feature
- Feature blocks new sales opportunities
- Manual workaround costs >10 hours/week

**Technical Readiness**:

- No production blockers exist
- Core platform stable
- Team has bandwidth

---

## 🚫 What NOT to Do

- Don't build features "because they're cool"
- Don't add features without customer validation
- Don't build automation before manual process is proven
- Don't start new features with production blockers unresolved

---

## 📝 Adding New Features to Parking Lot

**Required Documentation**:

1. Business value & target customer
2. Technical approach & architecture
3. Implementation phases with time estimates
4. Integration points with existing code
5. Success metrics & definition of done
6. Unblocking questions to answer before starting

**Template**: Copy `ai-lesson-automation.md` structure

---

## 🔄 Feature Lifecycle

```
Idea → Validated Need → Fully Specified → Parked → Prioritized → Built → Shipped
```

**Current Stage**: All features here are "Parked" (fully specified but deprioritized)

---

**Last Updated**: 2025-10-12
