// מודלים תלת־ממדיים סכמטיים לכל המחשה. יחידות: מטרים. ציר x מזרח, z דרום, y למעלה.
// מספרי הקריאה (callouts) תואמים את מספרי הרשימה ואת השרטוט הדו־ממדי.

export type Kind = "mass" | "soft" | "glass" | "pad" | "tone" | "limit" | "dark" | "green" | "water" | "road" | "earth";
export type V3 = [number, number, number];

export type Prim =
  | { t: "box"; at: [number, number]; size: V3; y?: number; kind: Kind; grow?: boolean }
  | { t: "cyl"; at: [number, number]; r: number; h: number; y?: number; kind: Kind }
  | { t: "tree"; at: [number, number]; h: number; grow?: boolean }
  | { t: "line"; pts: V3[]; kind: "plot" | "limit" | "flow" | "dim"; dashed?: boolean };

export type Anim =
  | { kind: "rain"; area: [number, number, number, number] }
  | { kind: "mover"; prim: number; from: [number, number]; to: [number, number] }
  | { kind: "cars"; prims: number[] }
  | { kind: "flow"; path: V3[] }
  | { kind: "fill"; prim: number };

export interface Scene3 {
  ground: [number, number];
  prims: Prim[];
  callouts: { n: number; at: V3 }[];
  anims?: Anim[];
}

const plot = (w: number, d: number, x = 0, z = 0): Prim => ({ t: "line", kind: "plot", dashed: true, pts: [[x - w / 2, 0.02, z - d / 2], [x + w / 2, 0.02, z - d / 2], [x + w / 2, 0.02, z + d / 2], [x - w / 2, 0.02, z + d / 2], [x - w / 2, 0.02, z - d / 2]] });
const road = (z: number, w = 7, len = 60): Prim => ({ t: "box", at: [0, z], size: [len, 0.06, w], kind: "road" });

