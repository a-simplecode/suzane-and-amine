"use client";

import dynamic from "next/dynamic";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/invites";
import { detectTier, type Tier } from "@/lib/quality";
import { BEATS } from "./three/timeline";
import { Countdown } from "./Countdown";
import { FallbackScene } from "./FallbackScene";
import { MusicToggle } from "./MusicToggle";
import { RsvpForm } from "./RsvpForm";
import { ThankYou } from "./ThankYou";
import { VenueCard } from "./VenueCard";

const Experience = dynamic(() => import("./three/Experience"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-bg-beige" />,
});

type Beat = "story" | "rsvp" | "thanks";

const PENDING_KEY = "pending-rsvp";

export function Scene({ invite }: { invite: Invite }) {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    queueMicrotask(() => setTier(detectTier()));
  }, []);

  // offline RSVP retry — applies to both tiers
  useEffect(() => {
    const retry = async () => {
      try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return;
        const payload = JSON.parse(raw);
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) localStorage.removeItem(PENDING_KEY);
      } catch {}
    };
    window.addEventListener("focus", retry);
    return () => window.removeEventListener("focus", retry);
  }, []);

  if (tier === null) return <main className="min-h-dvh bg-bg-beige" />;
  if (tier === "lite") return <FallbackScene invite={invite} />;
  return <FullScene invite={invite} />;
}

function FullScene({ invite }: { invite: Invite }) {
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [beat, setBeat] = useState<Beat>("story");
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [venueSeen, setVenueSeen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const introDoneRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Before the intro the container is viewport-sized, so progress is
    // degenerate (reads 1) — ignore everything until the intro is done.
    if (!introDoneRef.current) return;
    setHintVisible(v < 0.03);
    if (v > 0.88) setVenueSeen(true);
  });

  // Build a [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] window from a
  // beat range so captions can never desync from timeline.ts BEATS.
  const win = (a: number, b: number): [number, number, number, number] => {
    const span = b - a;
    return [a + span * 0.05, a + span * 0.3, b - span * 0.25, b + span * 0.05];
  };
  const photosTextO = useTransform(scrollYProgress, win(BEATS.photos[0], BEATS.photos[1]), [0, 1, 1, 0]);
  const flightTextO = useTransform(scrollYProgress, win(BEATS.flight[0], BEATS.flight[1]), [0, 1, 1, 0]);
  const landTextO = useTransform(scrollYProgress, win(BEATS.land[0], BEATS.land[1]), [0, 1, 1, 0]);
  const driveTextO = useTransform(scrollYProgress, win(BEATS.drive[0], BEATS.drive[1]), [0, 1, 1, 0]);
  const arriveTextO = useTransform(scrollYProgress, win(BEATS.arrive[0], BEATS.arrive[1]), [0, 1, 1, 0]);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
    setMusicStarted(true);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    setMuted((m) => {
      const next = !m;
      if (audio) audio.muted = next;
      return next;
    });
  }, []);

  const openEnvelope = useCallback(() => {
    setOpened((o) => {
      if (!o) startMusic();
      return true;
    });
  }, [startMusic]);

  const handleIntroDone = useCallback(() => {
    introDoneRef.current = true;
    setIntroDone(true);
    setHintVisible(true);
    // guard against browser scroll restoration leaving us mid-story
    window.scrollTo(0, 0);
  }, []);

  // The container is always 600vh so scroll progress is never degenerate;
  // instead, scrolling itself is locked until the intro completes.
  useEffect(() => {
    if (introDone) return;
    // <html> is the actual scroller — locking body alone doesn't stop it.
    const html = document.documentElement.style;
    const body = document.body.style;
    const prevHtml = html.overflow;
    const prevBody = body.overflow;
    html.overflow = "hidden";
    body.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.overflow = prevHtml;
      body.overflow = prevBody;
    };
  }, [introDone]);

  return (
    <main className="relative text-bg-beige">
      <audio ref={audioRef} src="/perfect.mp3" preload="metadata" playsInline />
      <div className="grain-overlay" />

      <header className="pointer-events-none fixed top-0 inset-x-0 z-20 pt-[max(20px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto max-w-[min(92vw,520px)] px-4">
          <Countdown mode="corner" />
        </div>
        <div className="pointer-events-auto absolute top-[max(20px,env(safe-area-inset-top))] right-[max(20px,env(safe-area-inset-right))]">
          <MusicToggle visible={musicStarted} muted={muted} onToggle={toggleMute} />
        </div>
      </header>

      <div ref={containerRef} className="relative h-[600vh]">
        {/* fixed 3D layer */}
        <div className="fixed inset-0">
          <Experience
            label={invite.label}
            opened={opened}
            scrollProgress={scrollYProgress}
            onTapSeal={openEnvelope}
            onIntroDone={handleIntroDone}
          />
        </div>

        {/* tap hint (pre-open) */}
        {!opened && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+12vh)] inset-x-0 text-center text-xs uppercase tracking-[0.25em] pointer-events-none z-10"
          >
            tap the seal
          </motion.p>
        )}

        {/* scroll hint (post-intro, top of scroll) */}
        {hintVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5vh)] inset-x-0 flex flex-col items-center gap-2 pointer-events-none z-10"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold">scroll</span>
            <span className="scroll-hint-line" />
          </motion.div>
        )}

        {/* scroll-synced captions */}
        <motion.div
          style={{ opacity: photosTextO }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] text-center pointer-events-none z-10 px-4"
        >
          <h1 className="font-display text-[clamp(2.2rem,9vw,4.5rem)] leading-tight">
            Suzane <span className="opacity-60">&amp;</span> Amine
          </h1>
          <p className="mt-1 text-[clamp(0.6rem,2.4vw,0.8rem)] uppercase tracking-[0.3em] text-accent-gold">
            are getting married
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: flightTextO }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] text-center pointer-events-none z-10 px-4"
        >
          <p className="font-display text-[clamp(1.4rem,5vw,2.4rem)]">
            From Vancouver, with love
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: landTextO }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] text-center pointer-events-none z-10 px-4"
        >
          <p className="font-display text-[clamp(1.4rem,5vw,2.4rem)]">
            First stop — Suzane&apos;s home
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: driveTextO }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] text-center pointer-events-none z-10 px-4"
        >
          <p className="font-display text-[clamp(1.4rem,5vw,2.4rem)]">
            Then together, by wedding car
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: arriveTextO }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+5.5rem)] text-center pointer-events-none z-10 px-4"
        >
          <p className="font-display text-[clamp(1.4rem,5vw,2.4rem)]">
            Nahr El Kalb, Lebanon
          </p>
          <p className="mt-1 text-[clamp(0.6rem,2.4vw,0.8rem)] uppercase tracking-[0.25em] text-accent-gold">
            August 29, 2026
          </p>
        </motion.div>

        {/* final DOM section — last 100vh of the container. Mounted only
            after the intro: before that the container is viewport-sized,
            so this section would cover (and block taps on) the envelope. */}
        {introDone && (
          <div className="absolute inset-x-0 bottom-0 min-h-dvh z-10">
            <div className="min-h-dvh w-full bg-gradient-to-b from-transparent via-bg-beige/80 to-bg-beige grid place-items-center px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
              <VenueCard visible={venueSeen} onRsvpClick={() => setBeat("rsvp")} />
            </div>
          </div>
        )}
      </div>

      <RsvpForm
        visible={beat === "rsvp"}
        slug={invite.slug}
        max={invite.max}
        onSubmitted={() => setBeat("thanks")}
      />
      <ThankYou visible={beat === "thanks"} />
    </main>
  );
}
