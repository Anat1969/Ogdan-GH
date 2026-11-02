// בדיקת תכנית בינוי מול האוגדן: הערכים המוצעים בתכנית מול הדרישה שחושבה במחשבונים.
// סטטוס: ok עומד, warn חסר עד 10%, bad חסר יותר מ-10%, idle אין נתון.
import { calcDrainage, calcGreen, calcParking, calcWaste, calcWater } from "./calculators";
import type { Project } from "../state/store";

export type CheckStatus = "ok" | "warn" | "bad" | "idle";

export interface PlanCheck {
  id: string;
  group: string;
  chapter: string;
  label: string;
  unit: string;
  required: number | null;
  proposed: number | null;
  status: CheckStatus;
  gap: number | null;
  basis: string;
}

export const planFields: { id: string; group: string; chapter: string; label: string; unit: string }[] = [
  { id: "parking_regular", group: "חניה", chapter: "roads", label: "מקומות חניה רגילים בתכנית", unit: "מקומות" },
  { id: "parking_operational", group: "חניה", chapter: "roads", label: "מקומות לרכב תפעולי", unit: "מקומות" },
  { id: "parking_disabled", group: "חניה", chapter: "roads", label: "חניות נכים", unit: "מקומות" },
  { id: "parking_ev", group: "חניה", chapter: "roads", label: "עמדות טעינה", unit: "עמדות" },
  { id: "green_permeable", group: "ניקוז ושטח ירוק", chapter: "drainage", label: "שטח מחלחל בתכנית", unit: 'מ"ר' },
  { id: "pit_volume", group: "ניקוז ושטח ירוק", chapter: "drainage", label: "נפח בורות חלחול", unit: "קוב" },
  { id: "trees", group: "ניקוז ושטח ירוק", chapter: "planting", label: "עצים בוגרים בתכנית הנטיעה", unit: "עצים" },
  { id: "shade_area", group: "ניקוז ושטח ירוק", chapter: "planting", label: "שטח מוצל", unit: 'מ"ר' },
  { id: "waste_wet", group: "אשפה", chapter: "sanitation", label: "קיבולת אצירה רטובה", unit: "קוב" },
  { id: "waste_dry", group: "אשפה", chapter: "sanitation", label: "קיבולת אצירה יבשה", unit: "קוב" },
  { id: "recycling", group: "אשפה", chapter: "sanitation", label: "עמדות מחזור", unit: "עמדות" },
  { id: "garden_waste", group: "אשפה", chapter: "sanitation", label: "רחבת גזם וגרוטאות", unit: 'מ"ר' },
  { id: "pipe_mm", group: "מים וחשמל", chapter: "water", label: "קוטר צינור הזנה", unit: 'מ"מ' },
  { id: "height_m", group: "מים וחשמל", chapter: "electricity", label: "גובה הבניין", unit: "מ'" },
  { id: "generators", group: "מים וחשמל", chapter: "electricity", label: "גנרטורים", unit: "יח'" },
];

const n = (v: string | undefined) => {
  const x = parseFloat(v ?? "");
  return Number.isFinite(x) && x >= 0 && v !== "" ? x : null;
};

function status(required: number | null, proposed: number | null): { status: CheckStatus; gap: number | null } {
  if (required === null || proposed === null) return { status: "idle", gap: null };
  const gap = proposed - required;
  if (gap >= 0) return { status: "ok", gap };
  return { status: required > 0 && -gap / required <= 0.1 ? "warn" : "bad", gap };
}

export function runPlanCheck(p: Project): PlanCheck[] {
  const prop = p.proposed ?? {};
  const parking = calcParking(p.parking, p.standard);
  const drainage = calcDrainage(p.plot, p.footprint, p.green);
  const green = calcGreen(p.plot, p.footprint, p.units);
  const waste = calcWaste(p.units, p.floors);
  const water = calcWater(p.plot, p.footprint, p.irrigation, p.water);
  const height = n(prop.height_m);

  const req: Record<string, { v: number | null; basis: string }> = {
    parking_regular: { v: parking.hasInput ? parking.total : null, basis: "מחשבון חניה, לפי התקן שנבחר" },
    parking_operational: { v: parking.hasInput ? parking.operational : null, basis: "מחשבון חניה, מקדם תפעולי לייעוד" },
    parking_disabled: { v: parking.hasInput ? parking.disabled : null, basis: "5% מסך החניות, מינימום 1" },
    parking_ev: { v: parking.hasInput ? parking.ev : null, basis: "20% מסך החניות" },
    green_permeable: { v: drainage ? drainage.minInfiltration : null, basis: "15% משטח המגרש" },
    pit_volume: { v: drainage ? +drainage.pitM3.toFixed(2) : null, basis: "30 מ\"מ מהשטח האטום" },
    trees: { v: green ? green.trees : null, basis: "1 לכל 50 מ\"ר ירוק, או לפי ההצללה, הגבוה" },
    shade_area: { v: green ? Math.round(green.shade) : null, basis: "30% מהשטח המשותף הפתוח" },
    waste_wet: { v: waste ? +waste.wetM3.toFixed(2) : null, basis: "נפח אצירה רטובה ל-2.5 ימים" },
    waste_dry: { v: waste ? +waste.dryM3.toFixed(2) : null, basis: "נפח אצירה יבשה ל-2.5 ימים" },
    recycling: { v: waste ? waste.recycling : null, basis: "1 לכל 50 יח\"ד" },
    garden_waste: { v: waste ? waste.gardenWaste : null, basis: "12 מ\"ר לכל 100 יח\"ד, מינימום 12" },
    pipe_mm: { v: water && water.diameterMM > 0 ? Math.ceil(water.diameterMM) : null, basis: "ספיקת שיא במהירות 1.5 מ'/ש'" },
    height_m: { v: null, basis: "נתון לבדיקת חובת גנרטור" },
    generators: { v: height === null ? null : height > 29 ? 1 : 0, basis: "בניין מעל 29 מ' מחויב בגנרטור" },
  };

  return planFields.map((f) => {
    const r = req[f.id];
    const proposed = n(prop[f.id]);
    const s = f.id === "height_m" ? { status: (proposed === null ? "idle" : proposed > 29 ? "warn" : "ok") as CheckStatus, gap: null } : status(r.v, proposed);
    return { ...f, required: r.v, proposed, basis: r.basis, ...s };
  });
}

/** קריאת קובץ ערכים מתכנית: CSV של "מזהה,ערך" או JSON של אובייקט */
export function parsePlanFile(text: string): Record<string, string> {
  const ids = new Set(planFields.map((f) => f.id));
  const byLabel = new Map(planFields.map((f) => [f.label, f.id]));
  const out: Record<string, string> = {};
  const t = text.trim();
  if (t.startsWith("{")) {
    const obj = JSON.parse(t) as Record<string, unknown>;
    const src = (obj.proposed as Record<string, unknown>) ?? obj;
    for (const [k, v] of Object.entries(src)) if (ids.has(k) && v !== null && v !== "") out[k] = String(v);
    return out;
  }
  for (const line of t.split(/\r?\n/)) {
    const [rawK, rawV] = line.split(/[,\t;]/).map((s) => s?.trim().replace(/^"|"$/g, ""));
    if (!rawK || rawV === undefined || rawV === "") continue;
    const k = ids.has(rawK) ? rawK : byLabel.get(rawK);
    if (k && Number.isFinite(parseFloat(rawV))) out[k] = rawV;
  }
  return out;
}

export function planTemplateCsv() {
  return ["id,value,label", ...planFields.map((f) => `${f.id},,"${f.label} (${f.unit})"`)].join("\n");
}
