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

type Beat =
  | "envelope"
  | "card"
  | "plane"
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
    setTimeout(() => setBeat("card"), 1500);
  }, [beat, opened, startMusic]);

  useEffect(() => {
    if (beat !== "card") return;
    const id = setTimeout(() => setBeat("plane"), 3200);
    return () => clearTimeout(id);
  }, [beat]);

  useEffect(() => {
    if (beat !== "plane") return;
    const id = setTimeout(() => setBeat("map"), 1700);
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
              exit={{
                opacity: 0,
                y: 80,
                scale: 0.82,
                transition: { duration: 0.7, ease: [0.4, 0, 0.7, 1] },
              }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 grid place-items-center px-4"
            >
              <Envelope label={invite.label} opened={opened} onTapSeal={openEnvelope} />
            </motion.div>
          )}

          {beat === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 1.0, ease: [0.2, 0.7, 0.2, 1] },
              }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
              className="absolute inset-0 grid place-items-center px-4"
            >
              <InvitationCard visible />
            </motion.div>
          )}

          {beat === "plane" && (
            <motion.div
              key="plane"
              className="w-full"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                animate={{ x: "60vw", y: "-50vh", rotate: -25, scale: 0.4 }}
                transition={{ duration: 1.6, ease: [0.5, 0, 0.5, 1] }}
                className="mx-auto w-40"
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
