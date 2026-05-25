"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/invites";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { InvitationCard } from "./InvitationCard";
import { MusicToggle } from "./MusicToggle";
import { PaperPlane } from "./PaperPlane";
import { RsvpForm } from "./RsvpForm";
import { ThankYou } from "./ThankYou";
import { VenueCard } from "./VenueCard";
import { WorldMap } from "./WorldMap";

type Beat = "card" | "map" | "venue" | "rsvp" | "thanks";

const PENDING_KEY = "pending-rsvp";

type Props = {
  invite: Invite;
};

export function Scene({ invite }: Props) {
  const [beat, setBeat] = useState<Beat>("card");
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
    if (opened) return;
    setOpened(true);
    startMusic();
  }, [opened, startMusic]);

  useEffect(() => {
    if (beat !== "card" || !opened) return;
    const id = setTimeout(() => setBeat("map"), 5500);
    return () => clearTimeout(id);
  }, [beat, opened]);

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
          {beat === "card" && (
            <motion.div
              key="card"
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="absolute inset-0 grid place-items-center px-4"
            >
              {/* Envelope — always visible at start of the beat. Fades itself
                  out via its own internal animation once the seal is tapped. */}
              <div className="absolute inset-0 grid place-items-center [overflow:visible]">
                <Envelope label={invite.label} opened={opened} onTapSeal={openEnvelope} />
              </div>

              {/* Everything from here on only mounts when the seal is tapped.
                  Once mounted, every element runs on the same 5.5s timeline
                  from the moment `opened` flipped true, so the card emerging
                  from the envelope is the same element that holds, shrinks,
                  folds, and flies off. */}
              {opened && (
                <>
                  {/* The invitation — emerges from the envelope mouth, holds
                      readable, then shrinks to the 160x160 plane footprint as
                      the paper shell takes over. */}
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.4, scaleY: 0.4, y: 40 }}
                      animate={{
                        opacity: [0, 0, 1, 1, 0, 0],
                        scaleX: [0.4, 0.4, 1, 1, 0.47, 0.47],
                        scaleY: [0.4, 0.4, 1, 1, 0.353, 0.353],
                        y: [40, 40, 0, 0, 0, 0],
                      }}
                      transition={{
                        // wall-clock from seal-tap: 0, 0.95s, 2.3s, 3.5s, 3.9s, 5.5s
                        duration: 5.5,
                        times: [0, 0.173, 0.418, 0.636, 0.71, 1],
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    >
                      <InvitationCard visible />
                    </motion.div>
                  </div>

                  {/* Paper shell — fixed 160x160 box. Fades in as the card
                      finishes shrinking (its scaled-down size lands on the
                      shell's footprint), then clip-path morphs rect → plane
                      silhouette. */}
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <motion.div
                      initial={{
                        opacity: 0,
                        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                      }}
                      animate={{
                        opacity: [0, 0, 1, 1, 1, 0, 0],
                        clipPath: [
                          "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                          "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                          "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                          "polygon(45% 25%, 55% 7%, 70% 75%, 5% 92%)",
                          "polygon(90% 50%, 10% 15%, 40% 50%, 10% 85%)",
                          "polygon(90% 50%, 10% 15%, 40% 50%, 10% 85%)",
                          "polygon(90% 50%, 10% 15%, 40% 50%, 10% 85%)",
                        ],
                      }}
                      transition={{
                        // wall-clock: 0, 3.5s, 3.9s, 4.1s, 4.5s, 4.7s, 5.5s
                        duration: 5.5,
                        times: [0, 0.636, 0.71, 0.745, 0.818, 0.855, 1],
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="w-40 h-40 bg-bg-beige-warm shadow-[0_18px_40px_rgba(47,58,34,0.18)]"
                    />
                  </div>

                  {/* PaperPlane SVG — crossfades in over the folded silhouette
                      then flies off. Same 160x160 box as the shell. */}
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 }}
                      animate={{
                        opacity: [0, 0, 1, 1, 1],
                        scale: [1, 1, 1, 1, 0.4],
                        x: [0, 0, 0, 0, "60vw"],
                        y: [0, 0, 0, 0, "-50vh"],
                        rotate: [0, 0, 0, 0, -40],
                      }}
                      transition={{
                        // wall-clock: 0, 4.5s, 4.7s, 4.9s, 5.5s
                        duration: 5.5,
                        times: [0, 0.818, 0.855, 0.891, 1],
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="w-40 h-40"
                    >
                      <PaperPlane className="w-full h-full" />
                    </motion.div>
                  </div>
                </>
              )}
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
