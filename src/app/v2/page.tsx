import type { Metadata } from "next";
import { EVENT } from "@/data/event";
import { Hero } from "@/components/v2/Hero";
import { Story } from "@/components/v2/Story";
import { InvitationCards } from "@/components/v2/InvitationCards";
import { JourneyMap } from "@/components/v2/JourneyMap";
import { Countdown } from "@/components/v2/Countdown";
import { Rsvp } from "@/components/v2/Rsvp";
import { Closing } from "@/components/v2/Closing";

const title = `${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · Two places, one love`;

export const metadata: Metadata = {
  title,
  description: `Two places. One love. One forever. Celebrate the wedding of ${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} — Vancouver to Beirut, ${EVENT.dateLabel}.`,
  openGraph: { title, type: "website" },
};

export default function V2Page() {
  return (
    <main>
      <Hero />
      <Story />
      <InvitationCards />
      <JourneyMap />
      <Countdown />
      <Rsvp />
      <Closing />
    </main>
  );
}
