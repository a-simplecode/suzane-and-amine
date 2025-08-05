interface PlayIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function PlayIcon({ className = "text-gray-700", width = 20, height = 20 }: PlayIconProps) {
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
      <polygon points="6 4 18 12 6 20 6 4" />
    </svg>
  );
} 