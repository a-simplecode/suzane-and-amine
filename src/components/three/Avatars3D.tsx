"use client";

import { useMemo } from "react";
import { Billboard } from "@react-three/drei";
import { AVATARS } from "@/data/avatars";
import { makeAvatarTexture } from "./textures";

/** One framed portrait plane. `size` is world units (tiny on the map). */
function Portrait({ which, size }: { which: 0 | 1; size: number }) {
  const avatar = AVATARS[which];
  const tex = useMemo(() => makeAvatarTexture(avatar), [avatar]);
  const aspect = 256 / 320;
  return (
    <mesh>
      <planeGeometry args={[size * aspect, size]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

/** The two faces side by side, framed — used in the plane cockpit window. */
export function CoupleWindow({ size = 0.6 }: { size?: number }) {
  return (
    <group>
      <group position={[-size * 0.26, 0, 0]}>
        <Portrait which={0} size={size} />
      </group>
      <group position={[size * 0.26, 0, 0]}>
        <Portrait which={1} size={size} />
      </group>
    </group>
  );
}

/** A single billboarded portrait for a map dot. */
export function MapAvatar({
  position,
  which,
  size,
}: {
  position: [number, number, number];
  which: 0 | 1;
  size: number;
}) {
  return (
    <Billboard position={position}>
      <Portrait which={which} size={size} />
    </Billboard>
  );
}
