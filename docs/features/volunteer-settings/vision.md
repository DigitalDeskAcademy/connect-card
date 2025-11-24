# Volunteer Settings Feature (Future Worktree)

**Status:** Planned - Will be its own worktree
**Priority:** High - Needed for full volunteer workflow
**Created:** 2025-11-22

## Overview

Churches need a centralized settings area to configure volunteer management features. This will likely be substantial enough to warrant its own worktree for development.

## Required Settings Areas

### 1. Volunteer Categories Management

**Location:** `/church/[slug]/admin/settings/volunteers/categories`

**Functionality:**

- View all current volunteer categories
- Add custom categories beyond the defaults (GENERAL, GREETER, USHER, etc.)
- Edit category names and descriptions
- Reorder categories (priority/display order)
- Disable categories (soft delete - preserve data)
- Set category-specific requirements (e.g., "Background check required")

**Use Case:** Churches have unique ministry needs. One church might need "Tech Team" while another needs "Prayer Intercessors". Custom categories allow flexibility while maintaining data structure.

### 2. Background Check Document Management

**Location:** `/church/[slug]/admin/settings/volunteers/background-checks`

**Functionality:**

- Upload background check instruction documents (PDF, DOCX)
- Upload background check forms/applications
- Configure which categories require background checks
- Set background check expiration periods (default: 2 years)
- Email template editor for sending background check info
- Track document versions and update history

**Use Case:** When "Send Background check information" is checked in connect card review, system needs to know:

1. Which documents to send
2. Which email template to use
3. Who to CC (ministry leader, church admin)

**Integration Points:**

- Connect card review queue (`sendBackgroundCheckInfo` checkbox)
- Volunteer profile (track background check status)
- Automated reminders for expiring background checks

### 3. Leader Notification Templates

**Location:** `/church/[slug]/admin/settings/volunteers/notifications`

**Functionality:**

- Email template for "New volunteer assigned to you"
- SMS template (optional) for leader notifications
- Configure CC recipients (church admin, volunteer coordinator)
- Customize message based on volunteer category
- Include/exclude volunteer contact info in notification

**Use Case:** When "Send message to Leader" is checked, system sends email to assigned leader with:

- Volunteer name and contact info
- Category they're interested in
- Any notes from connect card review
- Next steps for the leader

**Integration Points:**

- Connect card review queue (`sendMessageToLeader` checkbox)
- Team management (ensure leaders have email addresses)
- Volunteer assignments

### 4. Volunteer Category Leaders

**Location:** `/church/[slug]/admin/settings/volunteers/category-leaders`

**Functionality:**

- Assign team members to lead specific categories
- Multi-category assignments (one leader can oversee multiple areas)
- Primary vs backup leaders
- Leader contact preferences (email only, SMS + email)
- Auto-assignment rules (round-robin, capacity-based)

**Use Case:** When reviewing a connect card for "Kids Ministry", staff needs to see which leaders can receive this volunteer. Settings determine:

1. Who appears in "Assigned Leader" dropdown
2. Who receives notifications when volunteers are assigned
3. Who sees volunteer inquiries in their dashboard

**Integration Points:**

- Connect card review queue (populates "Assigned Leader" dropdown)
- Team management page (sync with staff roles)
- Volunteer dashboard (leader view of their assigned volunteers)

### 5. Default Workflow Settings

**Location:** `/church/[slug]/admin/settings/volunteers/defaults`

**Functionality:**

- Default category (currently hardcoded to GENERAL)
- Auto-assign to leader (yes/no)
- Auto-send notifications (yes/no - overrides checkboxes)
- Required fields for volunteer submission
- Grace period for inquiry follow-up (default: 7 days)

**Use Case:** Large churches processing 100+ connect cards on Sunday need fast defaults:

- "Auto-assign to GENERAL category leader"
- "Always send background check info for KIDS_MINISTRY"
- "Never auto-notify for GENERAL (too many inquiries)"

## Technical Considerations

### Database Schema Changes Needed

**New Tables:**

```prisma
// Custom volunteer categories
VolunteerCategoryCustom {
  id, organizationId, categoryKey, displayName,
  description, requiresBackgroundCheck,
  isActive, displayOrder, createdAt, updatedAt
}

// Background check documents
BackgroundCheckDocument {
  id, organizationId, fileName, fileUrl,
  documentType (INSTRUCTIONS | FORM | CONSENT),
  isActive, version, uploadedAt, uploadedBy
}

// Notification templates
NotificationTemplate {
  id, organizationId, templateType,
  subject, bodyHtml, bodyText,
  applicableCategories[], isActive
}

// Category leader assignments
CategoryLeaderAssignment {
  id, organizationId, userId, categoryKey,
  isPrimary, notificationPreference,
  createdAt
}
```

### Server Actions Needed

- `updateVolunteerCategories()` - Manage custom categories
- `uploadBackgroundCheckDocument()` - S3 upload + metadata
- `updateNotificationTemplate()` - Email/SMS template editor
- `assignCategoryLeader()` - Leader assignment management
- `getVolunteerSettings()` - Fetch all settings for church
- `updateDefaultWorkflowSettings()` - Update defaults

### UI Components Needed

- Rich text editor for email templates (Tiptap or similar)
- Drag-and-drop file upload for background check docs
- Category reordering interface (drag-and-drop list)
- Template preview (show example notification)
- Settings validation (ensure required fields exist)

## Implementation Strategy

### Phase 1: Categories & Leaders (Week 1-2)

- Custom category management UI
- Category leader assignments
- Update connect card review to use dynamic categories

### Phase 2: Background Checks (Week 3-4)

- Document upload functionality
- Email template editor
- "Send background check info" action implementation

### Phase 3: Notifications (Week 5-6)

- Leader notification templates
- "Send message to leader" action implementation
- SMS integration (if church has GHL)

### Phase 4: Defaults & Automation (Week 7-8)

- Default workflow settings
- Auto-assignment rules
- Batch processing improvements

## Dependencies

**Before Starting:**

- Complete volunteer management feature (current worktree)
- Ensure team management supports category assignments
- Verify S3 document storage is production-ready

**Parallel Work:**

- Can work alongside member management feature
- Doesn't block prayer management or other features

## Success Criteria

- [ ] Churches can customize volunteer categories
- [ ] Background check documents upload and send correctly
- [ ] Leader notifications send when checkbox is checked
- [ ] Settings UI is intuitive for non-technical church staff
- [ ] All settings properly scoped by organizationId (multi-tenant)
- [ ] Settings changes reflected immediately in review queue

## Notes

- This feature is substantial - likely 6-8 weeks of work
- Should be its own worktree: `feature/volunteer-settings`
- May need dedicated UX review for church staff usability
- Consider building settings in phases (categories first, then docs, etc.)
- Document all default values and migration strategy

---

**Next Steps:**

1. Complete volunteer management feature in current worktree
2. User test current volunteer workflow with pilot church
3. Gather feedback on needed customizations
4. Create worktree and begin Phase 1 (Categories & Leaders)
