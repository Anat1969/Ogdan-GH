import { useSyncExternalStore } from "react";
import type { ParkingEntry, ParkingStandard, WaterEntry } from "../logic/calculators";

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
}

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
