# QR Code Digital Connect Cards

**Status:** Planning
**Priority:** High (Production Feature)
**Target:** Post-MVP

---

## Overview

Enable churches to print QR codes on physical connect cards that link to a digital form. Visitors scan the QR code with their phone and fill out the connect card digitally, eliminating the need for handwriting recognition.

### User Flow

1. **Admin** generates a QR code for their church/location
2. **Admin** prints QR codes on physical connect cards or displays
3. **Visitor** scans QR code with phone camera
4. **Visitor** fills out digital connect card form (no login required)
5. **System** creates ConnectCard record with status `REVIEWED` (no AI extraction needed)
6. **Staff** sees new digital submissions in their connect card queue

---

## Technical Architecture

### URL Structure (Token-Based)

```
https://churchconnect.app/connect/[token]
Example: https://churchconnect.app/connect/abc123xyz789
```

**Why token-based:**

- Short, scannable URLs
- Non-guessable (secure)
- Trackable (scan analytics)
- Can be expired/revoked
- Follows existing `/volunteer/confirm/[token]` pattern

### New Prisma Model

```prisma
model ConnectCardQRCode {
  id              String       @id @default(uuid())
  token           String       @unique @db.VarChar(64)
  organizationId  String
  locationId      String?
  displayName     String?      // "Main Campus QR" for admin reference
  createdAt       DateTime     @default(now())
  expiresAt       DateTime?    // Optional expiration
  scannedCount    Int          @default(0)
  lastScannedAt   DateTime?
  isActive        Boolean      @default(true)

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  location        Location?    @relation(fields: [locationId], references: [id])

  @@index([organizationId])
  @@index([token])
  @@map("connect_card_qr_code")
}
```

### File Structure

```
/app/connect/[token]/
  page.tsx                    # Public form page (no auth)

/actions/connect-card/
  submit-digital-card.ts      # Server action for form submission

/components/connect-card/
  qr-code-generator.tsx       # Admin: generate & display QR codes
  digital-card-form.tsx       # Public: visitor form component

/lib/data/
  connect-card-qr.ts          # Data layer for QR operations
```

---

## Implementation Phases

### Phase 1: Core Infrastructure

- [ ] Add `qrcode` and `react-qr-code` dependencies
- [ ] Create `ConnectCardQRCode` Prisma model
- [ ] Run migration
- [ ] Create data layer functions

### Phase 2: Public Form

- [ ] Create `/connect/[token]` route (no auth required)
- [ ] Build digital connect card form component
- [ ] Create form submission server action
- [ ] Add rate limiting (Arcjet)
- [ ] Track scan count on page load

### Phase 3: Admin UI

- [ ] QR code generator component
- [ ] Add "Generate QR Code" to connect cards page
- [ ] QR code management page (view, download, deactivate)
- [ ] Per-location QR code support

### Phase 4: Polish & Analytics

- [ ] Scan analytics (count over time, by location)
- [ ] QR code expiration management
- [ ] Branded QR codes (logo in center)
- [ ] Bulk QR code generation for multiple locations

---

## Form Fields (Digital Card)

Match existing connect card structure:

```typescript
interface DigitalConnectCardForm {
  // Required
  name: string;

  // Optional
  email?: string;
  phone?: string;
  address?: string;

  // Interests (checkboxes)
  interests?: string[]; // ["worship", "kids", "groups", etc.]

  // Visit info
  visitType?: "first_time" | "returning" | "regular";

  // Prayer
  prayerRequest?: string;
  prayerIsPrivate?: boolean;

  // Volunteer
  volunteerInterest?: boolean;
  volunteerCategory?: string;
}
```

---

## Security Considerations

### Multi-Tenant Isolation

- Every QR token is scoped to `organizationId`
- Form submissions automatically tagged with org from token
- Cannot access other org's data via token manipulation

### Rate Limiting

```typescript
const aj = arcjet.withRule(
  fixedWindow({ mode: "LIVE", window: "1m", max: 10 })
);
```

### Token Security

- Use `crypto.randomUUID()` for token generation
- Tokens are unique, non-sequential
- Optional expiration dates
- Can be deactivated by admin

### Form Validation

- Zod schema validation (same as existing patterns)
- Email format validation
- Phone number formatting
- XSS prevention on text fields

---

## Dependencies

```json
{
  "qrcode": "^1.5.x", // Server-side QR generation
  "react-qr-code": "^2.0.x", // Client-side React component
  "@types/qrcode": "^1.5.x" // TypeScript types
}
```

---

## UI/UX Considerations

### Public Form Page

- Mobile-first design (most scans from phones)
- Church branding (name, logo if available)
- Clear, simple form layout
- Success confirmation with animation
- No login required

### Admin QR Generator

- Preview QR code before generating
- Download as PNG/SVG
- Copy shareable link
- Per-location selection
- Display name for organization

### QR Code Display Options

- Standard black/white QR
- Future: branded with church logo
- Print-optimized sizes (1", 2", 3")

---

## Analytics (Future)

Track for insights:

- **Scans per QR code** - Which locations are active
- **Scans over time** - Sunday trends
- **Completion rate** - Scans vs submissions
- **Device types** - Mobile vs tablet
- **Peak times** - When visitors scan

---

## Comparison: QR vs Image Upload

| Aspect          | QR Digital Form     | Image Upload + AI       |
| --------------- | ------------------- | ----------------------- |
| Accuracy        | 100% (user typed)   | 60-85% (AI OCR)         |
| Speed           | Instant             | 10-30 sec processing    |
| Cost            | Free                | Claude API cost         |
| Setup           | Generate QR once    | Upload each card        |
| User Experience | Visitor fills form  | Staff reviews AI output |
| Best For        | Tech-savvy visitors | Traditional card users  |

**Recommendation:** Offer both options. QR for modern churches, image upload for traditional.

---

## Related Documents

- `/docs/features/connect-cards/vision.md` - Overall connect card strategy
- `/docs/features/connect-cards/card-format-variance.md` - Physical card formats
- `/app/volunteer/confirm/[token]/page.tsx` - Token-based public route pattern

---

## Open Questions

1. **Should QR codes expire by default?** (90 days? Never?)
2. **Allow multiple QR codes per location?** (seasonal, event-specific)
3. **Email notification on new digital submission?**
4. **Integrate with existing batch system or separate queue?**

---

_Last Updated: December 2024_
