import { useEffect, useSyncExternalStore } from "react";
import { checksStore, decodeState, emptyProject, projectStore } from "./store";

export type Route =
  | { name: "home" }
  | { name: "chapter"; id: string }
  | { name: "tool"; id: string }
  | { name: "tools" }
  | { name: "contacts" }
  | { name: "project" }
  | { name: "notfound" };

export function parse(hash: string): Route {
  const path = hash.replace(/^#/, "").split("?")[0] || "/";
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "chapter" && parts[1]) return { name: "chapter", id: parts[1] };
  if (parts[0] === "tool" && parts[1]) return { name: "tool", id: parts[1] };
  if (parts[0] === "tools") return { name: "tools" };
  if (parts[0] === "contacts") return { name: "contacts" };
  if (parts[0] === "project") return { name: "project" };
  return { name: "notfound" };
}

export function href(r: Route): string {
  switch (r.name) {
    case "home": return "#/";
    case "chapter": return `#/chapter/${r.id}`;
    case "tool": return `#/tool/${r.id}`;
    default: return `#/${r.name}`;
  }
}

const subscribe = (l: () => void) => {
  window.addEventListener("hashchange", l);
  return () => window.removeEventListener("hashchange", l);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parse(hash);
}

export function navigate(r: Route | string) {
  window.location.hash = typeof r === "string" ? r : href(r);
}

/** טעינת מצב שהגיע בקישור משותף (?s=...) */
export function useSharedStateImport(onImported: () => void) {
  useEffect(() => {
    const q = window.location.hash.split("?")[1];
    if (!q) return;
    const s = new URLSearchParams(q).get("s");
    if (!s) return;
    const data = decodeState(s);
    if (data?.p) projectStore.set({ ...emptyProject(), ...data.p });
    if (data?.c) checksStore.set(data.c);
    window.history.replaceState(null, "", window.location.hash.split("?")[0] || "#/");
    if (data) onImported();
  }, [onImported]);
}
