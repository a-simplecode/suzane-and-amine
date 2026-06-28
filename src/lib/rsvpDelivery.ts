import type { Rsvp } from "@/lib/rsvp";

// Human-readable summary used for the WhatsApp message and server logs.
export function formatRsvpText(rsvp: Rsvp, dateLabel: string): string {
  const lines = [
    rsvp.attending ? "🎉 New RSVP — Attending" : "💌 New RSVP — Regrets",
    `Headcount: ${rsvp.headcount}`,
  ];
  if (rsvp.names.length) {
    lines.push(`Guests: ${rsvp.names.join(", ")}`);
  }
  if (rsvp.message) {
    lines.push(`Message: ${rsvp.message}`);
  }
  lines.push(dateLabel);
  return lines.join("\n");
}

// Parses a comma-separated list of phone numbers (e.g. recipients or a single
// "from"). Numbers keep their leading "+". Blank entries are dropped.
export function parsePhoneList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

// Ensures a number is in Twilio's WhatsApp channel form: "whatsapp:+<digits>".
export function toWhatsappAddress(phone: string): string {
  const p = phone.trim();
  return p.startsWith("whatsapp:") ? p : `whatsapp:${p}`;
}

export function twilioEndpoint(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
}

// Builds the x-www-form-urlencoded body for one Twilio WhatsApp message.
export function twilioMessageBody(from: string, to: string, text: string): URLSearchParams {
  return new URLSearchParams({
    From: toWhatsappAddress(from),
    To: toWhatsappAddress(to),
    Body: text,
  });
}

// HTTP Basic auth header value for the Twilio REST API.
export function twilioAuthHeader(accountSid: string, authToken: string): string {
  const encoded = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  return `Basic ${encoded}`;
}
