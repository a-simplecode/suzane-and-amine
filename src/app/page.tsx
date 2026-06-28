import type { Metadata } from "next";
import { EVENT } from "@/data/event";
import { Hero } from "@/components/sections/Hero";
import { Story } from "@/components/sections/Story";
import { InvitationCards } from "@/components/sections/InvitationCards";
import { JourneyMap } from "@/components/sections/JourneyMap";
import { Countdown } from "@/components/sections/Countdown";
import { Rsvp } from "@/components/sections/Rsvp";
import { Closing } from "@/components/sections/Closing";

const title = `${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} · Two places, one love`;

export const metadata: Metadata = {
  title,
  description: `Two places. One love. One forever. Celebrate the wedding of ${EVENT.coupleNames[0]} & ${EVENT.coupleNames[1]} — Vancouver to Beirut, ${EVENT.dateLabel}.`,
  openGraph: { title, type: "website" },
};

export default function Page() {
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
