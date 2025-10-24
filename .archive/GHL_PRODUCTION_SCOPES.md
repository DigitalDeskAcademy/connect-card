# GoHighLevel Production OAuth Scopes

**For Production/Preview Environments**

## Required Scopes (16 Total)

### Core Access (3 scopes)

- `locations.readonly` - Read location details and settings
- `locations.write` - Update location data
- `users.readonly` - Get user information

### Module Verification Endpoints (8 scopes)

These scopes enable verification of onboarding module completion:

- `calendars.readonly` - **Module 1**: Verify calendar creation
- `socialplanner/account.readonly` - **Module 2**: Check connected social accounts
- `socialplanner/oauth.readonly` - **Module 2**: Verify OAuth status for Facebook/Instagram
- `payments/integration.readonly` - **Module 3**: Check Stripe payment integration status
- `phonenumbers.read` - **Module 4**: Verify phone number setup
- `workflows.readonly` - **Module 5**: Check MCTB (Missed Call Text Back) automation status
- `oauth.readonly` - **Module 7**: Verify GBP (Google Business Profile) connection
- `twilioaccount.read` - Additional phone/SMS verification (if needed)

### Progress Tracking (3 scopes)

Store and retrieve custom onboarding progress data:

- `locations/customFields.readonly` - Read custom field definitions
- `locations/customFields.write` - Create fields for tracking module completion
- `locations/customValues.write` - Update progress values per module

### Communication (Optional - 2 scopes)

Send automated messages for milestones/nudges:

- `conversations.write` - Send congratulations messages
- `conversations/message.write` - Automated course update notifications

## Module Verification Map

| Module | Verification Method             | Required Scope                                                   |
| ------ | ------------------------------- | ---------------------------------------------------------------- |
| 1      | Calendar exists                 | `calendars.readonly`                                             |
| 2      | Social account connected        | `socialplanner/account.readonly`, `socialplanner/oauth.readonly` |
| 3      | Stripe active                   | `payments/integration.readonly`                                  |
| 4      | Phone number added              | `phonenumbers.read`                                              |
| 5      | MCTB automation enabled         | `workflows.readonly`                                             |
| 6      | Mobile app login (no API check) | None - video completion only                                     |
| 7      | GBP connected                   | `oauth.readonly`                                                 |

## Setting Up Production OAuth App

1. Go to [GHL Marketplace](https://marketplace.gohighlevel.com/)
2. Create new OAuth app
3. Add **exactly** the 16 scopes listed above
4. Set redirect URI to: `https://your-preview-url.vercel.app/api/crm/callback`
5. Copy Client ID and Client Secret
6. Add to Vercel environment variables:
   - `GHL_CLIENT_ID`
   - `GHL_CLIENT_SECRET`
   - `GHL_REDIRECT_URI`

## Scope Differences: Dev vs Production

**Development (Current)**: 218 scopes (all available scopes for testing)
**Production (Recommended)**: 16 scopes (focused on actual needs)

## Why These Scopes?

✅ **Minimal but complete** - Only what we need for module verification
✅ **No unnecessary permissions** - Avoids requesting access we won't use
✅ **Scalable** - Can add more scopes later if features expand
✅ **Secure** - Reduces attack surface by limiting permissions
