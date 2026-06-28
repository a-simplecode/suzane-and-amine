import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { Sprig } from "@/components/botanicals/Sprig";

export function Venue() {
  return (
    <section className="px-6 py-28 text-center">
      <Reveal>
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-sage/30 bg-cream px-8 py-12 shadow-sm">
          <Sprig className="mb-6 w-16" />
          <p className="mb-2 text-sm uppercase tracking-[0.4em] text-sage">The Venue</p>
          <h2 className="font-display text-4xl text-ink">{EVENT.venue.name}</h2>
          <p className="mt-2 text-deepsage">{EVENT.venue.area}</p>
          <a
            href={EVENT.venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 rounded-full border border-deepsage px-6 py-2 text-sm uppercase tracking-widest text-deepsage transition-colors hover:bg-deepsage hover:text-cream"
          >
            Open in Maps
          </a>
        </div>
      </Reveal>
    </section>
  );
}
