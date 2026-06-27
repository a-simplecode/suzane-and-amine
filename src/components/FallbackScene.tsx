"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/invites";
import { PHOTOS } from "@/data/photos";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { InvitationCard } from "./InvitationCard";
import { MusicToggle } from "./MusicToggle";
import { RsvpForm } from "./RsvpForm";
import { ThankYou } from "./ThankYou";
import { VenueCard } from "./VenueCard";

type Beat = "story" | "rsvp" | "thanks";

export function FallbackScene({ invite }: { invite: Invite }) {
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [beat, setBeat] = useState<Beat>("story");
  const [muted, setMuted] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!opened) return;
    const id = setTimeout(() => setRevealed(true), 2200);
    return () => clearTimeout(id);
  }, [opened]);

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

  return (
    <main className="relative min-h-dvh bg-bg-beige text-ink-olive-deep">
      <audio ref={audioRef} src="/perfect.mp3" preload="metadata" playsInline />

      <header className="pointer-events-none fixed top-0 inset-x-0 z-20 pt-5">
        <div className="pointer-events-auto mx-auto max-w-[min(92vw,520px)] px-4">
          <Countdown mode="corner" />
        </div>
        <div className="pointer-events-auto absolute top-5 right-5">
          <MusicToggle visible={musicStarted} muted={muted} onToggle={toggleMute} />
        </div>
      </header>

      <section className="min-h-dvh grid place-items-center px-4">
        {!revealed ? (
          <Envelope label={invite.label} opened={opened} onTapSeal={openEnvelope} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <InvitationCard />
          </motion.div>
        )}
      </section>

      {revealed && (
        <>
          <section className="mx-auto grid w-full max-w-[560px] grid-cols-2 gap-3 px-4 pb-16">
            {PHOTOS.map((p, i) => (
              <motion.div
                key={p.src}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
                className={i === 0 ? "col-span-2" : ""}
              >
                <Image
                  src={p.src}
                  alt="Suzane & Amine"
                  width={p.width}
                  height={p.height}
                  placeholder="blur"
                  blurDataURL={p.blurDataURL}
                  sizes="(max-width: 600px) 50vw, 280px"
                  className="rounded-md shadow-[0_12px_30px_rgba(47,58,34,0.16)]"
                />
              </motion.div>
            ))}
          </section>

          <section className="px-4 pb-24">
            <VenueCard visible onRsvpClick={() => setBeat("rsvp")} />
          </section>
        </>
      )}

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
