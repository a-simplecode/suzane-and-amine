import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { StoryArt, SCENES } from "./StoryArt";

export function Story() {
  return (
    <section id="v2-story" className="relative bg-cream px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-20 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-sage">Our Story</p>
          <h2 className="font-display text-4xl text-deepsage sm:text-5xl">
            Vancouver to Beirut
          </h2>
        </Reveal>

        <div className="relative">
          {/* Center spine (desktop). */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-sage/40 to-transparent md:block" />

          <ol className="space-y-20 md:space-y-28">
            {EVENT.story.map((beat, i) => {
              const left = i % 2 === 0;
              return (
                <li
                  key={i}
                  className="relative grid items-center gap-8 md:grid-cols-2 md:gap-16"
                >
                  {/* Spine node. */}
                  <span className="absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream bg-deepsage md:block" />

                  <Reveal
                    className={left ? "md:order-1" : "md:order-2"}
                    y={40}
                  >
                    <StoryArt scene={SCENES[i] ?? "west"} />
                  </Reveal>

                  <Reveal
                    className={`${left ? "md:order-2 md:text-left" : "md:order-1 md:text-right"}`}
                    y={40}
                    delay={0.1}
                  >
                    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-sage">
                      {beat.year} · {beat.place}
                    </p>
                    <h3 className="font-display text-3xl text-deepsage">{beat.title}</h3>
                    <p className="mt-4 leading-relaxed text-ink/75">{beat.text}</p>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
