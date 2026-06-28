import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseRsvp } from "@/lib/rsvp";
import { EVENT } from "@/data/event";

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

  const { headcount, names, message, attending } = parsed.value;
  const subject = attending
    ? `RSVP: ${names[0]} (+${headcount - 1}) is coming 🎉`
    : `RSVP: regrets`;
  const text = [
    `Attending: ${attending ? "Yes" : "No"}`,
    `Headcount: ${headcount}`,
    names.length ? `Guests:\n${names.map((n) => `  - ${n}`).join("\n")}` : "",
    message ? `Message: ${message}` : "",
    ``,
    `For: ${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · ${EVENT.dateLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  // If email isn't configured (e.g. local/dev), accept the RSVP without sending.
  if (!apiKey) {
    console.log("[rsvp] (email not configured) ", text);
    return NextResponse.json({ ok: true, queued: true });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RSVP_FROM_EMAIL ?? "onboarding@resend.dev",
      to: process.env.RSVP_TO_EMAIL ?? "amine@quandri.io",
      subject,
      text,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: "Email failed to send." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Email failed to send." }, { status: 502 });
  }
}
