// Purely presentational. All entrance/exit/scale choreography is driven by the
// parent in Scene.tsx — this component just renders the card surface.
export function InvitationCard() {
  return (
    <div className="w-[min(82vw,340px)] aspect-[3/4] mx-auto rounded-md bg-bg-beige-warm shadow-[0_18px_40px_rgba(47,58,34,0.18)] flex flex-col items-center justify-center text-center px-6">
      <div className="font-display text-[36px] leading-tight text-ink-olive-deep tracking-[0.04em]">
        Suzane <span className="opacity-60">&amp;</span> Amine
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-accent-olive">
        are getting married
      </div>

      <div className="my-8 h-px w-16 bg-accent-olive/40" />

      <div className="font-display text-2xl text-ink-olive-deep">
        Saturday
      </div>
      <div className="font-display text-3xl text-ink-olive-deep">
        August 29, 2026
      </div>
      <div className="mt-3 text-xs uppercase tracking-[0.25em] text-accent-olive">
        Nahr El Kalb · Lebanon
      </div>
    </div>
  );
}
