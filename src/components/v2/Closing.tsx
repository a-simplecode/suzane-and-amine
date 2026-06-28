import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { Sprig } from "@/components/botanicals/Sprig";
import { Monogram } from "@/components/botanicals/Monogram";

export function Closing() {
  return (
    <section className="relative overflow-hidden bg-cream px-6 py-32 text-center">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <Sprig draw className="mx-auto h-28 w-28" />
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="mt-6 font-display text-4xl italic text-deepsage sm:text-5xl">
            From two cities to one forever.
          </h2>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-6 leading-relaxed text-ink/70">
            Thank you for being part of our story. We cannot wait to begin this
            next chapter surrounded by the people we love.
          </p>
        </Reveal>
        <Reveal delay={0.45}>
          <Monogram className="mx-auto mt-12 h-14 w-28" />
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-sage">
            {EVENT.dateLabel}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
