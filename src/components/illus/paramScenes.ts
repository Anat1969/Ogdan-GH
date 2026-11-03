// מודלים תלת־ממדיים שנבנים מהנתונים שהמשתמש מזין במחשבון. יחידות: מטרים.
// כל מודל כולל קווי מידה (בבורדו) ותוויות טקסט, כדי שהמספרים יופיעו על ההמחשה.
import type { KMap } from "../../logic/constants";
import { calcDrainage, calcGreen, calcParking, calcWaste, calcWater, calcFee } from "../../logic/calculators";
import { calcDevObligation, calcFireAccess, calcMamad, calcProgramByUnits } from "../../logic/calculators2";
import type { Project } from "../../state/store";
import type { Prim, Scene3, V3 } from "./scenes3d";

const n = (v: string) => { const x = parseFloat(v); return Number.isFinite(x) && x > 0 ? x : 0; };
const f = (x: number, d = 0) => x.toLocaleString("he-IL", { maximumFractionDigits: d });

/** קו מידה עם תווית */
function dim(a: V3, b: V3, text: string): { prims: Prim[]; labels: Scene3["labels"] } {
  return { prims: [{ t: "line", kind: "dim", pts: [a, b] }], labels: [{ at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.6, (a[2] + b[2]) / 2], text, dim: true }] };
}

function site(plot: number, footprint: number, floors = 4) {
  const side = Math.sqrt(plot);
  const w = Math.sqrt(Math.max(footprint, 1)) * 1.25, d = Math.max(footprint, 1) / w;
  const prims: Prim[] = [
    { t: "line", kind: "plot", dashed: true, pts: [[-side / 2, 0.03, -side / 2], [side / 2, 0.03, -side / 2], [side / 2, 0.03, side / 2], [-side / 2, 0.03, side / 2], [-side / 2, 0.03, -side / 2]] },
  ];
  if (footprint > 0) prims.push({ t: "box", at: [side * 0.12, -side * 0.08], size: [w, Math.max(3, floors * 3.2), d], kind: "mass", grow: true });
  const d1 = dim([-side / 2, 0.1, side / 2 + 2], [side / 2, 0.1, side / 2 + 2], `${f(side, 1)} מ'`);
  return { side, w, d, prims: [...prims, ...d1.prims], labels: [...(d1.labels ?? [])] };
}

