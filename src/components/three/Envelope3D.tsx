"use client";

import * as THREE from "three";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { easeOut3, seg, smooth, type Timeline } from "./timeline";
import { makeEnvelopeTexture, makePaperTexture, makeSealTexture } from "./textures";
import { PALETTE } from "@/lib/palette";

const W = 3.6;
const H = 2.16;

type Props = {
  tl: RefObject<Timeline>;
  label: string;
  onTapSeal: () => void;
};

function makeFlashTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,250,235,0.9)");
  g.addColorStop(1, "rgba(255,250,235,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function Envelope3D({ tl, label, onTapSeal }: Props) {
  const root = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Group>(null);
  const seal = useRef<THREE.Group>(null);
  const shards = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Sprite>(null);
  const fadeMats = useRef<THREE.MeshStandardMaterial[]>([]);

  const envTex = useMemo(() => makeEnvelopeTexture(label), [label]);
  const paperTex = useMemo(() => makePaperTexture(), []);
  const sealTex = useMemo(() => makeSealTexture(), []);

  const flapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(W / 2, 0);
    s.lineTo(0, -H * 0.62);
    s.closePath();
    return s;
  }, []);

  const [flashTex] = useState<THREE.CanvasTexture>(() => makeFlashTexture());

  const SHARDS = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        dir: new THREE.Vector3(
          Math.cos((i / 6) * Math.PI * 2),
          Math.sin((i / 6) * Math.PI * 2),
          0.6,
        ),
        rot: (i % 2 ? 1 : -1) * (2 + i),
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;

    g.visible = t.intro < 0.98;
    if (!g.visible) return;

    // wax seal: pulse before tap, crack + tumble after
    if (seal.current) {
      if (!t.opened) {
        seal.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.6) * 0.035);
      } else {
        const k = easeOut3(seg(t.intro, 0, 0.18));
        seal.current.scale.setScalar(Math.max(0.01, 1 + 0.18 * Math.sin(k * Math.PI) - 0.6 * k));
        seal.current.position.y = -0.1 - 1.4 * k * k;
        seal.current.rotation.z = 0.9 * k;
        seal.current.visible = k < 1;
      }
    }

    // shards spray out as the seal cracks
    if (shards.current) {
      const k = seg(t.intro, 0.04, 0.3);
      shards.current.visible = t.opened && k > 0 && k < 1;
      shards.current.children.forEach((child, i) => {
        const s = SHARDS[i];
        if (!s) return;
        child.position.copy(s.dir).multiplyScalar(easeOut3(k) * 1.1);
        child.rotation.z = s.rot * k;
        child.scale.setScalar(Math.max(0.01, 1 - k * 0.7));
      });
    }

    // flap unhinges past 170°
    if (flap.current) {
      flap.current.rotation.x = -2.95 * easeOut3(seg(t.intro, 0.12, 0.45));
    }

    // soft light bloom while the card emerges
    if (flash.current) {
      const k = seg(t.intro, 0.3, 0.7);
      (flash.current.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI) * 0.55;
    }

    // envelope drops away and fades once the card is out
    const drop = smooth(seg(t.intro, 0.55, 0.95));
    g.position.y = -drop * 2.4;
    g.rotation.z = -0.06 * drop;
    for (const m of fadeMats.current) m.opacity = 1 - drop;
  });

  const collect = (m: THREE.MeshStandardMaterial | null): void => {
    if (m && !fadeMats.current.includes(m)) fadeMats.current.push(m);
  };

  return (
    <group ref={root}>
      {/* back face */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial ref={collect} color="#e3d9c2" map={paperTex} transparent roughness={0.9} />
      </mesh>
      {/* front face with guest label */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial ref={collect} map={envTex} transparent roughness={0.85} />
      </mesh>
      {/* flap, hinged at the top edge */}
      <group ref={flap} position={[0, H / 2, 0.01]}>
        <mesh>
          <shapeGeometry args={[flapShape]} />
          <meshStandardMaterial
            ref={collect}
            color="#e8dfc9"
            map={paperTex}
            side={THREE.DoubleSide}
            transparent
            roughness={0.85}
          />
        </mesh>
      </group>
      {/* light bloom sprite */}
      <sprite ref={flash} position={[0, 0.4, 0.4]} scale={[5, 5, 1]}>
        <spriteMaterial map={flashTex} transparent opacity={0} depthWrite={false} />
      </sprite>
      {/* wax seal (tap target) */}
      <group ref={seal} position={[0, -0.1, 0.06]} onPointerDown={onTapSeal}>
        {/* puck body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.45, 0.07, 48]} />
          <meshStandardMaterial color={PALETTE.olive} roughness={0.5} />
        </mesh>
        {/* monogram face, just proud of the puck front (+Z) */}
        <mesh position={[0, 0, 0.036]}>
          <circleGeometry args={[0.42, 48]} />
          <meshStandardMaterial map={sealTex} transparent roughness={0.5} depthWrite={false} />
        </mesh>
        {/* fine gold ring */}
        <mesh position={[0, 0, 0.04]}>
          <torusGeometry args={[0.34, 0.014, 12, 48]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
      {/* wax shards */}
      <group ref={shards} position={[0, -0.1, 0.1]} visible={false}>
        {SHARDS.map((_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshStandardMaterial color="#6b7a4b" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
