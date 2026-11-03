// השקטת צבעי מקרא מבא"ת: אותו פיגמנט, רוויה נמוכה. מערבבים את הצבע עם אפור חם-ניטרלי.
// fill: מילוי גרפי. ink: קו וטקסט על רקע בהיר. fg: טקסט על המילוי.
import { landUses } from "../data/landuse";

const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (c: number[]) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v * (1 - t) + b[i] * t);
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const GRAY = [176, 178, 181];
const INK = [60, 63, 68];

export function mutedTone(hex: string) {
  const c = hex2rgb(hex);
  const fill = mix(c, GRAY, 0.7);
  const ink = mix(c, INK, 0.7);
  return { fill: rgb2hex(fill), ink: rgb2hex(ink), fg: lum(fill) > 0.32 ? "#1c1e21" : "#f3f4f5" };
}

export const toneOf = (key: string) => {
  const lu = landUses.find((l) => l.key === key);
  return mutedTone(lu?.hex ?? "#8c9198");
};

export const toneCss = () =>
  landUses.map((l) => { const t = mutedTone(l.hex); return `.tone-${l.key}{--tone:${t.fill};--tone-ink:${t.ink};--tone-fg:${t.fg};--tone-raw:${l.hex}}`; }).join("");
