"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { RefObject } from "react";
import * as THREE from "three";
import { BEATS, seg, smooth, type Timeline } from "./timeline";

export function ContactGroundShadows({ tl }: { tl: RefObject<Timeline> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = tl.current;
    const g = group.current;
    if (!t || !g) return;
    // fade out as the camera pulls up into the fold/flight map chapter
    const fade = 1 - smooth(seg(t.p, BEATS.fold[0], BEATS.fold[1]));
    g.visible = t.opened && fade > 0.01;
  });
  return (
    <group ref={group} position={[0, -2.2, 0]}>
      <ContactShadows
        opacity={0.35}
        scale={12}
        blur={2.4}
        far={6}
        resolution={512}
        color="#2f3a22"
        frames={1}
      />
    </group>
  );
}
