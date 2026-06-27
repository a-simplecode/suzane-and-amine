"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import type { RefObject } from "react";
import { BEATS, seg, smooth, type Timeline } from "./timeline";
import { PALETTE } from "@/lib/palette";

const DUST_COUNT_DESKTOP = 140;
const DUST_COUNT_TOUCH = 70;

function makeDustPositions(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 12;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  return arr;
}

// Generated once at module-load time — stable across renders.
const POSITIONS_DESKTOP = makeDustPositions(DUST_COUNT_DESKTOP);
const POSITIONS_TOUCH = makeDustPositions(DUST_COUNT_TOUCH);

export function Atmosphere({ tl }: { tl: RefObject<Timeline> }) {
  const isTouch = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  const positions = isTouch ? POSITIONS_TOUCH : POSITIONS_DESKTOP;

  const points = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    const p = points.current;
    if (!p) return;
    p.rotation.y = clock.elapsedTime * 0.012;
    p.position.y = Math.sin(clock.elapsedTime * 0.18) * 0.15;
    // dust belongs to the envelope/card chapters — at map zoom a stray
    // near-camera point renders as a giant soft blob, so fade it out
    const t = tl.current;
    const fade = t ? 1 - smooth(seg(t.p, BEATS.fold[0], BEATS.fold[1])) : 1;
    p.visible = fade > 0;
    (p.material as THREE.PointsMaterial).opacity = 0.35 * fade;
  });

  return (
    <>
      {/* Attach fog declaratively — fogFar reads cooler/darker than the
          beige bg so distance fade becomes a depth cue, not a flat wash. */}
      <fog attach="fog" args={[PALETTE.fogFar, 16, 44]} />
      {/* generated studio environment — soft specular life on paper, no
          HDR file fetched (resolution kept small for the perf budget) */}
      <Environment resolution={64} environmentIntensity={0.35}>
        <mesh scale={50}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={PALETTE.beige} side={THREE.BackSide} />
        </mesh>
        <mesh position={[4, 6, 3]} scale={6}>
          <planeGeometry />
          <meshBasicMaterial color={PALETTE.lightKey} />
        </mesh>
      </Environment>
      {/* warm key + cool fill so forms read in 3D instead of going flat */}
      <ambientLight intensity={0.5} color={PALETTE.lightFill} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.0}
        color={PALETTE.lightKey}
      />
      <hemisphereLight args={[PALETTE.lightFill, PALETTE.lightGround, 0.4]} />
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          sizeAttenuation
          color="#8b9968"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </points>
    </>
  );
}
