// Single source of truth for every color used in the 3D scene and its
// canvas textures. Add the gold accent + light colors here, not inline.
export const PALETTE = {
  beige: "#f1e9da",
  beigeWarm: "#e8dfc9",
  beigeDeep: "#e3d9c2",
  ink: "#2f3a22",
  olive: "#6b7a4b",
  oliveSoft: "#8b9968",
  // NEW — single warm accent for focal points (seal ring, pin, arc, rules)
  gold: "#c8a96a",
  goldDeep: "#a8884a",
  // lighting
  lightKey: "#fff3df", // warm key
  lightFill: "#cfd6c0", // cool hemisphere top
  lightGround: "#b9b49a", // hemisphere ground
  fogFar: "#e6e0cf", // slightly cooler/darker than beige → depth
} as const;
