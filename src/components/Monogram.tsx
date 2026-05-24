type Props = {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
};

export function Monogram({
  className,
  stroke = "var(--accent-olive)",
  strokeWidth = 2.5,
}: Props) {
  return (
    <svg
      viewBox="0 0 200 120"
      className={className}
      aria-label="S and A monogram"
      role="img"
      fill="none"
    >
      <path
        d="M70 38 C 55 30, 38 38, 38 55 C 38 70, 60 72, 70 80 C 80 88, 78 100, 60 100 C 48 100, 38 92, 38 84
           M 96 58 C 92 62, 92 70, 100 70 C 108 70, 108 60, 102 58 C 96 56, 92 50, 96 46 C 100 42, 106 44, 108 48
           M 130 100 L 152 38 L 174 100
           M 138 80 L 166 80"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
