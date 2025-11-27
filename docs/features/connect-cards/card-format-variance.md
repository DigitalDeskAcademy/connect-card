# Connect Card Format Variance

> **Status:** Planned - Option 5 Selected
> **Priority:** High - Core friction point
> **Worktree:** `connect-card` > **Created:** 2024-11-27

## Problem

Every church has different connect cards. While they collect similar information (name, contact, prayer requests, interests), the layouts, field names, and formats vary significantly.

**Examples of variance:**

- "Prayer Request" vs "How can we pray for you?" vs "Prayer Needs"
- Checkboxes vs write-in fields for interests
- Single card vs multi-page forms
- Pre-printed fields vs blank sections

## Chosen Approach: Guided Onboarding with AI (Option 5)

Church uploads sample card → AI suggests field mappings → Church confirms/adjusts → System learns.

**Why this approach:**

- One-time setup, minimal ongoing friction
- AI does heavy lifting during onboarding
- Church keeps their existing cards
- System learns church-specific patterns
- Scales across any card format

### Implementation Flow

1. **Onboarding Step:** Church uploads 1-3 sample connect cards
2. **AI Analysis:** Claude Vision analyzes card layout, identifies fields
3. **Field Mapping UI:** Show detected fields, let church confirm/rename
4. **Save Template:** Store mapping for this church's card format
5. **Processing:** Future cards use saved template + AI extraction
6. **Learning:** Flag low-confidence extractions for review, improve over time

## Other Options Considered

### 1. Template Library (Rejected)

Pre-built templates for common card layouts.
**Why not:** Churches don't want to change their cards.

### 2. AI-Only Extraction (Rejected)

Pure AI extraction without configuration.
**Why not:** Too unpredictable, cost per scan adds up.

### 3. Manual Field Mapping (Rejected)

Churches define layout manually.
**Why not:** Too much onboarding friction.

### 4. Hybrid AI + Review (Partial)

Will use this as fallback for low-confidence extractions.

## Questions to Answer

1. What's the acceptable error rate for field extraction?
2. How much onboarding friction is acceptable?
3. What's the budget for AI API calls per card?
4. Should churches be able to use their existing cards, or do we provide printable templates?
5. How do we handle handwriting recognition accuracy?

## AI Considerations

- **Vision models** (Claude, GPT-4V) can extract structured data from images
- **Fine-tuning** may improve accuracy for common patterns
- **Prompt engineering** can guide extraction for specific field types
- **Confidence scoring** helps route uncertain extractions to human review

## Recommended Next Steps

1. [ ] Survey target churches about their current card formats
2. [ ] Test AI extraction accuracy on 10-20 sample cards
3. [ ] Prototype the guided onboarding flow
4. [ ] Cost analysis: AI calls vs manual entry time savings

## Related

- `/docs/features/connect-cards/` - Connect card feature specs
- Church onboarding flow
