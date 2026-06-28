"use client";
import { motion, useReducedMotion } from "framer-motion";
import { EVENT } from "@/data/event";
import { OliveLeaves } from "./motion/OliveLeaves";
import { Sprig } from "@/components/botanicals/Sprig";

const [BRIDE, GROOM] = EVENT.coupleNames;

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Per-letter stagger for the names line.
function StaggerName({ text, baseDelay }: { text: string; baseDelay: number }) {
  return (
    <span className="inline-block">
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: baseDelay + i * 0.06,
            type: "spring",
            stiffness: 90,
            damping: 14,
          }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  // Curtain timing: panels part, then content reveals.
  const reveal = reduce ? 0 : 1.1;

  return (
    <section
      id="v2-hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-6 text-center"
    >
      <OliveLeaves />

      {/* Cinematic curtain — two beige panels easing apart on load. */}
      {!reduce && (
        <>
          <motion.div
            className="absolute inset-y-0 left-0 z-30 w-1/2 bg-cream"
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            style={{ boxShadow: "8px 0 30px rgba(46,51,43,0.08)" }}
          />
          <motion.div
            className="absolute inset-y-0 right-0 z-30 w-1/2 bg-cream"
            initial={{ x: 0 }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            style={{ boxShadow: "-8px 0 30px rgba(46,51,43,0.08)" }}
          />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center">
        <motion.p
          className="mb-6 text-xs uppercase tracking-[0.4em] text-sage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reveal, duration: 1 }}
        >
          Together with their families
        </motion.p>

        <h1 className="font-display text-5xl leading-tight text-deepsage sm:text-7xl md:text-8xl">
          <StaggerName text={BRIDE} baseDelay={reveal + 0.1} />
          <motion.span
            className="mx-3 inline-block text-sage sm:mx-5"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reveal + 0.5, type: "spring", stiffness: 120 }}
          >
            &amp;
          </motion.span>
          <StaggerName text={GROOM} baseDelay={reveal + 0.7} />
        </h1>

        <motion.div
          className="mt-8 flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reveal + 1.2, duration: 1 }}
        >
          <span className="h-px w-10 bg-sage/60" />
          <p className="text-sm uppercase tracking-[0.3em] text-ink/70">
            {EVENT.dateLabel}
          </p>
          <span className="h-px w-10 bg-sage/60" />
        </motion.div>

        <motion.p
          className="mt-10 font-display text-2xl italic text-ink/80 sm:text-3xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reveal + 1.5, duration: 1.1 }}
        >
          Two places. One love. One forever.
        </motion.p>

        <motion.button
          type="button"
          onClick={() => smoothScrollTo("v2-rsvp")}
          className="mt-12 rounded-full border border-deepsage bg-deepsage px-9 py-3.5 text-sm uppercase tracking-[0.2em] text-cream transition-colors duration-300 hover:bg-transparent hover:text-deepsage"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reveal + 1.9, duration: 0.9 }}
        >
          Join Our Celebration
        </motion.button>
      </div>

      <Sprig className="absolute bottom-6 left-6 z-10 h-20 w-20 opacity-50 sm:h-28 sm:w-28" />
      <Sprig
        flip
        className="absolute bottom-6 right-6 z-10 h-20 w-20 opacity-50 sm:h-28 sm:w-28"
      />

      <motion.div
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-[0.65rem] uppercase tracking-[0.3em] text-sage"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.3, 1] }}
        transition={{ delay: reveal + 2.4, duration: 2.5, repeat: Infinity }}
      >
        Scroll
      </motion.div>
    </section>
  );
}
