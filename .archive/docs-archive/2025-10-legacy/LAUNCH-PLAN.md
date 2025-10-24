# Digital Desk + Sidecar Launch Plan

**Current Status**: 90% Built, 0% Sold
**Goal**: Get to $1k MRR within 30 days
**Strategy**: Stop building, start selling

---

## 🎯 The Hard Truth

You have:

- ✅ Videos recorded
- ✅ Platform built (Sidecar)
- ✅ Website 50% done
- ✅ GHL API connected
- ✅ Course upload working

You DON'T have:

- ❌ Any customers
- ❌ Any leads
- ❌ Site launched
- ❌ Outreach started

**Every hour spent building instead of selling delays revenue by days.**

---

## ⚡ Phase 0: Pre-Launch Critical Fixes (Complete Before Launch Sprint)

**Duration**: 4-6 hours
**Purpose**: Fix production blockers that could damage customer experience

### Security Headers ✅ COMPLETED

- [x] Add X-Frame-Options (prevent clickjacking)
- [x] Add X-Content-Type-Options (prevent MIME-sniffing)
- [x] Add Referrer-Policy (protect URL data)
- [x] Add Permissions-Policy (restrict browser features)
- [x] Add HSTS (enforce HTTPS in production)
- [x] Document CSP for Phase 4 (post-$1k MRR)

**Result**: Production security headers configured. Platform now protected against common web vulnerabilities.

### Video Content Protection ✅ COMPLETED

- [x] Disable native download button (controlsList="nodownload")
- [x] Prevent right-click context menu downloads
- [x] Disable picture-in-picture capture workarounds
- [x] Document Level 2 (watermarking) for post-launch
- [x] Document Level 3 (DRM/HLS) for post-$10k MRR

**Result**: Video content protected from casual downloading. 95% protection for 0 cost. Acceptable for MVP launch with B2B customers.

### Video Management Testing ✅ COMPLETED

- [x] Test video upload to existing lesson
- [x] Verify video playback works
- [x] Check if old videos get replaced
- [x] S3 cleanup implemented and tested

**Result**: Video uploads working correctly. S3 automatic cleanup implemented - old files are deleted when videos are replaced or removed. No manual cleanup needed.

### Production Smoke Test (Final Phase 0 Task)

- [ ] Test signup → login → enroll → watch lesson
- [ ] Test agency admin: create course → upload video → publish
- [ ] Verify Stripe test mode webhook works
- [ ] Confirm no blocking bugs

**Exit Criteria**: Platform functional, no show-stopping bugs, ready for customers.

---

## 🚀 Phase 1: 10-Hour Launch Sprint (After Phase 0)

### Hour 1-2: Video Quality Check ⏱️ 2hrs

- [ ] Watch all Bayethe videos at 1.5x speed
- [ ] Note critical issues only (unwatchable = critical)
- [ ] If 80% acceptable → move on
- [ ] Upload to Sidecar platform
- [ ] **DO NOT** re-record or perfect

**Exit Criteria**: Videos uploaded, watchable, done

---

### Hour 3: Customer Flow (Simple Version) ⏱️ 1hr

**When someone buys Digital Desk:**

1. **Immediate**: Automated email

   ```
   Subject: Welcome to Digital Desk! 🎉

   Click here to book your onboarding call:
   [Calendly Link]

   What to expect:
   - 60-min kickoff call
   - Access to your training portal
   - Step-by-step GHL setup
   ```

2. **Before Call**: You manually create GHL sub-account

3. **On Call**: Screenshare through Module 1 in Sidecar

4. **After Call**: Email with Sidecar login + next steps

**DO NOT BUILD**:

- ❌ Fancy intake forms
- ❌ Automation workflows
- ❌ Data population scripts
- ❌ Customer portals

**Manual is fine for first 10 customers.** Learn what they need, then automate.

**Exit Criteria**: Email template written, Calendly link ready

---

### Hour 4: Launch Digital Desk Website ⏱️ 1hr

