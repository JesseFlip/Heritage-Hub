## Runbook: Add a Community Event to HeritageHub (Organizer Onboarding & Support)

**Owner:** HeritageHub Community Team | **Frequency:** As Needed (per organizer submission)
**Last Updated:** 2026-07-30 | **Last Run:** —

### Purpose
Help a community event organizer — of any language or technical skill level — publish an event to HeritageHub, and give the support team a consistent procedure to assist and troubleshoot. The friendly, translated version for organizers themselves is `organizer-guide.html` (English, Spanish, Hindi, Gujarati, Punjabi, Chinese, Vietnamese, Arabic). This runbook is the internal companion.

### Prerequisites
- [ ] HeritageHub is deployed and reachable (or running locally at `http://localhost:3000`).
- [ ] Supabase is configured (`.env.local`) so submissions persist — otherwise the form runs in demo mode and only previews.
- [ ] The organizer has an email address they can access right now (for the magic-link sign-in).
- [ ] The event's basics on hand: title, host name, date, start/end time, venue name, full street address, and ideally an official page link.

### Procedure

#### Step 1: Open the submission form
```
Home screen → tap “add an event” in the info notice, or go directly to /submit
```
**Expected result:** The "Add your event" screen opens (sign-in prompt if not signed in).
**If it fails:** If the link 404s, confirm the deploy includes the `/submit` route (`npm run build` lists it). Share the direct `/submit` URL.

#### Step 2: Sign in (passwordless)
```
Enter email → “Email me a sign-in link” → open the email → tap the link → return to /submit
```
**Expected result:** The organizer lands back on the form, now signed in.
**If it fails:** Email not arriving → check spam; confirm the address; in Supabase → Authentication → check the email provider/SMTP is configured and rate limits aren't hit. Google/Apple sign-in can be enabled in Supabase → Auth → Providers to skip email.

#### Step 3: Enter the basics
```
Title  +  Organizer/hosting group  +  Categories (tap all that apply)
```
**Expected result:** Title and organizer filled; at least one category highlighted.
**If it fails:** "Pick at least one category" on submit → at least one category chip must be selected.

#### Step 4: Set date & time
```
Date (calendar)  +  Start time  +  End time
```
**Expected result:** A valid future date with start before end.
**If it fails:** Past dates won't appear in the feed (the `events_nearby` RPC filters `ends_at >= now()`). Use an upcoming date.

#### Step 5: Add location and drop the pin
```
Venue name  +  Full street address  →  tap “Find on map”
```
**Expected result:** Green "✓ Found: …" confirmation; latitude/longitude captured.
**If it fails:** "Couldn't find that address" → simplify to `street, city, state ZIP`; verify spelling; if still failing, the geocoder (OpenStreetMap Nominatim) may not know a brand-new venue — use a nearby known address or the cross-streets.

#### Step 6: Add details and publish
```
Description + Admission (e.g. “Free”) + RSVP link + Official page link + optional itinerary rows → “Publish event”
```
**Expected result:** Success screen ("Event submitted!"); the event appears in the feed sorted by distance. In demo mode it shows a preview only.
**If it fails:** A red error banner shows the exact validation or database message — fix the named field and retry. RLS errors mean the session expired (repeat Step 2).

### Verification
- [ ] Event appears on the Discover feed within the chosen radius of its location.
- [ ] Opening the event shows correct date/time (in the viewer's local timezone), venue, and the "View official event page" link.
- [ ] "Add to Calendar" downloads a `.ics` with the right start/end.

### Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Sign-in email never arrives | SMTP/provider not set or in spam | Configure Supabase Auth email/SMTP; check spam; try Google/Apple provider |
| "Tap Find on map to locate the address" | No lat/lng captured | Complete Step 5 until the green ✓ appears |
| Event not in the feed | Date is in the past, or outside radius | Use a future date; confirm the pin is within the searcher's radius |
| "new row violates row-level security" | Session expired / not signed in | Re-run Step 2 (sign in again) |
| Submission only previews, never saves | Demo mode (no Supabase keys) | Add `.env.local` keys and redeploy |
| Address geocodes to the wrong spot | Ambiguous address | Add city/state/ZIP; or pick a nearby known landmark address |

### Rollback
An organizer can hide/remove an event they created: sign in with the same email; the owner RLS policies (`events_owner_update` / `events_owner_delete`) allow updating `published=false` or deleting it. Support can unpublish any event by setting `published=false` in the `events` table.

### Escalation
| Situation | Contact | Method |
|-----------|---------|--------|
| Auth/email delivery broken for many users | HeritageHub Eng on-call | Supabase status + project logs |
| Suspected spam / inappropriate listing | Community Moderation | Set `published=false`, then review |
| Geocoding consistently wrong in a city | HeritageHub Eng | File issue; consider a paid geocoder key |

### History
| Date | Run By | Notes |
|------|--------|-------|
| 2026-07-30 | Community Team | Initial runbook created alongside the 8-language organizer guide. |
