"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, easeOut3, lerp, seg, smooth, type Timeline } from "./timeline";
import { makeCardTexture, makePaperTexture } from "./textures";
import { FOLD_POS } from "./flight-path";

export const CARD_W = 2.4;
export const CARD_H = 3.2;

export function Card3D({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const cardTex = useMemo(() => makeCardTexture(), []);
  const paperTex = useMemo(() => makePaperTexture(), []);

  useFrame(() => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;

    const foldT = seg(t.p, BEATS.fold[0], BEATS.fold[1]);
    g.visible = t.opened && foldT < 0.5;
    if (!g.visible) return;

    if (t.intro < 1) {
      // emerge from the envelope, then settle to center at full size
      const rise = easeOut3(seg(t.intro, 0.3, 0.75));
      const settle = smooth(seg(t.intro, 0.72, 1));
      g.scale.setScalar(lerp(0.55, 1, settle));
      g.position.set(0, lerp(lerp(-0.15, 1.15, rise), 0, settle), -0.03 + settle * 0.06);
      g.rotation.set(0, 0, 0);
      return;
    }

    const photoT = smooth(seg(t.p, BEATS.photos[0], BEATS.photos[1]));
    const f = smooth(Math.min(1, foldT * 2)); // first half of the fold beat

    g.scale.setScalar(1);
    g.position.set(
      lerp(0, FOLD_POS.x, f),
      lerp(-photoT * 0.1, FOLD_POS.y, f) + Math.sin(f * Math.PI) * 0.8,
      lerp(0.03 - photoT * 0.5, FOLD_POS.z, f),
    );
    g.rotation.x = lerp(-0.12 * photoT, -Math.PI / 2, f);
    g.rotation.z = Math.sin(f * Math.PI) * -0.3;
  });

  return (
    <group ref={root} visible={false}>
      <mesh>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={cardTex} roughness={0.85} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.005]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial color="#e8dfc9" map={paperTex} roughness={0.9} />
      </mesh>
    </group>
  );
}
