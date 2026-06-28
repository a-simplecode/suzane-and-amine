"use client";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

export function Parallax({
  children,
  speed = 0.2,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Spring-smooth the scroll progress so motion eases behind the scroll
  // instead of tracking it 1:1 — reads slower and more deliberate.
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.8 });
  const y = useTransform(smooth, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
