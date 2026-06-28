"use client";
import { motion } from "framer-motion";
import { EVENT } from "@/data/event";
import { Sprig } from "@/components/botanicals/Sprig";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Sprig draw className="absolute left-2 top-10 w-28 opacity-70 sm:w-40" />
      <Sprig draw flip className="absolute right-2 top-16 w-28 opacity-70 sm:w-40" />

      <motion.p
        className="mb-6 text-sm uppercase tracking-[0.4em] text-deepsage"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Together with their families
      </motion.p>

      <motion.h1
        className="font-display text-6xl leading-none text-ink sm:text-8xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 70, damping: 14 }}
      >
        {EVENT.coupleNames[0]}
        <span className="mx-3 text-sage">&amp;</span>
        {EVENT.coupleNames[1]}
      </motion.h1>

      <motion.p
        className="mt-6 text-lg tracking-widest text-deepsage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 1 }}
      >
        {EVENT.dateLabel}
      </motion.p>

      <motion.div
        className="absolute bottom-8 flex flex-col items-center text-deepsage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.6 }, y: { repeat: Infinity, duration: 1.8 } }}
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <span aria-hidden>↓</span>
      </motion.div>
    </section>
  );
}
