"use client";

import * as THREE from "three";
import { WORLD_LAND_PATHS } from "@/data/world-paths";
import { LEBANON_BOUNDARY_LL } from "@/data/lebanon-boundary";
import { PALETTE } from "@/lib/palette";

const COL = PALETTE;

/** Resolve the real (hashed) Cormorant family name from the .font-display class. */
function displayFontFamily(): string {
  const el = document.createElement("span");
  el.className = "font-display";
  el.style.cssText = "position:absolute;visibility:hidden";
  document.body.appendChild(el);
  const fam = getComputedStyle(el).fontFamily;
  el.remove();
  return fam || "Georgia, serif";
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function asTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Subtle paper grain, tileable enough at this scale. */
export function makePaperTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = COL.beigeWarm;
  ctx.fillRect(0, 0, 512, 512);
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = asTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Card face, 3:4. Redraws once webfonts are ready (first paint uses the
 * serif fallback for a frame or two, then needsUpdate swaps it).
 */
export function makeCardTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 1365;
  const { canvas, ctx } = makeCanvas(W, H);
  const tex = asTexture(canvas);

  const draw = () => {
    const display = displayFontFamily();
    ctx.fillStyle = COL.beigeWarm;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = COL.ink;
    ctx.font = `600 110px ${display}`;
    ctx.fillText("Suzane & Amine", W / 2, 560);
    ctx.fillStyle = COL.olive;
    ctx.font = "500 34px Inter, system-ui, sans-serif";
    const spaced = (s: string) => s.split("").join("  ");
    ctx.fillText(spaced("ARE GETTING MARRIED"), W / 2, 640);
    ctx.fillStyle = COL.olive;
    ctx.fillRect(W / 2 - 80, 720, 160, 2);
    ctx.fillStyle = COL.ink;
    ctx.font = `500 72px ${display}`;
    ctx.fillText("Saturday", W / 2, 850);
    ctx.font = `500 88px ${display}`;
    ctx.fillText("August 29, 2026", W / 2, 960);
    ctx.fillStyle = COL.olive;
    ctx.font = "500 30px Inter, system-ui, sans-serif";
    ctx.fillText(spaced("NAHR EL KALB · LEBANON"), W / 2, 1040);
    tex.needsUpdate = true;
  };

  draw();
  document.fonts.ready.then(draw);
  return tex;
}

/** Envelope front face (5:3) with the guest label. */
export function makeEnvelopeTexture(label: string): THREE.CanvasTexture {
  const W = 1250;
  const H = 750;
  const { canvas, ctx } = makeCanvas(W, H);
  const tex = asTexture(canvas);

  const draw = () => {
    const display = displayFontFamily();
    ctx.fillStyle = COL.beigeWarm;
    ctx.fillRect(0, 0, W, H);
    // back-fold V seam
    ctx.strokeStyle = COL.olive;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(W / 2, 400);
    ctx.lineTo(W - 20, 30);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COL.ink;
    ctx.textAlign = "center";
    ctx.font = `500 64px ${display}`;
    ctx.fillText(label, W / 2, 600);
    tex.needsUpdate = true;
  };

  draw();
  document.fonts.ready.then(draw);
  return tex;
}

/**
 * Lebanon close-up as vintage travel cartography: paper-cutout landmass with
 * a soft drop shadow over a waved sea, mountain ridge marks, dashed coastal
 * road, and Cormorant labels. Redraws when webfonts are ready.
 */
