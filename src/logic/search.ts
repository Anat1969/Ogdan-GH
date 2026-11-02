import { chapters, directory, tools } from "../data/permitData";
import type { Route } from "../state/router";

export interface Hit {
  kind: "פרק" | "דרישה" | "איש קשר" | "כלי" | "דגש";
  title: string;
  context: string;
  route: Route;
  text: string;
}

const norm = (s: string) => s.replace(/["'׳״\-–,.:()]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

let index: Hit[] | null = null;

function build(): Hit[] {
  const hits: Hit[] = [];
  for (const c of chapters) {
    const route: Route = { name: "chapter", id: c.id };
    hits.push({ kind: "פרק", title: c.title, context: c.description, route, text: `${c.title} ${c.short} ${c.description}` });
    for (const b of c.blocks) {
      if (b.kind === "checklist" || b.kind === "notes")
        b.items.forEach((it) => hits.push({ kind: b.kind === "checklist" ? "דרישה" : "דגש", title: it, context: `${c.short} · ${b.title}`, route, text: `${it} ${b.title}` }));
      if (b.kind === "cards") b.cards.forEach((cd) => hits.push({ kind: "דגש", title: cd.title, context: `${c.short} · ${cd.body}`, route, text: `${cd.title} ${cd.body}` }));
      if (b.kind === "text") hits.push({ kind: "דגש", title: b.title, context: `${c.short} · ${b.body}`, route, text: `${b.title} ${b.body}` });
    }
  }
  for (const p of directory)
    hits.push({ kind: "איש קשר", title: p.name, context: `${p.role} · ${p.department} · ${p.phone}`, route: { name: "contacts" }, text: `${p.name} ${p.role} ${p.department} ${p.phone} ${p.email}` });
  for (const t of tools) hits.push({ kind: "כלי", title: t.title, context: t.purpose, route: { name: "tool", id: t.id }, text: `${t.title} ${t.purpose}` });
  return hits.map((h) => ({ ...h, text: norm(h.text) }));
}

export function search(q: string, limit = 12): Hit[] {
  const terms = norm(q).split(" ").filter(Boolean);
  if (!terms.length) return [];
  index ??= build();
  const scored = index
    .map((h) => {
      let score = 0;
      const title = norm(h.title);
      for (const t of terms) {
        if (!h.text.includes(t)) return null;
        score += title.startsWith(t) ? 6 : title.includes(t) ? 3 : 1;
      }
      if (h.kind === "כלי" || h.kind === "פרק") score += 2;
      return { h, score };
    })
    .filter((x): x is { h: Hit; score: number } => !!x)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.h);
}
