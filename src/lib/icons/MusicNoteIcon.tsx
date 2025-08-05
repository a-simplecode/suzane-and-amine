interface MusicNoteIconProps {
  className?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export default function MusicNoteIcon({ className = "text-green-400", width = 16, height = 16, style }: MusicNoteIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      style={style}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
} 