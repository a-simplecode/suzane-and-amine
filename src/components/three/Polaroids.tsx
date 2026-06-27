"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { RefObject } from "react";
import { PHOTOS } from "@/data/photos";
import { BEATS, seg, smooth, type Timeline } from "./timeline";

// staggered sub-ranges of the photos beat, one per photo
const SLOTS = PHOTOS.map((_, i) => {
  const [a, b] = BEATS.photos;
  const span = b - a;
  const start = a + (i / PHOTOS.length) * span * 0.55;
  return { start, end: start + span * 0.5 };
});

export function Polaroids({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  // Custom loader subclass that applies colorSpace + anisotropy inside load(),
  // so the mutation happens before the hook ever returns the value — this
  // satisfies react-hooks/immutability which prohibits mutating hook-returned refs.
  const ConfiguredTextureLoader = useMemo(() => {
    return class extends THREE.TextureLoader {
      load(
        url: string,
        onLoad?: (data: THREE.Texture<HTMLImageElement>) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (err: unknown) => void,
      ): THREE.Texture<HTMLImageElement> {
        return super.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 4;
            onLoad?.(tex);
          },
          onProgress,
          onError,
        );
      }
    };
  }, []);
  const textures = useLoader(ConfiguredTextureLoader, PHOTOS.map((p) => p.src));

  const rigs = useMemo(
    () =>
      PHOTOS.map((_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        drift: 0.6 + (i % 3) * 0.35,
        tilt: ((i * 37) % 13) / 13 - 0.5,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    const beatT = seg(t.p, BEATS.photos[0], BEATS.photos[1]);
    g.visible = t.opened && t.intro >= 1 && beatT > 0 && t.p < BEATS.fold[0] + 0.02;
    if (!g.visible) return;

    g.children.forEach((child, i) => {
      const slot = SLOTS[i];
      const rig = rigs[i];
      if (!slot || !rig) return;
      const k = smooth(seg(t.p, slot.start, slot.end));
      child.position.set(
        rig.side * (0.4 + k * 1.9) * rig.drift,
        (k - 0.5) * 1.6 * rig.tilt + Math.sin(clock.elapsedTime * 0.8 + i) * 0.05,
        -0.5 + k * 6.5,
      );
      child.rotation.z = rig.tilt * 0.5 * (1 - k * 0.4);
      child.rotation.y = rig.side * 0.25 * (1 - k);
      const fadeOut = k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15;
      const opacity = Math.min(1, k * 4) * fadeOut;
      child.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (mesh.isMesh) (mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
      });
    });
  });

  return (
    <group ref={root} visible={false}>
      {PHOTOS.map((photo, i) => {
        const landscape = photo.width >= photo.height;
        const w = landscape ? 1.5 : 1.1;
        const h = (w * photo.height) / photo.width;
        return (
          <group key={photo.src}>
            {/* white polaroid frame */}
            <mesh position={[0, -0.06, -0.001]}>
              <planeGeometry args={[w + 0.12, h + 0.24]} />
              <meshStandardMaterial color="#faf6ec" roughness={0.9} transparent opacity={0} />
            </mesh>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial map={textures[i]} roughness={0.7} transparent opacity={0} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
