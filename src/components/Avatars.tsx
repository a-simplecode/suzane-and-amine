type Props = {
  size?: number;
  className?: string;
};

export function SuzaneAvatar({ size = 32, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="Suzane"
      role="img"
      fill="none"
    >
      <path d="M16 56 L20 38 Q32 30 44 38 L48 56 Z" fill="#FFFFFF" stroke="var(--ink-olive-deep)" strokeWidth="1.2" />
      <ellipse cx="32" cy="24" rx="11" ry="13" fill="#F4D6BD" stroke="var(--ink-olive-deep)" strokeWidth="1.2" />
      <path
        d="M21 22 Q20 8 32 8 Q44 8 43 22 L43 36 Q40 30 38 28 Q34 32 32 32 Q30 32 26 28 Q24 30 21 36 Z"
        fill="#6B4A2B"
        stroke="var(--ink-olive-deep)"
        strokeWidth="1.2"
      />
      <circle cx="28" cy="26" r="1.2" fill="var(--ink-olive-deep)" />
      <circle cx="36" cy="26" r="1.2" fill="var(--ink-olive-deep)" />
      <path d="M28 32 Q32 34 36 32" stroke="var(--ink-olive-deep)" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function AmineAvatar({ size = 32, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="Amine"
      role="img"
      fill="none"
    >
      <path d="M16 56 L20 38 Q32 30 44 38 L48 56 Z" fill="var(--ink-olive-deep)" />
      <path d="M28 32 L32 40 L36 32 L36 56 L28 56 Z" fill="#F1E9DA" />
      <ellipse cx="32" cy="24" rx="11" ry="13" fill="#C99366" stroke="var(--ink-olive-deep)" strokeWidth="1.2" />
      <path
        d="M22 20 Q22 10 32 10 Q42 10 42 20 L42 24 Q38 22 32 22 Q26 22 22 24 Z"
        fill="#1F1B14"
      />
      <path
        d="M24 32 Q26 36 30 36 L34 36 Q38 36 40 32 Q40 38 36 40 L28 40 Q24 38 24 32 Z"
        fill="#1F1B14"
      />
      <circle cx="28" cy="26" r="1.2" fill="var(--ink-olive-deep)" />
      <circle cx="36" cy="26" r="1.2" fill="var(--ink-olive-deep)" />
    </svg>
  );
}
