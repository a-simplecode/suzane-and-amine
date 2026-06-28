// Folds an optional dietary note into the free-text RSVP message so it reaches
// the couple through the existing /api/rsvp `message` field — no backend change.
export function composeRsvpMessage(message: string, dietary: string): string {
  const m = message.trim();
  const d = dietary.trim();
  if (!d) return m;
  const line = `Dietary: ${d}`;
  return m ? `${m}\n\n${line}` : line;
}
