"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { BEATS, easeOut3, seg, smooth, type Timeline } from "./timeline";
import { makeLebanonTexture, makeMapTexture } from "./textures";
import {
  BEIRUT,
  FLIGHT_CURVE,
  HOME_PIN,
  LEB_DECAL_CENTER,
  LEB_DECAL_H,
  LEB_DECAL_W,
  MAP_H,
  MAP_W,
  MAP_Y,
  ROAD_CURVE,
  VANCOUVER,
  VENUE_PIN,
} from "./flight-path";

const CLOUD_COUNT = 10;

export function FlightMap({ tl }: { tl: RefObject<Timeline> }) {
  const root = useRef<THREE.Group>(null);
  const mapMat = useRef<THREE.MeshStandardMaterial>(null);
  const decalMat = useRef<THREE.MeshBasicMaterial>(null);
  const pin = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Group>(null);
  const cities = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Line>(null);
  const house = useRef<THREE.Group>(null);
  const car = useRef<THREE.Group>(null);
  const carTmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      zAxis: new THREE.Vector3(0, 0, 1),
    }),
    [],
  );

  const mapTex = useMemo(() => makeMapTexture(), []);
  const lebTex = useMemo(() => makeLebanonTexture(), []);

  // dashed flight trail drawn flat on the map, revealed by drawRange
  const trailLine = useMemo(() => {
    const pts = FLIGHT_CURVE.getPoints(200).map((p) => p.clone().setY(MAP_Y + 0.02));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      geo,
      new THREE.LineDashedMaterial({
        color: "#6b7a4b",
        dashSize: 0.3,
        gapSize: 0.18,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    line.computeLineDistances();
    line.geometry.setDrawRange(0, 0);
    return line;
  }, []);

  const cloudTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, "rgba(255,253,246,0.85)");
    g.addColorStop(1, "rgba(255,253,246,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);

  const cloudRigs = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, (_, i) => ({
        anchor: FLIGHT_CURVE.getPointAt(0.12 + 0.74 * (i / CLOUD_COUNT)).clone(),
        off: new THREE.Vector3(Math.sin(i * 7) * 1.6, 0.5 + (i % 3) * 0.45, Math.cos(i * 5) * 1.3),
        scale: 1.2 + (i % 3) * 0.7,
        speed: 0.04 + (i % 4) * 0.015,
      })),
    [],
  );

  useFrame(({ camera, clock }) => {
    const t = tl.current;
    const g = root.current;
    if (!t || !g) return;
    g.visible = t.opened && t.p > BEATS.fold[0] - 0.02;
    if (!g.visible) return;

    // world-scale props (map, trail dashes, city dots) misread at decal
    // zoom — true-scale Cyprus next to the 6× Lebanon decal looks like a
    // stray blob — so everything world-scale fades out during the landing
    const zoomFade = 1 - smooth(seg(t.p, BEATS.land[0], BEATS.land[0] + 0.05));

    // map fades in as the camera pulls up for the fold, out at decal zoom
    if (mapMat.current) {
      mapMat.current.opacity =
        smooth(seg(t.p, BEATS.fold[0], BEATS.fold[0] + 0.1)) * zoomFade;
    }

    // trail follows the plane (mutated via ref — same object as trailLine)
    const ft = smooth(seg(t.p, BEATS.flight[0], BEATS.flight[1]));
    const trail = trailRef.current;
    if (trail) trail.geometry.setDrawRange(0, Math.max(0, Math.floor(ft * 201)));
    if (trail) {
      (trail.material as THREE.LineDashedMaterial).opacity = 0.85 * zoomFade;
      trail.visible = zoomFade > 0;
    }
    if (cities.current) {
      cities.current.visible = zoomFade > 0;
      cities.current.children.forEach((c) => {
        const mesh = c as THREE.Mesh;
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * zoomFade;
      });
    }

    // Lebanon decal fades in on final approach to the house
    const landT = seg(t.p, BEATS.land[0], BEATS.land[1]);
    const driveT = seg(t.p, BEATS.drive[0], BEATS.drive[1]);
    const at = seg(t.p, BEATS.arrive[0], BEATS.arrive[1]);
    if (decalMat.current) {
      decalMat.current.opacity = smooth(seg(t.p, BEATS.flight[1] - 0.06, BEATS.land[0] + 0.03));
    }

    // Suzane's home pops up as the plane lands
    if (house.current) {
      const hs = easeOut3(seg(landT, 0.25, 0.65));
      house.current.visible = hs > 0;
      house.current.scale.setScalar(Math.max(0.001, hs));
    }

    // wedding car: parked at the house after landing, drives during the
    // drive beat, parked at the venue after
    if (car.current) {
      car.current.visible = landT > 0.55;
      const d = smooth(driveT);
      ROAD_CURVE.getPointAt(d, carTmp.pos);
      car.current.position.copy(carTmp.pos);
      ROAD_CURVE.getTangentAt(Math.min(0.98, Math.max(0.02, d)), carTmp.tan);
      carTmp.tan.setY(0).normalize();
      carTmp.q.setFromUnitVectors(carTmp.zAxis, carTmp.tan);
      car.current.quaternion.copy(carTmp.q);
    }

    // venue pin drops once the car arrives
    if (pin.current) {
      pin.current.visible = at > 0.1;
      const drop = easeOut3(seg(at, 0.1, 0.55));
      pin.current.position.set(VENUE_PIN.x, VENUE_PIN.y + (1 - drop) * 0.2, VENUE_PIN.z);
    }
    if (ring.current) {
      const drop = easeOut3(seg(at, 0.1, 0.55));
      ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = drop * 0.5;
    }

    // clouds: billboard toward the camera, slow drift (hidden at decal zoom)
    if (clouds.current) {
      clouds.current.visible = zoomFade > 0;
      clouds.current.children.forEach((c, i) => {
        const mesh = c as THREE.Mesh;
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * zoomFade;
        const rig = cloudRigs[i];
        if (!rig) return;
        c.quaternion.copy(camera.quaternion);
        c.position.copy(rig.anchor).add(rig.off);
        c.position.x += Math.sin(clock.elapsedTime * rig.speed + i * 2) * 0.4;
      });
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* paper world map */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, MAP_Y, 0]}>
        <planeGeometry args={[MAP_W, MAP_H]} />
        <meshStandardMaterial ref={mapMat} map={mapTex} transparent opacity={0} roughness={1} depthWrite={false} />
      </mesh>
      {/* city dots */}
      <group ref={cities}>
        {[VANCOUVER, BEIRUT].map((v, i) => (
          <mesh key={i} position={[v.x, MAP_Y + 0.015, v.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.09, 24]} />
            <meshBasicMaterial color="#2f3a22" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      {/* dashed trail */}
      <primitive object={trailLine} ref={trailRef} />
      {/* Lebanon detail decal */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[LEB_DECAL_CENTER.x, MAP_Y + 0.01, LEB_DECAL_CENTER.z]}
      >
        <planeGeometry args={[LEB_DECAL_W, LEB_DECAL_H]} />
        <meshBasicMaterial ref={decalMat} map={lebTex} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Suzane's home — landing spot */}
      <group ref={house} position={[HOME_PIN.x, HOME_PIN.y, HOME_PIN.z]} visible={false}>
        {/* grounding shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.003, 0.001, 0.003]}>
          <circleGeometry args={[0.021, 24]} />
          <meshBasicMaterial color="#2f3a22" transparent opacity={0.1} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.009, 0]}>
          <boxGeometry args={[0.026, 0.018, 0.02]} />
          <meshStandardMaterial color="#f6efdd" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.025, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.02, 0.016, 4]} />
          <meshStandardMaterial color="#7d8b5e" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0.008, 0.031, 0]}>
          <boxGeometry args={[0.0035, 0.008, 0.0035]} />
          <meshStandardMaterial color="#8a8266" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.005, 0.0101]}>
          <boxGeometry args={[0.0055, 0.01, 0.001]} />
          <meshStandardMaterial color="#2f3a22" roughness={0.8} />
        </mesh>
        <mesh position={[-0.0075, 0.011, 0.0101]}>
          <boxGeometry args={[0.0048, 0.0048, 0.001]} />
          <meshStandardMaterial color="#8a8266" roughness={0.7} />
        </mesh>
      </group>
      {/* wedding car — olive body, white ribbon V + bow on the hood */}
      <group ref={car} visible={false} scale={0.75}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0008, 0]}>
          <circleGeometry args={[0.013, 20]} />
          <meshBasicMaterial color="#2f3a22" transparent opacity={0.13} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.0095, 0.005, 0.02]} />
          <meshStandardMaterial color="#6b7a4b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.0092, -0.0016]}>
          <boxGeometry args={[0.008, 0.004, 0.0095]} />
          <meshStandardMaterial color="#8b9968" roughness={0.55} />
        </mesh>
        {[
          [0.005, 0.0064],
          [-0.005, 0.0064],
          [0.005, -0.0064],
          [-0.005, -0.0064],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.0024, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0024, 0.0024, 0.0016, 12]} />
            <meshStandardMaterial color="#2f3a22" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0.0018, 0.0074, 0.0062]} rotation={[0, -0.42, 0]}>
          <boxGeometry args={[0.0008, 0.0004, 0.0072]} />
          <meshStandardMaterial color="#faf6ec" roughness={0.6} />
        </mesh>
        <mesh position={[-0.0018, 0.0074, 0.0062]} rotation={[0, 0.42, 0]}>
          <boxGeometry args={[0.0008, 0.0004, 0.0072]} />
          <meshStandardMaterial color="#faf6ec" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.0076, 0.0098]}>
          <sphereGeometry args={[0.0012, 10, 8]} />
          <meshStandardMaterial color="#faf6ec" roughness={0.6} />
        </mesh>
      </group>
      {/* venue pin: cone + head */}
      <group ref={pin} visible={false}>
        <mesh position={[0, 0.018, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.0065, 0.025, 24]} />
          <meshStandardMaterial color="#6b7a4b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.034, 0]}>
          <sphereGeometry args={[0.0085, 24, 16]} />
          <meshStandardMaterial color="#2f3a22" roughness={0.45} />
        </mesh>
      </group>
      {/* pulse ring */}
      <mesh
        ref={ring}
        position={[VENUE_PIN.x, VENUE_PIN.y + 0.003, VENUE_PIN.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.017, 0.022, 32]} />
        {/* depthWrite must stay off: at opacity 0 a depth-writing ring
            punches a ring-shaped hole through the decal below */}
        <meshBasicMaterial color="#6b7a4b" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* cloud wisps */}
      <group ref={clouds}>
        {cloudRigs.map((rig, i) => (
          <mesh key={i} scale={[rig.scale, rig.scale * 0.5, 1]}>
            <planeGeometry args={[1.6, 1]} />
            <meshBasicMaterial map={cloudTex} transparent depthWrite={false} opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
