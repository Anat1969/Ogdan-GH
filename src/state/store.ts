import { useSyncExternalStore } from "react";
import type { ParkingEntry, ParkingStandard, WaterEntry } from "../logic/calculators";
import { mergeK } from "../logic/constants";

/** תיק הבקשה: מקור יחיד לנתוני הפרויקט של המשתמש. כל המחשבונים והדוח קוראים ממנו. */
export interface Project {
  name: string;
  address: string;
  track: "short" | "full" | "relief";
  plot: string;
  footprint: string;
  green: string;
  units: string;
  floors: string;
  gfa: string;
  standard: ParkingStandard;
  parking: ParkingEntry[];
  irrigation: string;
  water: WaterEntry[];
  /** ערכים מוצעים מתכנית הבינוי, לבדיקה מול האוגדן */
  proposed: Record<string, string>;
  /** קבועי חישוב ששונו על ידי המשתמש (ממרשם הקבועים) */
  k: Record<string, string>;
  program: { household: string; spaPerCapita: string; source: string; rows: ProgramRow[] };
  levies: LevyRow[];
  mamad: { l: string; w: string; h: string; wall: string; window: boolean };
  fire: { height: string; road: string; stagingL: string; stagingW: string; toFacade: string; hydrant: string };
}

export interface ProgramRow { id: string; name: string; cohortPct: string; participation: string; perUnit: string; plotPerUnit: string; builtPerUnit: string }
export interface LevyRow { id: string; name: string; basis: string; rateLand: string; rateBuilt: string; rateUnit: string; source: string; date: string }

const programRow = (id: string, name: string): ProgramRow => ({ id, name, cohortPct: "", participation: "", perUnit: "", plotPerUnit: "", builtPerUnit: "" });
export const defaultProgram = () => ({
  // 3.5 נפשות: ערך שאשדוד הניחה בפרוגרמה לרובע ה' (2016), לפי הנחיות הממשלה. לאימות מול הנחיות אשדוד לפרוגרמה, דצמבר 2025, פרק הנחות יסוד.
  household: "3.5",
  spaPerCapita: "",
  source: "גודל משק בית 3.5: פרוגרמת רובע ה', אשדוד 2016 (מקור משני, לאימות מול הנחיות אשדוד דצמבר 2025). שאר הנורמות: להזין מהמסמך.",
  rows: [
    programRow("daycare", "מעונות יום (0 עד 3)"),
    programRow("kinder", "גני ילדים (3 עד 6)"),
    programRow("primary", "בית ספר יסודי"),
    programRow("secondary", "חטיבת ביניים ותיכון"),
    programRow("synagogue", "בית כנסת"),
    programRow("community", "מתנ\"ס ומרכז קהילתי"),
    programRow("clinic", "טיפת חלב ומרפאה"),
    programRow("library", "ספרייה ומועדונים"),
  ],
});
const levy = (id: string, name: string, basis: string): LevyRow => ({ id, name, basis, rateLand: "", rateBuilt: "", rateUnit: "", source: "", date: "" });
export const defaultLevies = (): LevyRow[] => [
  levy("roads", "היטל סלילת רחובות ומדרכות", "חוק עזר לאשדוד (סלילת רחובות)"),
  levy("drain", "היטל תיעול", "חוק עזר לאשדוד (תיעול), תשס\"ז-2007"),
  levy("spa", "היטל שטחים ציבוריים פתוחים", "חוק עזר לאשדוד (שטחים ציבוריים פתוחים)"),
  levy("water", "דמי הקמה: מים", "כללי תאגידי מים וביוב (דמי הקמה), תשע\"ה-2015; תאגיד יובלים"),
  levy("sewer", "דמי הקמה: ביוב", "כללי תאגידי מים וביוב (דמי הקמה), תשע\"ה-2015; תאגיד יובלים"),
  levy("permit", "אגרת בנייה", "תקנות התכנון והבנייה (רישוי בנייה); טבלת תעריפים מעודכנת ב-gov.il"),
];

