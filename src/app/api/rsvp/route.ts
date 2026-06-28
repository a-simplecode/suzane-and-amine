import { NextResponse } from "next/server";
import { parseRsvp } from "@/lib/rsvp";
import {
  formatRsvpText,
  parsePhoneList,
  twilioEndpoint,
  twilioMessageBody,
  twilioAuthHeader,
} from "@/lib/rsvpDelivery";
import { EVENT } from "@/data/event";

// Public, unauthenticated endpoint. No rate limiting — acceptable for a
// low-traffic invite-only wedding site. RSVPs are delivered two ways:
//   1. Appended as a row to a Google Sheet (durable record).
//   2. Pushed as a WhatsApp message via Twilio (best-effort notification).
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
  const text = formatRsvpText(
    rsvp,
    `${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · ${EVENT.dateLabel}`,
  );

  const sheetUrl = process.env.SHEET_WEBHOOK_URL;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
  const twilioTo = parsePhoneList(process.env.TWILIO_WHATSAPP_TO);
  const twilioReady = Boolean(twilioSid && twilioToken && twilioFrom && twilioTo.length);

  // Nothing configured (e.g. local/dev): accept and log, don't fail the guest.
  if (!sheetUrl && !twilioReady) {
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

  // 2. WhatsApp via Twilio — best-effort. Failures are logged, never block.
  if (twilioReady) {
    const endpoint = twilioEndpoint(twilioSid!);
    const auth = twilioAuthHeader(twilioSid!, twilioToken!);
    await Promise.allSettled(
      twilioTo.map(async (to) => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: auth,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: twilioMessageBody(twilioFrom!, to, text).toString(),
          });
          if (!res.ok) {
            console.error("[rsvp] whatsapp failed", to, res.status, await res.text());
          }
        } catch (e) {
          console.error("[rsvp] whatsapp error", to, e);
        }
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
