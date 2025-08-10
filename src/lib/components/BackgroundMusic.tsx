"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PlayIcon, PauseIcon, MusicNoteIcon } from "../icons";

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
      <audio ref={audioRef} src="/Ed Sheeran - Perfect.mp3" preload="auto" />
      
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
        {paused ? <PlayIcon /> : <PauseIcon />}
      </button>

      {/* Animated Music Notes */}
      {!paused && (
        <div className="fixed bottom-20 right-8 z-40 pointer-events-none">
          {/* Music Note 1 */}
          <div className="absolute animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
            <MusicNoteIcon width={16} height={16} />
          </div>
          
          {/* Music Note 2 */}
          <div className="absolute animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
            <MusicNoteIcon width={12} height={12} style={{ transform: 'translateX(-15px) translateY(-15px)' }} />
          </div>
          
          {/* Music Note 3 */}
          <div className="absolute animate-bounce" style={{ animationDelay: '1s', animationDuration: '1.8s' }}>
            <MusicNoteIcon width={14} height={14} style={{ transform: 'translateX(-30px) translateY(-8px)' }} />
          </div>
        </div>
      )}
    </>
  );
} 