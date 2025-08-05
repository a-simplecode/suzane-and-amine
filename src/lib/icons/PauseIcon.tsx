interface PauseIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function PauseIcon({ className = "text-gray-700", width = 20, height = 20 }: PauseIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
} 