export function makeLebanonTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 2172; // decal aspect: 1.65° lon × 1.75° lat in equirect
  const { canvas, ctx } = makeCanvas(W, H);
  const tex = asTexture(canvas);
  const LON0 = 35.0, LON1 = 36.65, LAT0 = 34.75, LAT1 = 33.0; // top → bottom
  const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
  const py = (lat: number) => ((lat - LAT0) / (LAT1 - LAT0)) * H;

  const tracePath = () => {
    ctx.beginPath();
    LEBANON_BOUNDARY_LL.forEach(([lat, lon], i) => {
      if (i === 0) ctx.moveTo(px(lon), py(lat));
      else ctx.lineTo(px(lon), py(lat));
    });
    ctx.closePath();
  };

  const draw = () => {
    const fam = displayFontFamily();

    // sea
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e5dcc3";
    ctx.fillRect(0, 0, W, H);

    // gentle wave strokes across the sea
    ctx.strokeStyle = "rgba(107,122,75,0.10)";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 30; i++) {
      const y = (i / 30) * H + 22;
      ctx.beginPath();
      for (let x = 0; x < W * 0.55; x += 26) {
        const yy = y + Math.sin(x / 95 + i * 1.7) * 6;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // paper-cutout drop shadow under the landmass
    ctx.save();
    ctx.translate(10, 14);
    tracePath();
    ctx.filter = "blur(14px)";
    ctx.fillStyle = "rgba(47,58,34,0.16)";
    ctx.fill();
    ctx.restore();
    ctx.filter = "none";

    // landmass
    tracePath();
    ctx.fillStyle = "#eee5d1";
    ctx.fill();
    ctx.lineJoin = "round";
    ctx.strokeStyle = COL.olive;
    ctx.lineWidth = 5;
    ctx.stroke();

    // land detail, clipped to the boundary
    ctx.save();
    tracePath();
    ctx.clip();
    // paper speckle
    ctx.fillStyle = "rgba(107,122,75,0.05)";
    for (let i = 0; i < 1800; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 3, 3);
    }
    // Mount Lebanon ridge marks, running NE→SW
    ctx.strokeStyle = "rgba(107,122,75,0.20)";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const x0 = px(35.72 + t * 0.5);
      const y0 = py(34.42 - t * 1.05);
      ctx.beginPath();
      ctx.moveTo(x0 - 34, y0 + 22);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x0 + 34, y0 + 22);
      ctx.stroke();
    }
    ctx.restore();

    // coastal road Suzane's home → L'Heritage Venue (keep in sync with
    // ROAD_LL in flight-path.ts — the wedding car drives these waypoints)
    const road: ReadonlyArray<readonly [number, number]> = [
      [33.8120051, 35.5429266],
      [33.852, 35.553],
      [33.905, 35.583],
      [33.935, 35.598],
      [33.9514617, 35.6032562],
    ];
    ctx.beginPath();
    road.forEach(([lat, lon], i) => {
      if (i === 0) ctx.moveTo(px(lon), py(lat));
      else ctx.lineTo(px(lon), py(lat));
    });
    ctx.strokeStyle = "rgba(47,58,34,0.5)";
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 16]);
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.setLineDash([]);

    // Beirut dot + label
    const bx = px(35.5018);
    const by = py(33.8938);
    ctx.fillStyle = COL.ink;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `500 44px ${fam}`;
    ctx.textAlign = "right";
    ctx.fillText("Beirut", bx - 24, by + 16);

    // home + venue labels (markers themselves are 3D)
    const hx = px(35.5429266);
    const hy = py(33.8120051);
    const vx = px(35.6032562);
    const vy = py(33.9514617);
    ctx.font = `italic 500 46px ${fam}`;
    ctx.textAlign = "left";
    ctx.fillText("Suzane’s home", hx + 40, hy + 64);
    // venue label sits over the sea so it survives narrow portrait crops
    ctx.textAlign = "right";
    ctx.fillText("L’Heritage Venue", vx - 44, vy - 30);
    ctx.globalAlpha = 1;

    // sea lettering, set along the coast
    ctx.save();
    ctx.translate(px(35.07), py(33.95));
    ctx.rotate(-1.05);
    ctx.font = `italic 400 52px ${fam}`;
    ctx.fillStyle = "rgba(107,122,75,0.5)";
    ctx.textAlign = "left";
    ctx.fillText("M e d i t e r r a n e a n   S e a", 0, 0);
    ctx.restore();

    tex.needsUpdate = true;
  };

  draw();
  document.fonts.ready.then(draw);
  return tex;
}

/**
 * Stylized paper world map, 2048x1024, drawn from the same Natural Earth
 * paths the old SVG map used (equirect 720x360 coordinate space).
 */
export function makeMapTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 1024;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#ede4d0";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.scale(W / 720, H / 360);
  for (const d of WORLD_LAND_PATHS) {
    const path = new Path2D(d);
    ctx.fillStyle = COL.oliveSoft;
    ctx.globalAlpha = 0.45;
    ctx.fill(path);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = COL.olive;
    ctx.lineWidth = 0.4;
    ctx.stroke(path);
  }
  ctx.restore();
  // faint graticule
  ctx.strokeStyle = COL.olive;
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += W / 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += H / 12) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // city labels so the takeoff and destination read on the map
  const label = (text: string, lon: number, lat: number, dx: number, dy: number) => {
    const x = ((lon + 180) / 360) * W + dx;
    const y = ((90 - lat) / 180) * H + dy;
    ctx.fillText(text, x, y);
  };
  ctx.fillStyle = COL.ink;
  ctx.globalAlpha = 0.85;
  ctx.font = "500 16px Georgia, serif";
  ctx.textAlign = "left";
  label("Vancouver", -123.1, 49.2, 9, -7);
  label("Beirut", 35.5, 33.9, 10, 5);
  ctx.globalAlpha = 1;
  return asTexture(canvas);
}
