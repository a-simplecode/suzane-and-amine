import { Hero } from "@/components/sections/Hero";
import { Story } from "@/components/sections/Story";
import { Journey } from "@/components/sections/Journey";
import { SaveTheDate } from "@/components/sections/SaveTheDate";
import { Schedule } from "@/components/sections/Schedule";
import { Venue } from "@/components/sections/Venue";
import { Details } from "@/components/sections/Details";
import { Rsvp } from "@/components/sections/Rsvp";
import { Footer } from "@/components/sections/Footer";

export default function Page() {
  return (
    <main>
      <Hero />
      <Story />
      <Journey />
      <SaveTheDate />
      <Schedule />
      <Venue />
      <Details />
      <Rsvp />
      <Footer />
    </main>
  );
}
