import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getInvite } from "@/lib/invites";

type Body = {
  slug?: string;
  count?: number;
  names?: string[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const count = Number.isFinite(body.count) ? Number(body.count) : -1;
  const names = Array.isArray(body.names)
    ? body.names.filter((n): n is string => typeof n === "string").map((n) => n.trim())
    : [];

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const invite = getInvite(slug);
  if (!invite) {
    return NextResponse.json({ error: "Unknown slug" }, { status: 404 });
  }

  if (count < 0 || count > invite.max) {
    return NextResponse.json({ error: "Invalid count" }, { status: 400 });
  }

  if (count > 0 && names.filter((n) => n.length > 0).length !== count) {
    return NextResponse.json({ error: "Names missing" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const dest = process.env.RSVP_DEST_EMAIL;

  if (!apiKey || !dest) {
    console.warn("[rsvp] Missing RESEND_API_KEY or RSVP_DEST_EMAIL — logging payload only");
    console.log("[rsvp] payload:", { slug, count, names, label: invite.label });
    return NextResponse.json({ ok: true, queued: true });
  }

  const resend = new Resend(apiKey);

  const lines = [
    `Slug: ${slug}`,
    `Label: ${invite.label}`,
    `Count: ${count}`,
    "",
    "Names:",
    ...(count > 0 ? names.map((n, i) => `  ${i + 1}. ${n}`) : ["  (no attendees — they declined)"]),
  ];

  try {
    await resend.emails.send({
      from: "RSVP <onboarding@resend.dev>",
      to: dest,
      subject: `RSVP — ${invite.label} — ${count} guests`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("[rsvp] resend failed", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
