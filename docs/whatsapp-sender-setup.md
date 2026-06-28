# WhatsApp Permanent Sender Setup (Twilio + Meta)

Goal: replace the Twilio **sandbox** (72h re-arm limit) with a real WhatsApp
**Business sender** so RSVP alerts reach Amine + Suzane reliably, anytime.

Recipients (unchanged): +96176466341, +96179174361
Sender: a NEW dedicated number (keeps personal/business WhatsApp untouched).

## Status checklist

- [ ] 1. Meta Business Manager account created
- [ ] 2. Business verification submitted to Meta
- [ ] 3. Twilio phone number purchased (SMS + WhatsApp capable)
- [ ] 4. WhatsApp sender registered in Twilio (links Twilio ↔ Meta WABA)
- [ ] 5. Display name approved by Meta
- [ ] 6. Message template created + approved by Meta
- [ ] 7. Code switched from free-text Body → approved template (ContentSid)
- [ ] 8. `TWILIO_WHATSAPP_FROM` env updated to the new sender on Vercel
- [ ] 9. Live end-to-end test → both phones receive

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