export const scenes3d: Record<string, Scene3> = {
  sheet: {
    ground: [40, 34],
    prims: [plot(30, 24), { t: "box", at: [0, -1], size: [18, 18, 12], kind: "mass", grow: true }, { t: "box", at: [5, 2], size: [3, 18.2, 3], kind: "tone", grow: true }, { t: "box", at: [-6, 6], size: [6, 0.4, 2], kind: "green" }, { t: "box", at: [7, -6.8], size: [2.5, 1, 0.6], kind: "glass", y: 9 }],
    callouts: [{ n: 2, at: [0, 19, -1] }, { n: 3, at: [-9, 10, 5] }, { n: 5, at: [9, 4, 5] }, { n: 6, at: [7, 11, -7] }, { n: 8, at: [-6, 1, 7] }, { n: 9, at: [5, 19, 2] }],
  },
  siteorg: {
    ground: [44, 36],
    prims: [plot(34, 26), road(17), { t: "box", at: [0, 0], size: [16, 9, 10], kind: "soft", grow: true }, { t: "box", at: [12, 8], size: [5, 3, 4], kind: "mass" }, { t: "box", at: [-12, 8], size: [5, 3, 3], kind: "mass" }, { t: "cyl", at: [9, -7], r: 0.4, h: 22, kind: "dark" }, { t: "box", at: [4, -7], size: [12, 0.4, 0.4], y: 21.5, kind: "dark" }, { t: "line", kind: "limit", dashed: true, pts: [[-17, 1, -13], [17, 1, -13], [17, 1, 13], [-17, 1, 13], [-17, 1, -13]] }],
    callouts: [{ n: 1, at: [-17, 2.5, 0] }, { n: 2, at: [12, 4, 8] }, { n: 3, at: [9, 23, -7] }],
  },
  development: {
    ground: [44, 38],
    prims: [plot(32, 26), road(17), { t: "box", at: [0, 15], size: [44, 0.12, 3], kind: "pad" }, { t: "box", at: [2, -2], size: [16, 12, 11], kind: "mass", grow: true }, { t: "box", at: [-12, 0], size: [6, 0.3, 24], kind: "green" }, ...[-9, -3, 3, 9].map((z) => ({ t: "tree" as const, at: [-12, z] as [number, number], h: 6 })), { t: "box", at: [12, 9], size: [6, 0.15, 6], kind: "pad" }, { t: "cyl", at: [12, -10], r: 0.8, h: 1.2, kind: "tone" }],
    callouts: [{ n: 3, at: [10, 1, 15] }, { n: 4, at: [2, 13, -2] }, { n: 6, at: [2, 1, 12] }, { n: 7, at: [12, 2.5, -10] }, { n: 10, at: [-12, 8, -3] }],
    anims: [{ kind: "flow", path: [[2, 0.2, 4], [2, 0.2, 13]] }],
  },
  parking: {
    ground: [46, 36],
    prims: [plot(36, 26), road(17), ...Array.from({ length: 8 }, (_, i) => ({ t: "box" as const, at: [-14 + i * 4, -8] as [number, number], size: [2.5, 0.05, 5] as V3, kind: (i === 0 ? "glass" : i >= 6 ? "tone" : "pad") as Kind })), ...Array.from({ length: 6 }, (_, i) => ({ t: "box" as const, at: [-14 + i * 4, -8] as [number, number], size: [1.8, 1.4, 4] as V3, y: 0.05, kind: "dark" as Kind })), { t: "box", at: [0, 12.5], size: [5, 0.1, 3], kind: "limit" }],
    callouts: [{ n: 1, at: [-6, 2, -8] }, { n: 2, at: [-14, 2, -8] }, { n: 3, at: [10, 2, -8] }, { n: 6, at: [0, 1.5, 12.5] }, { n: 7, at: [14, 1, 17] }, { n: 8, at: [-4, 1, 14] }],
    anims: [{ kind: "cars", prims: [10, 11, 12, 13, 14, 15] }],
  },
  drainage: {
    ground: [44, 36],
    prims: [plot(32, 26), road(17), { t: "box", at: [3, -3], size: [16, 10, 11], kind: "mass", grow: true }, { t: "box", at: [-11, 6], size: [8, 0.3, 10], kind: "green" }, { t: "cyl", at: [-11, 6], r: 1.6, h: 3, y: -3, kind: "water" }, { t: "line", kind: "flow", pts: [[3, 0.3, 3], [3, 0.3, 9], [-11, 0.3, 9], [-11, 0.3, 6]] }, { t: "line", kind: "flow", pts: [[3, 0.3, 9], [3, 0.3, 13.5]] }, ...[9, 11.2, 13.4].map((z) => ({ t: "cyl" as const, at: [3, z] as [number, number], r: 0.5, h: 0.4, kind: "dark" as Kind }))],
    callouts: [{ n: 2, at: [-4, 1.5, 9] }, { n: 3, at: [3, 1.5, 11.2] }, { n: 6, at: [-11, 2.5, 6] }],
    anims: [{ kind: "rain", area: [-16, -13, 16, 13] }, { kind: "fill", prim: 4 }, { kind: "flow", path: [[3, 0.35, 3], [3, 0.35, 9], [-11, 0.35, 9], [-11, 0.35, 6]] }],
  },
  planting: {
    ground: [30, 24],
    prims: [{ t: "box", at: [-8, 0], size: [8, 9, 14], kind: "mass", grow: true }, { t: "box", at: [0, 9], size: [30, 0.15, 3], kind: "pad" }, { t: "box", at: [2, 0], size: [2, 0.05, 1], kind: "earth" }, { t: "tree", at: [2, 0], h: 7, grow: true }, { t: "cyl", at: [9, -4], r: 0.12, h: 6, kind: "dark" }, { t: "line", kind: "dim", pts: [[-4, 0.3, 0], [2, 0.3, 0]] }, { t: "line", kind: "dim", pts: [[2, 0.3, 0], [2, 0.3, 7.5]] }],
    callouts: [{ n: 1, at: [-1, 1.2, 0] }, { n: 2, at: [2, 1, 1.4] }, { n: 3, at: [4, 1, 3] }],
  },
  electric: {
    ground: [44, 36],
    prims: [plot(32, 26), road(17), { t: "box", at: [-2, -3], size: [16, 14, 11], kind: "mass", grow: true }, { t: "box", at: [11, -8], size: [5, 3, 4], kind: "tone" }, ...[-12, -4, 4, 12].map((x) => ({ t: "cyl" as const, at: [x, 11] as [number, number], r: 0.12, h: 5, kind: "dark" as Kind })), ...Array.from({ length: 4 }, (_, i) => ({ t: "box" as const, at: [-6 + i * 3.2, 7] as [number, number], size: [2.5, 0.05, 5] as V3, kind: "tone" as Kind }))],
    callouts: [{ n: 1, at: [-12, 6, 11] }, { n: 3, at: [11, 4.5, -8] }, { n: 4, at: [-1, 1.5, 7] }],
  },
  height: {
    ground: [30, 24],
    prims: [{ t: "box", at: [-3, 0], size: [10, 31, 10], kind: "mass", grow: true }, { t: "box", at: [-3, 0], size: [10.2, 0.3, 10.2], y: 29, kind: "limit" }, { t: "box", at: [6, 4], size: [4, 2.5, 3], kind: "tone" }, { t: "box", at: [0.5, 0], size: [2.6, 31.2, 3], kind: "soft" }],
    callouts: [{ n: 1, at: [-9, 29.5, 0] }, { n: 2, at: [6, 4, 4] }, { n: 5, at: [0.5, 32.5, 0] }],
  },
  waste: {
    ground: [46, 36],
    prims: [plot(34, 26), road(17), { t: "box", at: [4, -3], size: [18, 12, 12], kind: "mass", grow: true }, { t: "box", at: [-1, 4], size: [5, 3, 4], kind: "tone" }, { t: "cyl", at: [-12, 8], r: 1, h: 1.1, kind: "green" }, { t: "cyl", at: [-9.5, 8], r: 1, h: 1.1, kind: "water" }, { t: "box", at: [-30, 17], size: [8, 3, 2.5], kind: "tone" }],
    callouts: [{ n: 1, at: [4, 13.5, -3] }, { n: 5, at: [-11, 2.5, 8] }, { n: 6, at: [-1, 4.5, 4] }, { n: 7, at: [-11, 4, 17] }],
    anims: [{ kind: "mover", prim: 6, from: [-30, 17], to: [-11, 17] }],
  },
  water: {
    ground: [44, 36],
    prims: [plot(32, 26), road(17), { t: "box", at: [0, -3], size: [16, 12, 11], kind: "mass", grow: true }, { t: "line", kind: "flow", pts: [[-10, 0.3, 17], [-10, 0.3, 6], [-3, 0.3, 6], [-3, 0.3, 2.5]] }, { t: "box", at: [-10, 9], size: [1, 1, 1], kind: "tone" }, { t: "line", kind: "limit", pts: [[5, 0.25, 2.5], [5, 0.25, 6], [10, 0.25, 6], [10, 0.25, 17]] }, ...[[5, 6], [10, 6], [10, 12]].map(([x, z]) => ({ t: "cyl" as const, at: [x, z] as [number, number], r: 0.6, h: 0.3, kind: "dark" as Kind }))],
    callouts: [{ n: 3, at: [-6, 1.5, 6] }, { n: 4, at: [-10, 2, 9] }, { n: 6, at: [10, 1.5, 12] }],
    anims: [{ kind: "flow", path: [[-10, 0.35, 17], [-10, 0.35, 6], [-3, 0.35, 6], [-3, 0.35, 2.5]] }],
  },
  environment: {
    ground: [36, 28],
    prims: [{ t: "box", at: [2, -2], size: [14, 9, 10], kind: "mass", grow: true }, { t: "box", at: [-10, 4], size: [6, 2.5, 4], kind: "limit" }, { t: "box", at: [11, 6], size: [4, 2.2, 3], kind: "tone" }, { t: "box", at: [0, 10], size: [20, 0.3, 4], kind: "green" }, ...[-12, -9, -6].map((x) => ({ t: "cyl" as const, at: [x, -6] as [number, number], r: 0.15, h: 3, y: -3, kind: "dark" as Kind }))],
    callouts: [{ n: 1, at: [-9, 2, -6] }, { n: 3, at: [11, 3.5, 6] }, { n: 5, at: [-10, 4, 4] }, { n: 6, at: [0, 1.5, 10] }],
  },
  fire: {
    ground: [50, 40],
    prims: [{ t: "box", at: [-2, -6], size: [20, 31, 12], kind: "mass", grow: true }, road(16, 4), { t: "box", at: [-2, 6], size: [12, 0.12, 6], kind: "tone" }, { t: "cyl", at: [12, 2], r: 0.35, h: 1, kind: "limit" }, { t: "box", at: [-30, 16], size: [8, 3, 2.5], kind: "limit" }, { t: "line", kind: "dim", pts: [[-14, 0.3, 0], [-14, 0.3, 3]] }],
    callouts: [{ n: 1, at: [15, 1.5, 16] }, { n: 2, at: [-2, 1.5, 6] }, { n: 3, at: [-14, 1.5, 1.5] }, { n: 4, at: [12, 2.5, 2] }],
    anims: [{ kind: "mover", prim: 4, from: [-30, 16], to: [-2, 6] }],
  },
  mamad: {
    ground: [12, 10],
    prims: [
      { t: "box", at: [0, 0], size: [3.7, 0.25, 3.4], kind: "soft" },
      { t: "box", at: [0, -1.575], size: [3.7, 2.75, 0.25], kind: "mass", grow: true },
      { t: "box", at: [0, 1.575], size: [3.7, 2.75, 0.25], kind: "mass", grow: true },
      { t: "box", at: [-1.725, 0], size: [0.25, 2.75, 2.9], kind: "mass", grow: true },
      { t: "box", at: [1.725, 0], size: [0.25, 2.75, 2.9], kind: "mass", grow: true },
      { t: "box", at: [0, -1.6], size: [1, 1, 0.3], y: 1.1, kind: "glass" },
      { t: "box", at: [1.2, 1.6], size: [0.8, 2, 0.3], kind: "dark" },
    ],
    callouts: [{ n: 1, at: [0, 0.6, 0] }, { n: 3, at: [-1.725, 3.2, 0] }, { n: 5, at: [0, 2.4, -1.6] }, { n: 6, at: [1.2, 2.4, 1.6] }],
  },
};