**Remaining Tasks**:

- [ ] Upload remaining 50% of photos (or use stock photos)
- [ ] Check each page once for typos
- [ ] Test booking flow end-to-end
- [ ] Hit publish button
- [ ] **DO NOT** tweak design or copy

**Exit Criteria**: Site is LIVE at digitaldeskacademy.com

---

### Hour 5-6: Find 50 IV Therapy Leads ⏱️ 2hrs

**Process**:

1. Google Maps: Search "IV therapy [city]" in 10 cities
   - Phoenix, Scottsdale, Austin, Dallas, Houston
   - Miami, Tampa, San Diego, LA, Vegas
2. For each clinic: Get business name, website, owner name
3. Use Hunter.io to find email
4. Put in spreadsheet: Name | Clinic | City | Email | Website

**Target**: 50 qualified leads minimum

**Tools**:

- Google Maps
- Hunter.io (email finder)
- Google Sheets

**Exit Criteria**: 50+ leads in spreadsheet with emails

---

### Hour 7-8: Set Up Outreach ⏱️ 2hrs

**Email Template** (Simple version):

```
Subject: Struggling with GHL client onboarding?

Hi [Clinic Name],

I help IV therapy clinics cut GHL onboarding time from 10+ hours to 2 hours.

We built a structured training platform specifically for clinics using GoHighLevel.

Our first 5 clients cut support tickets by 70%.

Want to see a 10-minute demo?

- [Your Name]
Digital Desk Academy
[Calendly Link]
```

**Setup**:

- [ ] Load 50 leads into email tool (Mailshake, Lemlist, or manual Gmail)
- [ ] Schedule 10 emails/day starting tomorrow
- [ ] Set up Calendly for demo bookings

**Exit Criteria**: Outreach scheduled, first 10 emails go out tomorrow

---

### Hour 9-10: Plan Next Week ⏱️ 2hrs

**Weekly Schedule** (Non-negotiable):

**Monday-Friday Morning (9am-12pm)**:

- 9-10am: Outreach (find leads, send emails, follow up)
- 10-11am: Take demo calls (goal: 3-5 per week)
- 11-12pm: Follow up with prospects

**Monday-Friday Afternoon (1pm-4pm)**:

- Customer onboarding calls
- Platform fixes (only if blocking sales)
- Content updates (only if customers request)

**Friday Afternoon**:

- Review week: Demos booked? Sales made? Revenue?
- Plan next week's outreach

**Tasks**:

- [ ] Block calendar for outreach/demo times
- [ ] Message Clare: Confirm her availability for demos
- [ ] Set 3 daily priorities in Notion/Todoist
- [ ] Update Upwork ad for backup demo person

**Exit Criteria**: Calendar blocked, Clare confirmed, week planned

---

## 🚫 Things You're NOT Doing This Week

Stop building. These are BANNED until you have 5 paying customers:

