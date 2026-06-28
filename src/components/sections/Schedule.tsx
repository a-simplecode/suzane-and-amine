"use client";
import { motion, useReducedMotion } from "framer-motion";
import { EVENT } from "@/data/event";
import { Reveal } from "@/components/motion/Reveal";
import { Sprig } from "@/components/botanicals/Sprig";

export function Schedule() {
  const reduced = useReducedMotion();
  return (
    <section className="relative bg-deepsage/5 px-6 py-28">
      <Sprig className="pointer-events-none absolute right-4 top-8 w-24 opacity-40" />
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="mb-14 text-center font-display text-4xl text-ink sm:text-5xl">
            The Day
          </h2>
        </Reveal>
        <ol className="relative border-l border-sage/40 pl-8">
          {EVENT.schedule.map((item, i) => (
            <motion.li
              key={`${item.time}-${item.title}`}
              className="relative mb-12 last:mb-0"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              whileInView={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 90, damping: 16 }}
            >
              <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-sage" />
              <p className="font-display text-2xl text-deepsage">{item.time}</p>
              <p className="text-lg text-ink">{item.title}</p>
              {item.note && <p className="text-sm text-sage">{item.note}</p>}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
