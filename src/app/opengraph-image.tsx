import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Suzane & Amine — August 29, 2026";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F1E9DA",
          color: "#2F3A22",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          padding: 80,
        }}
      >
        <div
          style={{
            width: 540,
            height: 320,
            background: "#E8DFC9",
            borderRadius: 12,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(47,58,34,0.18)",
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "#6B7A4B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F1E9DA",
              fontSize: 56,
              fontStyle: "italic",
              letterSpacing: 2,
            }}
          >
            S&amp;A
          </div>
        </div>
        <div
          style={{
            marginTop: 56,
            fontSize: 72,
            color: "#2F3A22",
            letterSpacing: 2,
          }}
        >
          Suzane &amp; Amine
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 32,
            color: "#6B7A4B",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 1,
          }}
        >
          Saturday · August 29, 2026
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 26,
            color: "#8B9968",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 1,
          }}
        >
          Nahr El Kalb, Lebanon
        </div>
      </div>
    ),
    size,
  );
}
