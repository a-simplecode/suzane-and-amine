import { NextResponse } from "next/server";
import { parseRsvp } from "@/lib/rsvp";
import {
  formatRsvpText,
  parseWhatsappRecipients,
  callMeBotUrl,
} from "@/lib/rsvpDelivery";
import { EVENT } from "@/data/event";

// Public, unauthenticated endpoint. No rate limiting — acceptable for a
// low-traffic invite-only wedding site. RSVPs are delivered two ways:
//   1. Appended as a row to a Google Sheet (durable record).
//   2. Pushed as a WhatsApp message via CallMeBot (best-effort notification).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseRsvp(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const rsvp = parsed.value;
  const text = formatRsvpText(rsvp, `${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · ${EVENT.dateLabel}`);

  const sheetUrl = process.env.SHEET_WEBHOOK_URL;
  const recipients = parseWhatsappRecipients(process.env.WHATSAPP_RECIPIENTS);

  // Nothing configured (e.g. local/dev): accept and log, don't fail the guest.
  if (!sheetUrl && recipients.length === 0) {
    console.log("[rsvp] (delivery not configured)\n" + text);
    return NextResponse.json({ ok: true, queued: true });
  }

  // 1. Google Sheet — the durable record. If configured, it MUST succeed.
  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          attending: rsvp.attending ? "Yes" : "No",
          headcount: rsvp.headcount,
          names: rsvp.names.join(", "),
          message: rsvp.message,
        }),
      });
      if (!res.ok) {
        console.error("[rsvp] sheet append failed", res.status);
        return NextResponse.json(
          { ok: false, error: "Could not save your RSVP. Please try again." },
          { status: 502 },
        );
      }
    } catch (e) {
      console.error("[rsvp] sheet append error", e);
      return NextResponse.json(
        { ok: false, error: "Could not save your RSVP. Please try again." },
        { status: 502 },
      );
    }
  }

  // 2. WhatsApp — best-effort. Failures are logged, never block the guest.
  await Promise.allSettled(
    recipients.map(async (r) => {
      try {
        const res = await fetch(callMeBotUrl(r, text), { method: "GET" });
        if (!res.ok) console.error("[rsvp] whatsapp failed", r.phone, res.status);
      } catch (e) {
        console.error("[rsvp] whatsapp error", r.phone, e);
      }
    }),
  );

  return NextResponse.json({ ok: true });
}
