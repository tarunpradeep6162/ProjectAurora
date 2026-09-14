import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT = "Project Aurora — For Dheepika — 25 November";

/**
 * The social card, rendered at build/request time by `next/og` rather than
 * shipped as a binary so it can never drift out of sync with the site's
 * palette tokens.
 *
 * Deliberately contains no photography and nothing private: a link to this
 * site can be pasted into any chat app, and whatever unfurls there is
 * visible to everyone in that conversation. The real photographs and the
 * letter stay behind the link.
 */
const STARS: Array<[number, number, number, number]> = [
  // x%, y%, size px, opacity
  [8, 18, 3, 0.5],
  [14, 62, 2, 0.35],
  [21, 33, 2, 0.45],
  [27, 78, 3, 0.3],
  [34, 12, 2, 0.4],
  [41, 52, 2, 0.28],
  [49, 22, 3, 0.35],
  [57, 71, 2, 0.3],
  [63, 38, 2, 0.42],
  [69, 15, 3, 0.34],
  [76, 60, 2, 0.38],
  [82, 29, 3, 0.46],
  [88, 74, 2, 0.3],
  [93, 44, 3, 0.4],
  [96, 20, 2, 0.28],
  [4, 46, 2, 0.32],
];

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#06050b",
          backgroundImage:
            "radial-gradient(ellipse 120% 90% at 50% 118%, #4a1f3a 0%, rgba(74,31,58,0) 62%), radial-gradient(ellipse 70% 60% at 78% -12%, #241333 0%, rgba(36,19,51,0) 70%)",
        }}
      >
        {STARS.map(([x, y, size, opacity], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: "#f6eaf1",
              opacity,
            }}
          />
        ))}

        {/* A single quiet arc, echoing the site's moon sitting off-frame. */}
        <div
          style={{
            position: "absolute",
            right: -150,
            top: -190,
            width: 460,
            height: 460,
            borderRadius: 460,
            backgroundColor: "#c76a97",
            opacity: 0.12,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 84,
            letterSpacing: 22,
            color: "#f6eaf1",
            fontWeight: 600,
          }}
        >
          PROJECT AURORA
        </div>

        <div
          style={{
            display: "flex",
            width: 220,
            height: 1,
            backgroundColor: "#e685ad",
            opacity: 0.6,
            marginTop: 38,
            marginBottom: 38,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 34,
            letterSpacing: 14,
            color: "#e685ad",
          }}
        >
          FOR DHEEPIKA
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 10,
            color: "#e3c3d8",
            opacity: 0.72,
            marginTop: 22,
          }}
        >
          25 NOVEMBER
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