export function paramScene(tool: string, p: Project, k: KMap): Scene3 | null {
  const floors = n(p.floors) || 4;
  switch (tool) {
    case "drainage": {
      const r = calcDrainage(p.plot, p.footprint, p.green, k);
      if (!r) return null;
      const s = site(r.plot, r.building, floors);
      const gw = Math.min(s.side * 0.9, r.green / s.side);
      const pitR = Math.max(0.6, Math.sqrt(r.pitM3 / (Math.PI * 2)));
      const prims: Prim[] = [...s.prims, { t: "box", at: [-s.side / 2 + gw / 2, 0], size: [gw, 0.15, s.side * 0.98], kind: "green" }, { t: "cyl", at: [-s.side / 2 + gw / 2, s.side * 0.3], r: pitR, h: 2, y: -2, kind: "water" }];
      return {
        ground: [s.side * 1.6, s.side * 1.6], prims,
        labels: [...(s.labels ?? []), { at: [-s.side / 2 + gw / 2, 1.2, -s.side * 0.2], text: `ירוק ${f(r.green)} מ"ר (${f((r.green / r.plot) * 100)}%)` }, { at: [-s.side / 2 + gw / 2, 1.2, s.side * 0.3], text: `בור חלחול ${f(r.pitM3, 1)} מ"ק` }, { at: [s.side * 0.12, floors * 3.2 + 1.5, -s.side * 0.08], text: `ספיקת שיא ${f(r.peakLps, 1)} ל'/ש'` }],
        callouts: [], anims: [{ kind: "rain", area: [-s.side / 2, -s.side / 2, s.side / 2, s.side / 2] }, { kind: "fill", prim: prims.length - 1 }],
      };
    }
    case "green": {
      const r = calcGreen(p.plot, p.footprint, p.units, k);
      if (!r) return null;
      const s = site(r.plot, r.building, floors);
      const trees = Math.min(r.trees, 40);
      const prims: Prim[] = [...s.prims];
      for (let i = 0; i < trees; i++) prims.push({ t: "tree", at: [-s.side / 2 + 2 + (i % 6) * 2.8, -s.side / 2 + 3 + Math.floor(i / 6) * 3.2], h: 5, grow: true });
      return { ground: [s.side * 1.6, s.side * 1.6], prims, callouts: [], labels: [...(s.labels ?? []), { at: [-s.side / 2 + 8, 7, -s.side / 2 + 3], text: `${r.trees} עצים בוגרים` }, { at: [0, 1, s.side / 2 - 2], text: `שטח ירוק נדרש ${f(r.minGreen)} מ"ר` }] };
    }
    case "parking": {
      const r = calcParking(p.parking, p.standard, k);
      if (!r.hasInput) return null;
      const total = Math.min(r.grand, 120);
      const cols = Math.ceil(Math.sqrt(total * 2));
      const prims: Prim[] = [];
      for (let i = 0; i < total; i++) {
        const c = i % cols, row = Math.floor(i / cols);
        const kind = i < r.disabled ? "glass" : i < r.disabled + r.ev ? "tone" : i >= r.total ? "pad" : "pad";
        prims.push({ t: "box", at: [c * 2.6 - (cols * 2.6) / 2, row * 6.5], size: [2.4, 0.05, 5], kind });
      }
      const w = cols * 2.6, dd = Math.ceil(total / cols) * 6.5;
      const d1 = dim([-w / 2, 0.1, -3.5], [w / 2, 0.1, -3.5], `${cols} מקומות בשורה`);
      return { ground: [w + 12, dd + 14], prims: [...prims, ...d1.prims], callouts: [], labels: [...(d1.labels ?? []), { at: [0, 2, dd / 2], text: `${r.total} חניות · ${r.disabled} נכים · ${r.ev} טעינה · ${r.operational} תפעולי` }] };
    }
    case "waste": {
      const r = calcWaste(p.units, p.floors, k);
      if (!r) return null;
      const prims: Prim[] = [{ t: "box", at: [0, -6], size: [16, Math.max(6, floors * 3.2), 10], kind: "mass", grow: true }];
      const labels: Scene3["labels"] = [];
      if (r.compactors) {
        prims.push({ t: "box", at: [-6, 6], size: [6, 2.5, 2.5], kind: "green" }, { t: "box", at: [3, 6], size: [6, 2.5, 2.5], kind: "water" });
        labels.push({ at: [-6, 3.5, 6], text: `דחסנית ${r.compactors.wet} קוב` }, { at: [3, 3.5, 6], text: `דחסנית ${r.compactors.dry} קוב` });
      } else if (r.tamunim) {
        for (let i = 0; i < r.tamunim.wet; i++) prims.push({ t: "cyl", at: [-8 + i * 2.6, 6], r: 1, h: 1.2, kind: "green" });
        for (let i = 0; i < r.tamunim.dry; i++) prims.push({ t: "cyl", at: [-8 + (r.tamunim.wet + i) * 2.6 + 1, 6], r: 1, h: 1.2, kind: "water" });
        labels.push({ at: [-4, 2.6, 6], text: `טמונים ${r.tamunim.wet} רטובה + ${r.tamunim.dry} יבשה` });
      }
      labels.push({ at: [0, floors * 3.2 + 1.5, -6], text: `אצירה ${f(r.totalM3, 2)} קוב ל-${k["ws.days"]} ימים` });
      return { ground: [30, 26], prims, labels, callouts: [] };
    }
    case "water": {
      const r = calcWater(p.plot, p.footprint, p.irrigation, p.water, k);
      if (!r) return null;
      const s = site(r.plot, r.building, floors);
      return { ground: [s.side * 1.6, s.side * 1.6], prims: [...s.prims, { t: "line", kind: "flow", pts: [[-s.side / 2 - 3, 0.3, s.side / 2], [s.side * 0.12, 0.3, s.side / 2], [s.side * 0.12, 0.3, 0]] }], labels: [...(s.labels ?? []), { at: [-s.side / 4, 1.5, s.side / 2], text: `צינור ${r.pipe} · ${f(r.peakLps, 2)} ל'/ש'` }, { at: [s.side * 0.12, floors * 3.2 + 1.5, -s.side * 0.08], text: `${f(r.total)} מ"ק בשנה` }], callouts: [], anims: [{ kind: "flow", path: [[-s.side / 2 - 3, 0.35, s.side / 2], [s.side * 0.12, 0.35, s.side / 2], [s.side * 0.12, 0.35, 0]] }] };
    }
    case "fee": {
      const r = calcFee(p.gfa, k);
      if (!r.area) return null;
      const fl = Math.max(1, Math.round(r.area / 600));
      return { ground: [40, 34], prims: [{ t: "box", at: [0, 0], size: [24, fl * 3.2, 25], kind: "mass", grow: true }], labels: [{ at: [0, fl * 3.2 + 1.5, 0], text: `${f(r.area)} מ"ר בנייה · אגרה ₪${f(r.fee)}` }], callouts: [] };
    }
    case "mamad": {
      const m = p.mamad;
      const r = m ? calcMamad(m, k) : null;
      if (!r) return null;
      const t = (r.wall || 25) / 100, L = r.l, W = r.w, H = r.h || 2.5;
      const prims: Prim[] = [
        { t: "box", at: [0, 0], size: [L + 2 * t, 0.2, W + 2 * t], kind: "soft" },
        { t: "box", at: [0, -(W + t) / 2], size: [L + 2 * t, H, t], kind: "mass", grow: true },
        { t: "box", at: [0, (W + t) / 2], size: [L + 2 * t, H, t], kind: "mass", grow: true },
        { t: "box", at: [-(L + t) / 2, 0], size: [t, H, W], kind: "mass", grow: true },
        { t: "box", at: [(L + t) / 2, 0], size: [t, H, W], kind: "mass", grow: true },
      ];
      if (m.window) prims.push({ t: "box", at: [0, -(W + t) / 2], size: [1, 1, t + 0.05], y: 1.1, kind: "glass" });
      const d1 = dim([-L / 2, H + 0.3, W / 2 + t + 0.6], [L / 2, H + 0.3, W / 2 + t + 0.6], `${L} מ'`);
      const d2 = dim([L / 2 + t + 0.6, H + 0.3, -W / 2], [L / 2 + t + 0.6, H + 0.3, W / 2], `${W} מ'`);
      const d3 = dim([-L / 2 - t - 0.6, 0, W / 2], [-L / 2 - t - 0.6, H, W / 2], `${H} מ'`);
      return { ground: [L + 6, W + 6], prims: [...prims, ...d1.prims, ...d2.prims, ...d3.prims], labels: [...(d1.labels ?? []), ...(d2.labels ?? []), ...(d3.labels ?? []), { at: [0, 0.6, 0], text: `${f(r.area, 2)} מ"ר · ${f(r.volume, 1)} מ"ק` }, { at: [-(L + t) / 2, H + 0.8, 0], text: `קיר ${r.wall} ס"מ` }], callouts: [] };
    }
    case "fireAccess": {
      const r = calcFireAccess(p.fire, k);
      const H = r.height || 20, rw = r.road || 4, sl = r.stagingL || 12, sw = r.stagingW || 6, gap = r.toFacade || 6;
      const prims: Prim[] = [
        { t: "box", at: [0, -8], size: [22, H, 12], kind: "mass", grow: true },
        { t: "box", at: [0, -2 + gap + sw / 2], size: [sl, 0.1, sw], kind: "tone" },
        { t: "box", at: [0, -2 + gap + sw + 2 + rw / 2], size: [50, 0.06, rw], kind: "road" },
        { t: "cyl", at: [14, 0], r: 0.35, h: 1, kind: "limit" },
        { t: "box", at: [0, -2 + gap + sw / 2], size: [8, 3, 2.5], kind: "limit" },
      ];
      const d1 = dim([-sl / 2, 0.15, -2 + gap + sw + 0.8], [sl / 2, 0.15, -2 + gap + sw + 0.8], `${sl} מ'`);
      const d2 = dim([sl / 2 + 1, 0.15, -2 + gap], [sl / 2 + 1, 0.15, -2 + gap + sw], `${sw} מ'`);
      const d3 = dim([-sl / 2 - 1.5, 0.15, -2], [-sl / 2 - 1.5, 0.15, -2 + gap], `${gap} מ' מהחזית`);
      const d4 = dim([-25, 0.15, -2 + gap + sw + 2], [-25, 0.15, -2 + gap + sw + 2 + rw], `דרך ${rw} מ'`);
      const d5 = dim([12, 0, -2], [12, H, -2], `${H} מ'`);
      return { ground: [56, 44], prims: [...prims, ...d1.prims, ...d2.prims, ...d3.prims, ...d4.prims, ...d5.prims], labels: [...[d1, d2, d3, d4, d5].flatMap((d) => d.labels ?? []), { at: [14, 1.8, 0], text: `ברז ${r.hydrant || "?"} מ' מהכניסה` }, { at: [0, H + 1.5, -8], text: r.category?.label ?? "" }], callouts: [], anims: [{ kind: "mover", prim: 4, from: [-30, -2 + gap + sw + 2 + rw / 2], to: [0, -2 + gap + sw / 2] }] };
    }
    case "program": {
      const r = calcProgramByUnits(p.units, k);
      if (!r) return null;
      const items = r.rows.filter((x) => x.unit === 'מ"ר' && x.value > 0);
      const prims: Prim[] = [];
      const labels: Scene3["labels"] = [];
      let x = 0;
      const kindOf = (g: string) => (g === "חינוך" ? "glass" : g === "שטחים פתוחים" ? "green" : g === "מבני ציבור" ? "tone" : "pad") as Prim extends { kind: infer K } ? K : never;
      items.forEach((it, i) => {
        const side = Math.max(2, Math.sqrt(it.value) * 0.6);
        const z = (i % 2) * 22;
        if (i % 2 === 0 && i) x += side + 6;
        const h = it.group === "שטחים פתוחים" ? 0.2 : it.group === "חינוך" ? 6 : 4;
        prims.push({ t: "box", at: [x, z], size: [side, h, side], kind: kindOf(it.group) as never, grow: h > 1 });
        labels.push({ at: [x, h + 1.5, z], text: `${i + 1} ${it.label} · ${f(it.value)} מ"ר` });
      });
      return { ground: [x + 30, 60], prims: prims.map((pr) => pr.t === "box" ? { ...pr, at: [pr.at[0] - x / 2, pr.at[1] - 11] as [number, number] } : pr), labels: labels!.map((l) => ({ ...l, at: [l.at[0] - x / 2, l.at[1], l.at[2] - 11] as V3 })), callouts: [] };
    }
    case "devob": {
      const r = calcDevObligation(p.plot, p.units, k);
      if (!r) return null;
      const side = Math.sqrt(r.site);
      const ob = Math.sqrt(r.area);
      return { ground: [side * 1.5, side * 1.5], prims: [{ t: "line", kind: "plot", dashed: true, pts: [[-side / 2, 0.03, -side / 2], [side / 2, 0.03, -side / 2], [side / 2, 0.03, side / 2], [-side / 2, 0.03, side / 2], [-side / 2, 0.03, -side / 2]] }, { t: "box", at: [side / 2 - ob / 2, side / 2 - ob / 2], size: [ob, 0.3, ob], kind: "tone" }], labels: [{ at: [side / 2 - ob / 2, 1.5, side / 2 - ob / 2], text: `מטלה ${f(r.area)} מ"ר (${k["dev.rate"]}%)` }, { at: [0, 1, -side / 2], text: `מתחם ${f(r.site)} מ"ר` }], callouts: [] };
    }
  }
  return null;
}

/** שלבי החישוב של המחשבון, לדוגמה המונחית */
export function toolSteps(tool: string, p: Project, k: KMap): { label: string; expr: string }[] {
  switch (tool) {
    case "drainage": return calcDrainage(p.plot, p.footprint, p.green, k)?.steps ?? [];
    case "green": return calcGreen(p.plot, p.footprint, p.units, k)?.steps ?? [];
    case "parking": return calcParking(p.parking, p.standard, k).steps;
    case "waste": return calcWaste(p.units, p.floors, k)?.steps ?? [];
    case "water": return calcWater(p.plot, p.footprint, p.irrigation, p.water, k)?.steps ?? [];
    case "fee": return calcFee(p.gfa, k).steps ?? [];
    case "mamad": return calcMamad(p.mamad, k)?.steps ?? [];
    case "fireAccess": return calcFireAccess(p.fire, k).steps;
    case "program": return calcProgramByUnits(p.units, k)?.steps ?? [];
    case "devob": return calcDevObligation(p.plot, p.units, k)?.steps ?? [];
  }
  return [];
}
