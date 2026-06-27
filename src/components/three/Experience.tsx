"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { createTimeline, type Timeline } from "./timeline";
import { Atmosphere } from "./Atmosphere";
import { Envelope3D } from "./Envelope3D";
import { Card3D } from "./Card3D";
import { Polaroids } from "./Polaroids";
import { PaperPlaneFold } from "./PaperPlaneFold";
import { FlightMap } from "./FlightMap";
import { CoupleWindow } from "./Avatars3D";
import { CameraRig } from "./CameraRig";
import { ContactGroundShadows } from "./ContactGroundShadows";

type Props = {
  label: string;
  opened: boolean;
  scrollProgress: MotionValue<number>;
  onTapSeal: () => void;
  onIntroDone: () => void;
};

const INTRO_SECONDS = 2.5;

function Driver({
  timeline,
  opened,
  scrollProgress,
  onIntroDone,
}: {
  timeline: Timeline;
  opened: boolean;
  scrollProgress: MotionValue<number>;
  onIntroDone: () => void;
}) {
  // Hold a ref to the mutable timeline so useFrame closes over a stable ref,
  // not the plain object (which would trigger react-hooks/immutability).
  const tlRef = useRef(timeline);
  const fired = useRef(false);
  // Route latest props through refs so the useFrame closure never goes stale.
  const openedRef = useRef(opened);
  const introDoneRef = useRef(onIntroDone);
  useEffect(() => {
    openedRef.current = opened;
  }, [opened]);
  useEffect(() => {
    introDoneRef.current = onIntroDone;
  }, [onIntroDone]);
  useFrame((_, dtRaw) => {
    const t = tlRef.current;
    const dt = Math.min(dtRaw, 1 / 20); // clamp tab-switch jumps
    const isOpened = openedRef.current;
    t.opened = isOpened;
    if (isOpened && t.intro < 1) {
      t.intro = Math.min(1, t.intro + dt / INTRO_SECONDS);
      if (t.intro >= 1 && !fired.current) {
        fired.current = true;
        introDoneRef.current();
      }
    }
    const target = t.intro >= 1 ? scrollProgress.get() : 0;
    const prev = t.p;
    t.p += (target - t.p) * (1 - Math.exp(-4 * dt));
    const v = (t.p - prev) / Math.max(dt, 1e-4);
    t.vel += (v - t.vel) * (1 - Math.exp(-6 * dt));
  });
  return null;
}

export function Experience({ label, opened, scrollProgress, onTapSeal, onIntroDone }: Props) {
  // useState with a lazy initializer runs createTimeline exactly once.
  // We wrap the stable value in a ref so children receive a RefObject<Timeline>.
  const [tlObj] = useState<Timeline>(createTimeline);
  const tl = useRef<Timeline>(tlObj);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 42, position: [0, 0.25, 7] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color("#f1e9da"), 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Driver timeline={tlObj} opened={opened} scrollProgress={scrollProgress} onIntroDone={onIntroDone} />
      <Atmosphere tl={tl} />
      <ContactGroundShadows tl={tl} />
      <Envelope3D tl={tl} label={label} onTapSeal={onTapSeal} />
      <Card3D tl={tl} />
      <Suspense fallback={null}>
        <Polaroids tl={tl} />
      </Suspense>
      <PaperPlaneFold tl={tl} windowChildren={<CoupleWindow size={0.55} />} />
      <FlightMap tl={tl} />
      <CameraRig tl={tl} />
    </Canvas>
  );
}

export default Experience;
