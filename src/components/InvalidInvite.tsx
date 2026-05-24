import { Monogram } from "./Monogram";

export function InvalidInvite() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-bg-beige text-ink-olive-deep">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <svg
          viewBox="0 0 200 120"
          className="w-40 h-auto"
          aria-hidden="true"
          fill="none"
        >
          <rect
            x="8"
            y="20"
            width="184"
            height="92"
            rx="6"
            fill="var(--bg-beige-warm)"
            stroke="var(--accent-olive)"
            strokeWidth="1.5"
          />
          <path
            d="M8 26 L100 78 L192 26"
            stroke="var(--accent-olive)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <Monogram className="w-20 h-auto opacity-80" />
        <p className="font-display text-2xl">This invite link is invalid.</p>
        <p className="text-sm opacity-70">
          Please double-check the link from your invitation.
        </p>
      </div>
    </main>
  );
}
