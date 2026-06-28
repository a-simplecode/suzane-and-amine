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

export type WhatsappRecipient = { phone: string; apikey: string };

// Parses "phone:apikey,phone:apikey" into structured recipients.
// Phone digits and the apikey are split on the FIRST colon only.
export function parseWhatsappRecipients(raw: string | undefined): WhatsappRecipient[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      if (idx === -1) return null;
      const phone = entry.slice(0, idx).trim();
      const apikey = entry.slice(idx + 1).trim();
      if (!phone || !apikey) return null;
      return { phone, apikey };
    })
    .filter((r): r is WhatsappRecipient => r !== null);
}

// Builds the CallMeBot WhatsApp send URL for one recipient.
export function callMeBotUrl(r: WhatsappRecipient, text: string): string {
  const params = new URLSearchParams({
    phone: r.phone,
    text,
    apikey: r.apikey,
  });
  return `https://api.callmebot.com/whatsapp.php?${params.toString()}`;
}