export const emptyProject = (): Project => ({
  name: "",
  address: "",
  track: "full",
  plot: "",
  footprint: "",
  green: "",
  units: "",
  floors: "",
  gfa: "",
  standard: "ashdod",
  parking: [{ id: "p1", useType: "residential_small", units: "" }],
  irrigation: "mixed",
  water: [{ id: "w1", type: "residential", units: "", residents: "" }],
  proposed: {},
  k: {},
  program: defaultProgram(),
  levies: defaultLevies(),
  mamad: { l: "", w: "", h: "", wall: "", window: false },
  fire: { height: "", road: "", stagingL: "", stagingW: "", toFacade: "", hydrant: "" },
});

export const exampleProject = (): Project => ({
  name: "בניין מגורים לדוגמה",
  address: "רובע ט\"ז, אשדוד",
  track: "full",
  plot: "2000",
  footprint: "600",
  green: "350",
  units: "40",
  floors: "9",
  gfa: "4200",
  standard: "ashdod",
  parking: [
    { id: "p1", useType: "residential_small", units: "24" },
    { id: "p2", useType: "residential_large", units: "16" },
    { id: "p3", useType: "commercial", units: "300" },
  ],
  irrigation: "mixed",
  water: [
    { id: "w1", type: "residential", units: "40", residents: "" },
    { id: "w2", type: "commercial", units: "12", residents: "" },
  ],
  proposed: { parking_regular: "70", parking_operational: "3", parking_disabled: "4", parking_ev: "15", green_permeable: "350", pit_volume: "50", trees: "5", shade_area: "120", waste_wet: "5", waste_dry: "5", recycling: "1", garden_waste: "12", pipe_mm: "40", height_m: "31", generators: "0" },
  k: {},
  program: defaultProgram(),
  levies: defaultLevies(),
  mamad: { l: "3.2", w: "2.9", h: "2.5", wall: "25", window: true },
  fire: { height: "31", road: "4", stagingL: "12", stagingW: "6", toFacade: "7", hydrant: "25" },
});

const KEYS = { project: "ogdan.v2.project", checks: "ogdan.v2.checks", saved: "ogdan.v2.savedAt" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(KEYS.saved, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

type Listener = () => void;

function createStore<T>(key: string, initial: () => T) {
  let state: T = read(key, initial());
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next: T | ((s: T) => T)) {
      state = typeof next === "function" ? (next as (s: T) => T)(state) : next;
      const ok = write(key, state);
      saved.set(ok ? Date.now() : -1);
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

/* חיווי "נשמר" */
const saved = (() => {
  let at = 0;
  const ls = new Set<Listener>();
  return {
    get: () => at,
    set(v: number) {
      at = v;
      ls.forEach((l) => l());
    },
    subscribe(l: Listener) {
      ls.add(l);
      return () => ls.delete(l);
    },
  };
})();

export const projectStore = createStore<Project>(KEYS.project, emptyProject);
export const checksStore = createStore<Record<string, boolean>>(KEYS.checks, () => ({}));

/** הקבועים בפועל: ברירות מחדל + שינויי המשתמש */
export function useK() {
  const p = useProject();
  return mergeK(p.k);
}

export function setK(id: string, value: string | null) {
  projectStore.set((p) => {
    const k = { ...(p.k ?? {}) };
    if (value === null) delete k[id];
    else k[id] = value;
    return { ...p, k };
  });
}

export function useProject() {
  return useSyncExternalStore(projectStore.subscribe, projectStore.get);
}
export function useChecks() {
  return useSyncExternalStore(checksStore.subscribe, checksStore.get);
}
export function useSavedAt() {
  return useSyncExternalStore(saved.subscribe, saved.get);
}

export function updateProject(patch: Partial<Project>) {
  projectStore.set((p) => ({ ...p, ...patch }));
}

export function toggleCheck(key: string) {
  checksStore.set((c) => ({ ...c, [key]: !c[key] }));
}

export function setChecks(keys: string[], value: boolean) {
  checksStore.set((c) => {
    const n = { ...c };
    keys.forEach((k) => (n[k] = value));
    return n;
  });
}

export const uid = () => Math.random().toString(36).slice(2, 9);

/* שיתוף מצב בכתובת */
export function encodeState() {
  const json = JSON.stringify({ p: projectStore.get(), c: checksStore.get() });
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(s: string): { p?: Project; c?: Record<string, boolean> } | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}
