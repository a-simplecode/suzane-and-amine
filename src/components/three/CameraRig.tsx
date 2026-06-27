"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, lerp, seg, smooth, type Timeline } from "./timeline";
import { FLIGHT_CURVE, FOLD_POS, HOME_PIN, ROAD_CURVE, VENUE_PIN } from "./flight-path";

// High over the fold point, looking down — the paper sheet then reads
// against the map below it instead of vanishing into the beige sky/fog.
const FOLD_CAM_OFFSET = new THREE.Vector3(1.3, 4.3, 2.7);

export function CameraRig({ tl }: { tl: RefObject<Timeline> }) {
  const look = useRef(new THREE.Vector3(0, 0.1, 0));
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      lk: new THREE.Vector3(),
      pp: new THREE.Vector3(),
      tan: new THREE.Vector3(),
    }),
    [], // scratch vectors — mutated only inside useFrame, never during render
  );

  useFrame(({ camera }, dt) => {
    const t = tl.current;
    if (!t) return;
    const introE = smooth(t.intro);
    const photoT = smooth(seg(t.p, BEATS.photos[0], BEATS.photos[1]));
    const foldT = smooth(seg(t.p, BEATS.fold[0], BEATS.fold[1]));
    const flightT = seg(t.p, BEATS.flight[0], BEATS.flight[1]);
    const landT = smooth(seg(t.p, BEATS.land[0], BEATS.land[1]));
    const driveT = seg(t.p, BEATS.drive[0], BEATS.drive[1]);
    const arriveT = smooth(seg(t.p, BEATS.arrive[0], BEATS.arrive[1]));

    // Base viewing distance that fits the envelope (3.6 wide + margin) in
    // the horizontal field of view — portrait phones need the camera much
    // farther back than the 7-unit desktop framing.
    const pc = camera as THREE.PerspectiveCamera;
    const halfTan = Math.tan((pc.fov * Math.PI) / 360);
    const baseZ = Math.max(7, 2.3 / (halfTan * pc.aspect));

    if (flightT <= 0) {
      // intro dolly-in → photos pull → travel toward the fold viewpoint
      tmp.pos.set(0, 0.25 + 0.35 * photoT, baseZ - 0.8 * introE - 0.9 * photoT);
      tmp.lk.set(0, 0.1, 0);
      if (foldT > 0) {
        // travel during the first half of the fold beat so the camera is
        // already in place when the paper actually folds (second half)
        const foldCam = smooth(
          seg(t.p, BEATS.fold[0], (BEATS.fold[0] + BEATS.fold[1]) / 2),
        );
        tmp.pp.copy(FOLD_POS).add(FOLD_CAM_OFFSET);
        tmp.pos.lerp(tmp.pp, foldCam);
        tmp.lk.lerp(FOLD_POS, foldCam);
      }
    } else if (landT <= 0) {
      // chase cam behind and above the plane
      const ft = smooth(Math.min(1, flightT));
      FLIGHT_CURVE.getPointAt(ft, tmp.pp);
      FLIGHT_CURVE.getTangentAt(ft, tmp.tan).normalize();
      tmp.pos.copy(tmp.pp).addScaledVector(tmp.tan, -5.4);
      tmp.pos.setY(tmp.pos.y + 2.1);
      tmp.lk.copy(tmp.pp).addScaledVector(tmp.tan, 2.0);
    } else if (driveT <= 0) {
      // settle over Suzane's home as the plane lands — stays map-like,
      // mostly top-down so the cartography reads instead of raw geometry.
      // aFac pushes the camera higher on narrow (portrait) screens, where
      // the horizontal field is small and markers otherwise loom huge.
      const aFac = Math.max(1, 0.72 / pc.aspect);
      tmp.pos.set(
        HOME_PIN.x + lerp(0.3, 0.04, landT),
        HOME_PIN.y + lerp(1.7, 0.5 * aFac, landT),
        HOME_PIN.z + lerp(0.9, 0.2 * aFac, landT),
      );
      tmp.lk.copy(HOME_PIN);
    } else if (arriveT <= 0) {
      // high follow over the wedding car along the coastal road
      const aFac = Math.max(1, 0.72 / pc.aspect);
      const d = smooth(Math.min(1, driveT));
      ROAD_CURVE.getPointAt(d, tmp.pp);
      tmp.pos.set(tmp.pp.x + 0.03, tmp.pp.y + 0.46 * aFac, tmp.pp.z + 0.18 * aFac);
      tmp.lk.copy(tmp.pp);
    } else {
      // settle onto the venue pin
      const aFac = Math.max(1, 0.72 / pc.aspect);
      tmp.pos.set(
        VENUE_PIN.x + 0.02,
        VENUE_PIN.y + lerp(0.52, 0.44, arriveT) * aFac,
        VENUE_PIN.z + lerp(0.2, 0.16, arriveT) * aFac,
      );
      tmp.lk.copy(VENUE_PIN);
    }

    const k = 1 - Math.exp(-4.5 * dt);
    camera.position.lerp(tmp.pos, k);
    look.current.lerp(tmp.lk, k);
    camera.lookAt(look.current);
  });

  return null;
}
