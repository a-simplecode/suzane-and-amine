# WhatsApp Permanent Sender Setup (Twilio + Meta)

Goal: replace the Twilio **sandbox** (72h re-arm limit) with a real WhatsApp
**Business sender** so RSVP alerts reach Amine + Suzane reliably, anytime.

Recipients (unchanged): +96176466341, +96179174361
Sender: a NEW dedicated number (keeps personal/business WhatsApp untouched).

## Status: COMPLETE ✅ (2026-06-29)

- [x] 1. Meta Business Manager account created (Biz ID 237681843560033)
- [x] 2. (Business verification not required for low-volume / 2 recipients)
- [x] 3. Twilio number purchased: +1 825 793-3151
- [x] 4. WhatsApp sender registered (WABA 1026548593203151); sender +15559581266
- [x] 5. Display name approved ("Amine"), sender status Online
- [x] 6. Template `rsvp_alert_v2` (HXe9352022e6e3e5887dac1c10186d184c) approved
- [x] 7. Code sends via approved template (ContentSid + single-line ContentVariables)
- [x] 8. `TWILIO_WHATSAPP_FROM=whatsapp:+15559581266` + `TWILIO_CONTENT_SID` set on Vercel
- [x] 9. Live end-to-end test → both phones received (one confirmed "read")

Note: WhatsApp template params cannot contain newlines/tabs (error 21656) —
buildRsvpVariables sanitizes to a single line.

## Phase 1 — what Amine does now

1. **Meta Business Manager**: https://business.facebook.com → create a business
   (name, your email). Then Settings → Business Info → start **verification**
   (needs business legal name / details; for an individual this can be limited —
   may need a registered business). This is the slowest gate.

2. **Buy a Twilio number**: Console → Phone Numbers → Buy a number. Pick one with
   **SMS + WhatsApp** capabilities. (~$1–15/mo depending on country.)

3. **Start WhatsApp Sender registration**: Console → Messaging → Senders →
   WhatsApp senders → "Create new sender". Follow the flow — it connects to your
   Meta Business / WhatsApp Business Account (WABA) and asks for a display name.

## What to send back

- The purchased Twilio number (e.g. +1XXXXXXXXXX)
- Confirmation Meta business verification is submitted
- The WhatsApp sender status when it reaches "approved"

## Phase 2 — what Claude does

- Author the RSVP alert **message template**, submit via Twilio for Meta approval.
- Once approved: update `src/app/api/rsvp/route.ts` to send the template
  (`ContentSid` + `ContentVariables`) instead of free-text `Body`.
- Update `TWILIO_WHATSAPP_FROM` on Vercel to the new sender, redeploy, test.

## Notes

- Business-initiated messages (our case: server alerts you on RSVP) REQUIRE an
  approved template. Free-text only works within 24h of an inbound message.
- The Google Sheet remains the durable record regardless of WhatsApp status.
- Current live setup = sandbox (From whatsapp:+14155238886) until this completes.
