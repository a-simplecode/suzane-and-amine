"use client";

type Props = {
  muted: boolean;
  visible: boolean;
  onToggle: () => void;
};

export function MusicToggle({ muted, visible, onToggle }: Props) {
  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label={muted ? "Unmute music" : "Mute music"}
      onClick={onToggle}
      className="h-10 w-10 grid place-items-center rounded-full bg-bg-beige-warm/80 backdrop-blur-sm text-ink-olive-deep shadow-sm active:scale-95 transition"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 L6 9 H3 V15 H6 L11 19 V5 Z" />
        {muted ? (
          <>
            <line x1="16" y1="9" x2="22" y2="15" />
            <line x1="22" y1="9" x2="16" y2="15" />
          </>
        ) : (
          <>
            <path d="M16 8 C18 10, 18 14, 16 16" />
            <path d="M19 5 C22 8, 22 16, 19 19" />
          </>
        )}
      </svg>
    </button>
  );
}
