"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import type { RefObject } from "react";
import { PHOTOS } from "@/data/photos";
import { BEATS, lerp, seg, smooth, type Timeline } from "./timeline";

// Each photo owns a sequential slice of the photos beat and plays as a large
// centered "hero" still. Windows are padded so neighbours crossfade.
const SPAN = BEATS.photos[1] - BEATS.photos[0];
const SLOT = SPAN / PHOTOS.length;
const SLOTS = PHOTOS.map((_, i) => {
  const core = BEATS.photos[0] + i * SLOT;
  // small overlap so neighbours crossfade briefly, but mostly one at a time
  return { start: core - SLOT * 0.08, end: core + SLOT * 1.08 };
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

  // Each photo drifts a hair in its own direction (Ken Burns), alternating.
  const rigs = useMemo(
    () =>
      PHOTOS.map((_, i) => ({
        dir: i % 2 === 0 ? -1 : 1,
        rot: (((i * 37) % 7) / 7 - 0.5) * 0.05, // ±0.025 rad, barely tilted
      })),
    [],
  );

  useFrame(() => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    g.visible = t.opened && t.intro >= 1 && t.p > BEATS.photos[0] - 0.02 && t.p < BEATS.fold[0] + 0.02;
    if (!g.visible) return;

    g.children.forEach((child, i) => {
      const slot = SLOTS[i];
      const rig = rigs[i];
      if (!slot || !rig) return;
      // tt: 0..1 across this photo's padded window
      const tt = seg(t.p, slot.start, slot.end);

      // Each photo is "drawn out of the invitation": it starts small, low and
      // set back, then rises + grows toward the viewer over the first ~60% of
      // its window (slow, fully scroll-paced), holds with a faint Ken Burns
      // push, then lifts away and fades as the next one is drawn out.
      const enter = smooth(Math.min(1, tt / 0.6)); // slow draw-out
      const exit = smooth(Math.max(0, (tt - 0.82) / 0.18)); // lift away at the end
      const fade = smooth(Math.min(1, tt / 0.28)) * (1 - exit);
      child.visible = fade > 0.001;
      if (!child.visible) return;

      const ken = smooth(tt) * 0.04; // gentle hold-phase push
      child.scale.setScalar(lerp(0.5, 1, enter) * (1 + ken) * (1 - exit * 0.08));
      child.position.set(
        rig.dir * (tt - 0.5) * 0.16, // gentle lateral drift
        lerp(-0.55, 0.1, enter) + exit * 0.3, // rise out of the invitation, ease away
        lerp(2.0, 3.3, enter), // drawn forward toward the viewer
      );
      child.rotation.z = rig.rot * (1 - enter * 0.6);

      child.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (mesh.isMesh) (mesh.material as THREE.MeshBasicMaterial).opacity = fade;
      });
    });
  });

  return (
    <group ref={root} visible={false}>
      {PHOTOS.map((photo, i) => {
        const landscape = photo.width >= photo.height;
        // sized to sit fully inside a portrait phone frame (no edge crop):
        // landscape photos are limited by the phone's narrow width.
        const w = landscape ? 2.7 : 2.1;
        const h = (w * photo.height) / photo.width;
        return (
          <group key={photo.src} visible={false}>
            {/* thin cream print border, sitting just behind the photo */}
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[w + 0.16, h + 0.16]} />
              <meshBasicMaterial color="#faf6ec" transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* the photo — unlit so it stays bright and true-color on the
                dark stage instead of being dimmed by the scene lighting */}
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial map={textures[i]} transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
