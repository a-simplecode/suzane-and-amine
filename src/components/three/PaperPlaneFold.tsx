"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, lerp, seg, smooth, type Timeline } from "./timeline";
import { makePaperTexture } from "./textures";
import { FLIGHT_CURVE, FOLD_POS, HOME_PIN } from "./flight-path";

const SHEET_L = 2.8;

export function PaperPlaneFold({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const leftHinge = useRef<THREE.Group>(null);
  const rightHinge = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const bank = useRef(0);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);
  const paperTex = useMemo(() => makePaperTexture(), []);
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      zAxis: new THREE.Vector3(0, 0, 1),
      qStart: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        FLIGHT_CURVE.getTangentAt(0).normalize(),
      ),
      qId: new THREE.Quaternion(),
    }),
    [],
  );

  useFrame((_, dt) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    const foldT = seg(t.p, BEATS.fold[0], BEATS.fold[1]);
    const flightT = seg(t.p, BEATS.flight[0], BEATS.flight[1]);
    const landT = seg(t.p, BEATS.land[0], BEATS.land[1]);
    g.visible = t.opened && foldT >= 0.5 && landT < 0.6;
    if (!g.visible) return;

    // fold runs over the second half of the fold beat (card hands off at 0.5)
    const fs = smooth(seg(foldT, 0.5, 1));
    const A = 1.15 * fs;
    if (leftHinge.current) leftHinge.current.rotation.z = -A;
    if (rightHinge.current) rightHinge.current.rotation.z = A;
    if (leftWing.current) leftWing.current.rotation.z = A * 1.1;
    if (rightWing.current) rightWing.current.rotation.z = -A * 1.1;

    if (flightT <= 0) {
      g.position.copy(FOLD_POS);
      g.quaternion.copy(tmp.qId).slerp(tmp.qStart, fs); // settle nose toward the route — ends exactly at flight-start orientation
    } else {
      const ft = smooth(Math.min(1, flightT));
      FLIGHT_CURVE.getPointAt(ft, tmp.pos);
      FLIGHT_CURVE.getTangentAt(ft, tmp.tan).normalize();
      g.position.copy(tmp.pos);
      g.position.y += Math.sin(ft * Math.PI * 6) * 0.04 * (1 - ft); // gentle bob
      tmp.q.setFromUnitVectors(tmp.zAxis, tmp.tan);
      g.quaternion.copy(tmp.q);
      const targetBank = THREE.MathUtils.clamp(-t.vel * 5, -0.55, 0.55);
      bank.current += (targetBank - bank.current) * (1 - Math.exp(-5 * dt));
      g.rotateZ(bank.current);

      // final descent onto Suzane's doorstep — shrink fast to map-marker
      // scale (the house is ~0.026 wide; an unshrunk sheet covers the
      // whole frame). Scale always written so a backwards scrub restores.
      const d = smooth(seg(landT, 0, 0.55));
      g.scale.setScalar(lerp(1, 0.03, d));
      if (landT > 0) {
        g.position.y = HOME_PIN.y + lerp(0.1, 0.005, d);
      }
    }

    // touch down + fade as the house takes focus
    const o = landT > 0.15 ? 1 - seg(landT, 0.15, 0.5) : 1;
    for (const m of mats.current) m.opacity = o;
  });

  const collect = (m: THREE.MeshStandardMaterial | null): void => {
    if (m && !mats.current.includes(m)) mats.current.push(m);
  };

  const panel = (w: number, xCenter: number, key: string) => (
    <mesh key={key} position={[xCenter, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, SHEET_L]} />
      <meshStandardMaterial
        ref={collect}
        color="#e8dfc9"
        map={paperTex}
        side={THREE.DoubleSide}
        transparent
        roughness={0.85}
      />
    </mesh>
  );

  return (
    <group ref={root} visible={false}>
      <group ref={leftHinge}>
        {panel(0.33, -0.165, "il")}
        <group ref={leftWing} position={[-0.33, 0, 0]}>
          {panel(0.67, -0.335, "wl")}
        </group>
      </group>
      <group ref={rightHinge}>
        {panel(0.33, 0.165, "ir")}
        <group ref={rightWing} position={[0.33, 0, 0]}>
          {panel(0.67, 0.335, "wr")}
        </group>
      </group>
    </group>
  );
}
