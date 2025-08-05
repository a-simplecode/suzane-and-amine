"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function BackgroundMusic() {
  const [paused, setPaused] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (paused) {
      audio.play().then(() => {
        setPaused(false);
      }).catch((error) => {
        console.log("Play failed:", error);
      });
    } else {
      audio.pause();
      setPaused(true);
    }
  }, [paused]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set up audio properties
    audio.loop = true;
    audio.volume = 0.5;

    // Try to autoplay, but don't worry if it fails
    audio.play().then(() => {
      setPaused(false);
    }).catch((error) => {
      console.log("Autoplay prevented:", error);
      setPaused(true);
    });

    // Handle audio events
    const handlePlay = () => setPaused(false);
    const handlePause = () => setPaused(true);
    const handleEnded = () => setPaused(true);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src="/song.mp3" preload="auto" />
      
      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className={`fixed cursor-pointer bottom-4 right-4 z-50 bg-white/80 backdrop-blur-sm rounded-full p-3 hover:bg-white/90 transition-all duration-200 border border-gray-200 ${
          !paused 
            ? ' shadow-lg shadow-green-400/50 shadow-xl animate-pulse' 
            : ''
        }`}
        aria-label={paused ? "Play music" : "Pause music"}
        title={paused ? "Play music" : "Pause music"}
      >
        {paused ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-700"
          >
            <polygon points="6 4 18 12 6 20 6 4" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-700"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        )}
      </button>
    </>
  );
} 