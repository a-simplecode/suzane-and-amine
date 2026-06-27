import * as THREE from "three";

// The map plane maps the 720x360 equirect space onto a MAP_W x MAP_H plane
// lying in XZ at y = MAP_Y. +X = east, +Z = south (image v increases south).
export const MAP_W = 36;
export const MAP_H = 18;
export const MAP_Y = -1.6;

export function mapPoint(lon: number, lat: number, alt = 0): THREE.Vector3 {
  const u = (lon + 180) / 360;
  const v = (90 - lat) / 180;
  return new THREE.Vector3((u - 0.5) * MAP_W, MAP_Y + alt, (v - 0.5) * MAP_H);
}

export const VANCOUVER = mapPoint(-123.1, 49.2);
export const BEIRUT = mapPoint(35.5, 33.9);
export const VENUE = mapPoint(35.6033, 33.9515);

/** Where the card drifts to and folds, hovering above Vancouver. */
export const FOLD_POS = VANCOUVER.clone().add(new THREE.Vector3(0, 1.3, 0));

// ── Lebanon detail decal ────────────────────────────────────────────────
export const LEB_SCALE = 6;
export const LEB_CENTER = { lat: 33.8716, lon: 35.8547 };

/** Project lon/lat into decal space: exaggerated LEB_SCALE× around LEB_CENTER. */
export function lebPoint(lon: number, lat: number, alt = 0): THREE.Vector3 {
  const c = mapPoint(LEB_CENTER.lon, LEB_CENTER.lat);
  const p = mapPoint(lon, lat);
  const out = c.clone().add(p.sub(c).multiplyScalar(LEB_SCALE));
  out.y = MAP_Y + 0.012 + alt;
  return out;
}

export const VENUE_PIN = lebPoint(35.6033, 33.9515);
/** Suzane's home — where the paper plane lands. */
export const HOME_LL = { lat: 33.8120051, lon: 35.5429266 };
export const HOME_PIN = lebPoint(HOME_LL.lon, HOME_LL.lat);
export const LEB_DECAL_CENTER = lebPoint(LEB_CENTER.lon, LEB_CENTER.lat);
// decal plane spans Lebanon's bbox (lon 35.0–36.65, lat 33.0–34.75) at LEB_SCALE
export const LEB_DECAL_W = (1.65 / 360) * MAP_W * LEB_SCALE; // ≈ 0.99
export const LEB_DECAL_H = (1.75 / 180) * MAP_H * LEB_SCALE; // ≈ 1.05

export const FLIGHT_CURVE = new THREE.CatmullRomCurve3(
  [
    FOLD_POS.clone(),
    mapPoint(-100, 62, 2.0),
    mapPoint(-50, 66, 2.6),
    mapPoint(-5, 58, 2.4),
    mapPoint(20, 44, 1.4),
    BEIRUT.clone().add(new THREE.Vector3(0, 0.5, 0)),
    HOME_PIN.clone().add(new THREE.Vector3(0, 0.1, 0)),
  ],
  false,
  "catmullrom",
  0.5,
);

// Coastal road home → venue, drawn on the decal and driven by the wedding
// car. Waypoints follow the real route shape: Mansourieh → down past
// Beirut's edge → coastal highway north → Nahr El Kalb. Same lat/lon list
// is drawn into the Lebanon texture so the car tracks the painted road.
export const ROAD_LL: ReadonlyArray<readonly [number, number]> = [
  [HOME_LL.lat, HOME_LL.lon],
  [33.852, 35.553],
  [33.905, 35.583],
  [33.935, 35.598],
  [33.9514617, 35.6032562],
];

export const ROAD_CURVE = new THREE.CatmullRomCurve3(
  ROAD_LL.map(([lat, lon]) => lebPoint(lon, lat, 0.002)),
  false,
  "catmullrom",
  0.4,
);
