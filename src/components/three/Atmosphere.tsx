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
      {/* Fog fades distant geometry into the dark candlelit stage so the
          beige paper near the camera reads as lit against shadow. */}
      <fog attach="fog" args={[PALETTE.stageMid, 18, 50]} />
      {/* generated studio environment — soft specular life on paper, no
          HDR file fetched (resolution kept small for the perf budget) */}
      <Environment resolution={64} environmentIntensity={0.2}>
        <mesh scale={50}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={PALETTE.stageMid} side={THREE.BackSide} />
        </mesh>
        <mesh position={[5, 7, 4]} scale={7}>
          <planeGeometry />
          <meshBasicMaterial color={PALETTE.lightKey} />
        </mesh>
      </Environment>
      {/* strong warm key + low cool fill → paper has a clear lit/shadow
          gradient instead of flat uniform brightness */}
      <ambientLight intensity={0.22} color={PALETTE.lightFill} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.9}
        color={PALETTE.lightKey}
      />
      <hemisphereLight args={[PALETTE.lightFill, PALETTE.stageMid, 0.3]} />
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
