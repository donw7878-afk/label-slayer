"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";

export function BrandVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    video.play().catch(() => setIsPlaying(false));
  }

  function handleEnded() {
    setIsPlaying(false);
  }

  return (
    <div className="pt-14 pb-28">
      <Container>
        <Reveal>
          <div className="relative aspect-video overflow-hidden border border-hairline bg-charcoal">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-linear-to-r from-transparent via-brass to-transparent" />
            <video
              ref={videoRef}
              src="/assets/hero-video.mp4"
              preload="auto"
              playsInline
              onEnded={handleEnded}
              className="absolute inset-0 h-full w-full object-contain"
            />
            {!isPlaying && (
              <button
                onClick={handlePlay}
                aria-label="Play brand film"
                className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-obsidian/40"
              >
                <motion.span
                  whileHover={{ scale: 1.06, backgroundColor: "#E0472E", borderColor: "#E0472E" }}
                  className="flex h-21 w-21 items-center justify-center rounded-full border-[1.5px] border-brass bg-obsidian/50 backdrop-blur-sm"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="ml-1">
                    <path d="M6 4L20 12L6 20V4Z" fill="#F2EEE6" />
                  </svg>
                </motion.span>
                <span className="border border-brass/40 px-3.5 py-1.5 text-[10px] tracking-[0.25em] text-brass uppercase">
                  The Label Slayer — Brand Film
                </span>
              </button>
            )}
          </div>
          <div className="mt-4.5 flex justify-between text-[11px] tracking-[0.2em] text-brand-muted uppercase">
            <span>The Label Slayer — Brand Film</span>
            <span>00:06</span>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