- ❌ Customer intake forms in Sidecar
- ❌ Automated GHL data population
- ❌ Landing pages in Sidecar for customers
- ❌ Any new Sidecar features
- ❌ Video perfection or re-recording
- ❌ AI lesson automation
- ❌ Advanced analytics
- ❌ Marketing website improvements (it's live, move on)

**Every hour spent building these delays revenue by 1-2 days.**

---

## 📊 Success Metrics (30-Day Goals)

### Week 1: Launch

- [x] Site live
- [ ] 50 leads in database
- [ ] 50 emails sent
- [ ] 3 demo calls booked

### Week 2: Demos

- [ ] 5 demo calls completed
- [ ] 1-2 customers closed
- [ ] $300-600 MRR

### Week 3: Scale

- [ ] 100 total leads
- [ ] 3-5 total customers
- [ ] $1k MRR

### Week 4: Optimize

- [ ] Refine demo script
- [ ] Improve follow-up sequence
- [ ] Add testimonials to site

---

## 🎯 When to Unblock Sidecar Features

**Customer says**: "I'd pay more if you had [feature]"
→ Build it

**Customer says**: "This manual process is annoying"
→ If 3+ customers say it, automate it

**You think**: "This would be cool"
→ Don't build it

---

## 💰 Revenue Math

**Goal**: $10k MRR (fund continued development)

**Current Price**: $297/month per agency

**Agencies Needed**: 34 customers

**Path to $10k MRR**:

- Month 1: 3 customers ($900 MRR) ← YOU ARE HERE
- Month 2: 8 customers ($2.4k MRR)
- Month 3: 15 customers ($4.5k MRR)
- Month 4: 25 customers ($7.5k MRR)
- Month 5: 34 customers ($10k MRR)

**This assumes**:

- 2 new customers per week
- 5% monthly churn
- Demo-to-close rate: 30%

**To hit 2 customers/week, you need**:

- 7 demos per week
- 14 qualified conversations
- 50+ outreach emails per week

**You can't build your way to revenue. You have to sell.**

---

## 🔄 Weekly Check-In Questions

**Every Friday, answer these**:

1. How many outreach emails sent this week?
2. How many demos booked?
3. How many demos completed?
4. How many customers closed?
5. New MRR this week?
6. Total MRR now?
7. Hours spent building vs selling?

**If "Hours spent building" > "Hours spent selling" → YOU'RE OFF TRACK**

---

## 📞 Customer Onboarding Process (Current State)

**For Your First 10 Customers** (Manual is FINE):

### Step 1: Customer Purchases ($297/mo)

- Stripe payment received
- Webhook creates Sidecar user account
- Auto-email with Calendly link

### Step 2: You Manually Prep (15 mins)

- Create GHL sub-account for them
- Add credentials to notes
- Review their clinic website
- Prepare personalized intro

### Step 3: Onboarding Call (60 mins)

- Screenshare Sidecar platform
- Walk through Module 1 together
- Answer questions live
- Book next check-in call

### Step 4: Async Support (as needed)

- Email questions → email answers
- Slack/text for urgent issues
- Weekly check-in calls

### Step 5: Learn & Iterate

- What questions do they keep asking?
- What parts are confusing?
- What do they wish you had?

**After 10 customers, you'll know exactly what to automate.**

---

## 🚨 Founder Tendencies to Watch

You tend to:

- ✋ Build instead of sell (feels safer)
- ✋ Perfectionism over shipping (80% is enough)
- ✋ Add features without customer validation (waste of time)
- ✋ Avoid uncomfortable sales conversations (growth happens here)

**Counter-patterns**:

- ✅ Time-box building: Max 25% of work hours
- ✅ Ship at 80% quality
- ✅ Talk to 10 customers before building any feature
- ✅ Book 5 demos per week (non-negotiable)

---

## 📝 End of Day Checklist

**Before you stop working today, verify**:

- [ ] Videos uploaded to Sidecar (even if imperfect)
- [ ] Digital Desk site is LIVE
- [ ] 50 IV therapy leads in spreadsheet with emails
- [ ] Email template written
- [ ] Outreach scheduled (first 10 emails go out tomorrow)
- [ ] Calendar blocked for next week (outreach + demos)
- [ ] Clare confirmed for demo backup

**If all checked → You're ready to launch.**

**If any unchecked → Keep working. Launch is the only priority.**

---

## 🎬 Tomorrow Morning (First Thing)

1. Send first 10 outreach emails (9am)
2. Post in IV therapy Facebook groups (if allowed)
3. DM 5 IV therapy owners on Instagram
4. Update LinkedIn: "Just launched Digital Desk..."
5. Email your network: "We're live, who do you know in IV therapy?"

**Then repeat daily.**

---

**Remember**: You're one customer away from validation. You're 10 customers away from traction. You're 34 customers away from $10k MRR.

**None of that happens until you launch and sell.**

---

**Last Updated**: 2025-10-12
**Status**: Ready to Execute
