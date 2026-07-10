"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

export function HeroLogoMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const controls = useAnimationControls();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setTimeout(() => {
      void (async () => {
        await controls.start({
          y: -70,
          scale: 1.06,
          transition: { type: "spring", stiffness: 260, damping: 14 },
        });
        await controls.start({
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 380, damping: 9 },
        });
      })();
    }, 500);
    return () => clearTimeout(timer);
  }, [controls, shouldReduceMotion]);

  function handleMouseEnter() {
    if (isPlaying) return;
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    video.currentTime = 0;
    video.play().catch(() => setIsPlaying(false));
  }

  function handleEnded() {
    setIsPlaying(false);
  }

  return (
    <motion.div
      animate={controls}
      onMouseEnter={handleMouseEnter}
      className="relative w-full max-w-[420px] cursor-pointer drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
      style={{ aspectRatio: "768 / 1168" }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-4 -z-10"
        animate={
          isPlaying
            ? {
                boxShadow: [
                  "0 0 0px rgba(224,71,46,0)",
                  "0 0 46px rgba(224,71,46,0.55)",
                  "0 0 0px rgba(224,71,46,0)",
                ],
              }
            : { boxShadow: "0 0 0px rgba(224,71,46,0)" }
        }
        transition={
          isPlaying
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />
      <Image
        src="/assets/logo.png"
        alt="The Label Slayer"
        fill
        priority
        sizes="(max-width: 1024px) 60vw, 420px"
        className="pointer-events-none object-contain transition-opacity duration-500 ease-out"
        style={{ opacity: isPlaying ? 0 : 1 }}
      />
      <video
        ref={videoRef}
        src="/assets/hero-video.mp4"
        preload="auto"
        playsInline
        onEnded={handleEnded}
        aria-hidden={!isPlaying}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-out"
        style={{ opacity: isPlaying ? 1 : 0 }}
      />
    </motion.div>
  );
}
