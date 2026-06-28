"use client";
import { useState } from "react";
import Image from "next/image";
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { Sprig } from "@/components/botanicals/Sprig";

// One photo frame. Falls back to an elegant placeholder until the real
// image is dropped into /public/story. `onError` swaps to the fallback
// if the file isn't there yet.
function PhotoFrame({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-sage/30 bg-cream shadow-sm">
      {!failed && (
        <Image
          src={src}
          alt={label}
          fill
          sizes="(max-width: 768px) 90vw, 40vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-sage/8 px-6 text-center">
          <Sprig className="w-12" />
          <span className="text-xs uppercase tracking-[0.35em] text-sage">{label}</span>
        </div>
      )}
    </div>
  );
}

export function Story() {
  return (
    <section className="relative overflow-hidden px-6 py-32 sm:py-40">
      <Reveal className="mx-auto mb-20 max-w-xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-sage">Our Story</p>
        <h2 className="font-display text-4xl text-ink sm:text-5xl">Two places. One love.</h2>
        <p className="mt-5 text-deepsage">A journey that began an ocean apart and ends at one altar.</p>
      </Reveal>

      <div className="relative mx-auto max-w-4xl">
        {/* the connecting thread down the timeline */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-sage/25 md:block" />

        <div className="flex flex-col gap-24 sm:gap-32">
          {EVENT.story.map((beat, i) => {
            const flip = i % 2 === 1;
            return (
              <div
                key={beat.title}
                className="grid items-center gap-8 md:grid-cols-2 md:gap-16"
              >
                {/* photo */}
                <div className={flip ? "md:order-2" : ""}>
                  <Parallax speed={0.12}>
                    <PhotoFrame src={beat.photo} label={beat.place} />
                  </Parallax>
                </div>

                {/* text */}
                <Reveal
                  delay={0.1}
                  className={flip ? "md:order-1 md:text-right" : ""}
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-sage">{beat.year}</p>
                  <h3 className="mt-3 font-display text-3xl text-ink sm:text-4xl">{beat.title}</h3>
                  <p className="mt-2 text-sm uppercase tracking-widest text-deepsage">{beat.place}</p>
                  <p className="mt-5 leading-relaxed text-ink/80">{beat.text}</p>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
