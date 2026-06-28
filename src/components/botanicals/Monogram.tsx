export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="none" aria-hidden="true">
      <text
        x="60"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="34"
        fill="var(--color-deepsage)"
        letterSpacing="2"
      >
        S &amp; A
      </text>
    </svg>
  );
}
