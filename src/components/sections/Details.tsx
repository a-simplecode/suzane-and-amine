import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";

export function Details() {
  return (
    <section className="bg-deepsage/5 px-6 py-28">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="mb-14 text-center font-display text-4xl text-ink sm:text-5xl">
            Good to Know
          </h2>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2">
          {EVENT.details.map((d, i) => (
            <Reveal key={d.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-sm uppercase tracking-widest text-sage">{d.label}</p>
                <p className="mt-2 text-lg text-ink">{d.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
