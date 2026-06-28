"use client";
import { useState } from "react";

// Elegant framed placeholder shown until a real photo is dropped into /public/story.
// If the image is missing or fails to load, the placeholder stays visible.
export function PhotoFrame({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-sage/40 bg-sage/10 shadow-[0_20px_50px_-25px_rgba(46,51,43,0.5)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-sage">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="M21 17l-5-5L5 19" />
          </svg>
          <span className="text-[0.65rem] uppercase tracking-[0.25em]">Photo</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-3 border border-cream/40" />
    </div>
  );
}
