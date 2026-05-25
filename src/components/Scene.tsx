"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/invites";
import { Countdown } from "./Countdown";
import { Envelope, ENVELOPE_TOTAL_MS } from "./Envelope";
import { InvitationCard } from "./InvitationCard";
import { MusicToggle } from "./MusicToggle";
import { PaperPlane } from "./PaperPlane";
import { RsvpForm } from "./RsvpForm";
import { ThankYou } from "./ThankYou";
import { VenueCard } from "./VenueCard";
import { WorldMap } from "./WorldMap";

type Beat =
  | "envelope"
  | "card"
  | "map"
  | "venue"
  | "rsvp"
  | "thanks";

const PENDING_KEY = "pending-rsvp";

type Props = {
  invite: Invite;
};

export function Scene({ invite }: Props) {
  const [beat, setBeat] = useState<Beat>("envelope");
  const [opened, setOpened] = useState(false);
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      setMusicStarted(true);
      return;
    }
    audio.volume = 0.5;
    audio.play().catch(() => {});
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
    if (beat !== "envelope" || opened) return;
    setOpened(true);
    startMusic();
    // Wait for the full envelope-open + card-emerge animation to play out
    // before swapping to the card beat, so the rising card stub hands off to
    // the real InvitationCard without a visible jump.
    setTimeout(() => setBeat("card"), ENVELOPE_TOTAL_MS);
  }, [beat, opened, startMusic]);

  useEffect(() => {
    if (beat !== "card") return;
    const id = setTimeout(() => setBeat("map"), 7500);
    return () => clearTimeout(id);
  }, [beat]);

  const handleArrived = useCallback(() => {
    setBeat((b) => (b === "map" ? "venue" : b));
  }, []);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-bg-beige text-ink-olive-deep">
      <audio
        ref={audioRef}
        src="/perfect.mp3"
        preload="auto"
        playsInline
        // TODO: ensure public/perfect.mp3 exists (Ed Sheeran). Music tap will silently fail otherwise.
      />

      <header className="pointer-events-none fixed top-0 inset-x-0 z-20 pt-5">
        <div className="pointer-events-auto mx-auto max-w-[min(92vw,520px)] px-4">
          <Countdown mode="corner" />
        </div>
        <div className="pointer-events-auto absolute top-5 right-5">
          <MusicToggle visible={musicStarted} muted={muted} onToggle={toggleMute} />
        </div>
      </header>

      <section className="relative min-h-dvh w-full grid place-items-center px-4">
        <AnimatePresence mode="sync">
          {beat === "envelope" && (
            <motion.div
              key="envelope"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              // Envelope handles its own fade/tip in the open animation, so
              // the AnimatePresence exit just snaps it away once the card beat
              // has taken over.
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 grid place-items-center px-4 [overflow:visible]"
            >
              <Envelope label={invite.label} opened={opened} onTapSeal={openEnvelope} />
            </motion.div>
          )}

          {beat === "card" && (
            <motion.div
              key="card"
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="absolute inset-0 grid place-items-center px-4"
            >
              {/* Paper shell — same paper color and dimensions as the
                  InvitationCard. Sits behind the card content. As the card
                  text fades, the shell's clip-path morphs from a full rect
                  into the PaperPlane silhouette (corners interpolate to
                  rear-top, tip, inner-fold, rear-bottom). One continuous
                  piece of paper folding itself into a plane. */}
              <motion.div
                initial={{
                  opacity: 0,
                  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                }}
                animate={{
                  opacity: [0, 0, 1, 1, 1, 1, 0],
                  clipPath: [
                    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    "polygon(4% 6%, 96% 28%, 72% 72%, 4% 92%)",
                    "polygon(10% 15%, 90% 50%, 40% 50%, 10% 85%)",
                    "polygon(10% 15%, 90% 50%, 40% 50%, 10% 85%)",
                    "polygon(10% 15%, 90% 50%, 40% 50%, 10% 85%)",
                  ],
                  scale: [1, 1, 1, 0.88, 0.6, 0.52, 0.47],
                  scaleY: [1, 1, 1, 0.88, 0.5, 0.4, 0.35],
                  rotate: [0, 0, 0, -2, 0, 0, 0],
                }}
                transition={{
                  duration: 5.5,
                  times: [0, 0.218, 0.5, 0.618, 0.78, 0.87, 1],
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="absolute w-[min(82vw,340px)] aspect-[3/4] bg-bg-beige-warm shadow-[0_18px_40px_rgba(47,58,34,0.18)]"
              />

              {/* Card content sits on top of the shell while readable, then
                  fades out as the fold begins so the shell can morph cleanly. */}
              <motion.div
                initial={{ opacity: 0, scale: 1.15, y: -40 }}
                animate={{
                  opacity: [0, 1, 1, 0, 0],
                  scale: [1.15, 1, 1, 1, 1],
                  y: [-40, 0, 0, 0, 0],
                }}
                transition={{
                  duration: 5.5,
                  times: [0, 0.218, 0.5, 0.618, 1],
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="absolute"
              >
                <InvitationCard visible />
              </motion.div>

              {/* PaperPlane SVG — crossfades in over the folded silhouette to
                  add the wing-fold shading detail, then flies off-screen. */}
              <motion.div
                initial={{ opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 0, 0, 1, 1, 1],
                  scale: [1, 1, 1, 1, 1, 0.4],
                  x: [0, 0, 0, 0, 0, "60vw"],
                  y: [0, 0, 0, 0, 0, "-50vh"],
                  rotate: [0, 0, 0, 0, 0, -40],
                }}
                transition={{
                  duration: 7.5,
                  times: [0, 0.572, 0.62, 0.667, 0.76, 1],
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="absolute w-40"
              >
                <PaperPlane className="w-full h-auto" />
              </motion.div>
            </motion.div>
          )}

          {beat === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <WorldMap visible onArrived={handleArrived} />
            </motion.div>
          )}

          {(beat === "venue" || beat === "rsvp" || beat === "thanks") && (
            <motion.div
              key="venue"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <VenueCard visible onRsvpClick={() => setBeat("rsvp")} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

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
