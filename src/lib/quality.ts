export type Tier = "full" | "lite";

// Decides whether the device gets the WebGL experience or the static
// fallback. Must only run client-side (returns "lite" during SSR so the
// caller's initial render is cheap; callers re-check in useEffect).
export function detectTier(): Tier {
  if (typeof window === "undefined") return "lite";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "lite";
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return "lite";
  } catch {
    return "lite";
  }
  // deviceMemory is Chrome-only; absent (iOS Safari) means no signal — allow.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (mem !== undefined && mem < 3) return "lite";
  return "full";
}
