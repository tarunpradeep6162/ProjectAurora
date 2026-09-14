/**
 * The five little 3D scenes behind Chapter 03's timeline, ported from the
 * original Project Aurora — a terrain patch, themed vegetation and weather,
 * a signature object and two-point lighting per timeline moment. Order
 * matches `timeline` in content.ts exactly; title/caption text lives there,
 * not here.
 */

export type VegetationKind = "blossom" | "reed";
export type WeatherKind = "petals" | "lanterns" | "spray" | "rain" | "motes";
export type IslandObjectName =
  | "chair"
  | "paperBoat"
  | "musicBox"
  | "blossomTree"
  | "lantern"
  | "waterfall"
  | "healingCrystals"
  | "firstMeeting";

export type IslandScene = {
  terrain: string;
  vegetation: { color: string; count: number; kind: VegetationKind };
  weather: { kind: WeatherKind; color: string; count: number };
  objects: IslandObjectName[];
  light: { key: string; rim: string; intensity: number };
  crystal: string;
};

/** One entry per `timeline` entry, in the same order. */
export const ISLAND_SCENES: IslandScene[] = [
  // First Meeting — cherry blossoms drifting over warm dusk light.
  {
    terrain: "#6b4a63",
    vegetation: { color: "#ffc3e0", count: 22, kind: "blossom" },
    weather: { kind: "petals", color: "#ffd0e6", count: 40 },
    objects: ["blossomTree", "firstMeeting"],
    light: { key: "#ffd9b3", rim: "#ff9ecb", intensity: 3.4 },
    crystal: "#ffb3d9",
  },
  // First Conversation — lantern light over still water.
  {
    terrain: "#3f3a6b",
    vegetation: { color: "#ffe0a8", count: 18, kind: "reed" },
    weather: { kind: "lanterns", color: "#ffd28a", count: 26 },
    objects: ["paperBoat", "lantern"],
    light: { key: "#ffcf8a", rim: "#8ab6ff", intensity: 3.8 },
    crystal: "#ffd08a",
  },
  // First Adventure — a waterfall's mist, cool and bright.
  {
    terrain: "#2f5a5e",
    vegetation: { color: "#8fe6c8", count: 26, kind: "reed" },
    weather: { kind: "spray", color: "#c9f4ff", count: 46 },
    objects: ["waterfall", "chair"],
    light: { key: "#a8f0ff", rim: "#5be0e6", intensity: 3.4 },
    crystal: "#8fe6ff",
  },
  // The Hard Days — rain, and something steady to hold onto.
  {
    terrain: "#33304a",
    vegetation: { color: "#8f9ad6", count: 14, kind: "reed" },
    weather: { kind: "rain", color: "#b9c6ff", count: 70 },
    objects: ["healingCrystals", "chair"],
    light: { key: "#8fa0d6", rim: "#6f7bb5", intensity: 2.4 },
    crystal: "#b9c6ff",
  },
  // Celebration — golden motes and a blossom tree in bloom again.
  {
    terrain: "#6d5432",
    vegetation: { color: "#ffdca8", count: 24, kind: "blossom" },
    weather: { kind: "motes", color: "#ffe3b0", count: 44 },
    objects: ["musicBox", "blossomTree"],
    light: { key: "#ffd79a", rim: "#ffb45c", intensity: 4.2 },
    crystal: "#ffd79a",
  },
];

/**
 * Where each signature object sits, in its own unscaled geometry units — the
 * original's exact offsets. `IslandObjects` shrinks the whole set (geometry
 * and offsets together) onto the smaller island via one group scale, so
 * these numbers never need converting.
 */
export const OBJECT_OFFSETS: Record<IslandObjectName, [number, number, number]> = {
  chair: [2.4, 0.8, 1.6],
  paperBoat: [-2.2, 1.1, 1.9],
  musicBox: [2.2, 0.8, -1.4],
  blossomTree: [-2.6, 0.8, -1.2],
  lantern: [2.6, 1.2, 1.2],
  waterfall: [-3.1, 0.4, -0.6],
  healingCrystals: [2.3, 0.8, 1.4],
  firstMeeting: [0.4, 0.78, 1.5],
};

/**
 * Everything below is authored at the original scene's scale (island radius
 * 5) and shrunk by this factor to sit as a small vignette in this project's
 * quieter cosmic scene rather than a landscape. Applied once, uniformly, so
 * every extracted constant (offsets, light distances, particle radii) can
 * stay exactly as recovered.
 */
export const WORLD_SCALE = 0.25;
export const ISLAND_RADIUS = 5 * WORLD_SCALE;
