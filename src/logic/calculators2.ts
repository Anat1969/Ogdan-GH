// לוגיקה טהורה למחשבונים הנוספים. כל קבוע מגיע מבחוץ (נורמות שהוזנו או מרשם הקבועים).
import { DEFAULT_K, type KMap } from "./constants";
import type { Step } from "./calculators";

type Status = "ok" | "warn" | "bad" | "idle";
const n = (v: string | number | undefined) => {
  const x = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(x) && x > 0 ? x : 0;
};
const f = (x: number, d = 0) => x.toLocaleString("he-IL", { maximumFractionDigits: d });

/* ---------- פרוגרמה ---------- */
export interface ProgramInput {
  household: string;
  spaPerCapita: string;
  rows: { id: string; name: string; cohortPct: string; participation: string; perUnit: string; plotPerUnit: string; builtPerUnit: string }[];
}

export function calcProgram(unitsIn: string | number, prog: ProgramInput) {
  const units = n(unitsIn);
  const hh = n(prog.household);
  if (!units || !hh) return null;
  const population = units * hh;
  const steps: Step[] = [{ label: "אוכלוסייה", expr: `${f(units)} יח"ד × ${hh} נפשות = ${f(population)} נפשות` }];
  const rows = prog.rows.map((r) => {
    const cohort = n(r.cohortPct), part = n(r.participation), per = n(r.perUnit);
    const ok = cohort > 0 && part > 0 && per > 0;
    const users = ok ? (population * cohort * part) / 10000 : 0;
    const u = ok ? Math.ceil(users / per) : 0;
    const plot = u * n(r.plotPerUnit);
    const built = u * n(r.builtPerUnit);
    if (ok) steps.push({ label: r.name, expr: `${f(population)} × ${cohort}% × ${part}% = ${f(users, 1)} משתמשים ÷ ${per} = ${u} יחידות; מגרש ${f(plot, 2)} ד', בנוי ${f(built)} מ"ר` });
    return { id: r.id, name: r.name, ok, users, units: u, plot, built };
  });
  const spaPc = n(prog.spaPerCapita);
  const spa = spaPc ? population * spaPc : null;
  if (spa !== null) steps.push({ label: 'שצ"פ', expr: `${f(population)} × ${spaPc} מ"ר = ${f(spa)} מ"ר = ${f(spa / 1000, 2)} דונם` });
  return { population, rows, spa, totalPlot: rows.reduce((s, r) => s + r.plot, 0), totalBuilt: rows.reduce((s, r) => s + r.built, 0), steps };
}

/* ---------- היטלים ואגרות ---------- */
export function calcLevies(plotIn: string | number, gfaIn: string | number, unitsIn: string | number, rows: { id: string; name: string; rateLand: string; rateBuilt: string; rateUnit: string }[]) {
  const plot = n(plotIn), gfa = n(gfaIn), units = n(unitsIn);
  const steps: Step[] = [];
  const out = rows.map((r) => {
    const a = plot * n(r.rateLand), b = gfa * n(r.rateBuilt), c = units * n(r.rateUnit);
    const total = a + b + c;
    if (total > 0) steps.push({ label: r.name, expr: [a && `${f(plot)} מ"ר קרקע × ₪${n(r.rateLand)}`, b && `${f(gfa)} מ"ר בנייה × ₪${n(r.rateBuilt)}`, c && `${f(units)} יח"ד × ₪${n(r.rateUnit)}`].filter(Boolean).join(" + ") + ` = ₪${f(total)}` });
    return { id: r.id, name: r.name, total };
  });
  const total = out.reduce((s, r) => s + r.total, 0);
  return { rows: out, total, filled: out.filter((r) => r.total > 0).length, perUnit: units ? total / units : 0, perSqm: gfa ? total / gfa : 0, steps };
}

/* ---------- ממ"ד ---------- */
export function calcMamad(m: { l: string; w: string; h: string; wall: string; window: boolean }, k: KMap = DEFAULT_K) {
  const l = n(m.l), w = n(m.w), h = n(m.h), wall = n(m.wall);
  if (!l || !w) return null;
  const area = l * w, volume = area * h;
  const minArea = k["hfc.minArea"], minVolume = k["hfc.minVolume"], minH = k["hfc.minHeight"];
  const minWall = m.window ? k["hfc.wallWindow"] : k["hfc.wallExt"];
  const s = (ok: boolean, has = true): Status => (!has ? "idle" : ok ? "ok" : "bad");
  const checks = [
    { label: "שטח נטו", status: s(area >= minArea), detail: `${f(area, 2)} מ"ר מול מינימום ${minArea} מ"ר` },
    { label: "נפח", status: s(volume >= minVolume, h > 0), detail: h ? `${f(volume, 2)} מ"ק מול מינימום ${minVolume} מ"ק` : "חסר גובה" },
    { label: "גובה פנימי", status: s(h >= minH, h > 0), detail: h ? `${h} מ' מול ${minH} מ'` : "חסר גובה" },
    { label: m.window ? "עובי קיר חוץ עם חלון הדף" : "עובי קיר חוץ", status: s(wall >= minWall, wall > 0), detail: wall ? `${wall} ס"מ מול ${minWall} ס"מ` : "חסר עובי קיר" },
  ];
  const steps: Step[] = [
    { label: "שטח נטו", expr: `${l} × ${w} = ${f(area, 2)} מ"ר` },
    { label: "נפח", expr: `${f(area, 2)} × ${h || "?"} = ${f(volume, 2)} מ"ק` },
    { label: "שטח ברוטו משוער", expr: `(${l} + 2×${wall / 100}) × (${w} + 2×${wall / 100}) = ${f((l + (2 * wall) / 100) * (w + (2 * wall) / 100), 2)} מ"ר` },
  ];
  return { l, w, h, wall, area, volume, minArea, minVolume, checks, steps };
}

/* ---------- גישת כבאות ---------- */
export function calcFireAccess(fi: { height: string; road: string; stagingL: string; stagingW: string; toFacade: string; hydrant: string }, k: KMap = DEFAULT_K) {
  const height = n(fi.height), road = n(fi.road), stagingL = n(fi.stagingL), stagingW = n(fi.stagingW), toFacade = n(fi.toFacade), hydrant = n(fi.hydrant);
  const highFrom = k["fire.highFrom"], tallFrom = k["fire.tallFrom"];
  const category = !height ? null
    : height > tallFrom ? { level: 2, label: `בניין רב קומות (מעל ${tallFrom} מ')`, detail: "נדרשים בין השאר שני חדרי מדרגות, מעלית אלונקה ומערכות נוספות. בפרק חשמל באוגדן: גנרטור." }
    : height >= highFrom ? { level: 1, label: `בניין גבוה (${highFrom} עד ${tallFrom} מ')`, detail: "נדרשים דרך גישה ורחבת היערכות לרכב כיבוי." }
    : { level: 0, label: `בניין עד ${highFrom} מ'`, detail: "דרישות הגישה לבניין גבוה אינן חלות; לבדוק דרישות כלליות." };
  const rMin = k["fire.roadMin"], rExc = k["fire.roadException"];
  const checks: { id: string; label: string; status: Status; detail: string }[] = [
    { id: "road", label: "רוחב דרך גישה", status: !road ? "idle" : road >= rMin ? "ok" : road >= rExc ? "warn" : "bad", detail: road ? `${road} מ' מול ${rMin} מ' (בהקלה עד ${rExc} מ', בחוות דעת הנדסית ובתיאום עם הכבאות)` : "חסר נתון" },
    { id: "staging", label: "מידות רחבת היערכות", status: !stagingL || !stagingW ? "idle" : Math.max(stagingL, stagingW) >= k["fire.stagingL"] && Math.min(stagingL, stagingW) >= k["fire.stagingW"] ? "ok" : "bad", detail: stagingL && stagingW ? `${stagingL}×${stagingW} מ' מול ${k["fire.stagingL"]}×${k["fire.stagingW"]} מ'` : "חסר נתון" },
    { id: "facade", label: "מרחק רחבה מהחזית", status: !toFacade ? "idle" : toFacade <= k["fire.stagingToFacade"] ? "ok" : "bad", detail: toFacade ? `${toFacade} מ' מול מרבי ${k["fire.stagingToFacade"]} מ'` : "חסר נתון" },
    { id: "hydrant", label: "ברז כיבוי מהכניסה", status: !hydrant ? "idle" : hydrant <= k["fire.hydrantToEntrance"] ? "ok" : "bad", detail: hydrant ? `${hydrant} מ' מול מרבי ${k["fire.hydrantToEntrance"]} מ'` : "חסר נתון" },
  ];
  const steps: Step[] = [
    { label: "סיווג", expr: height ? `${height} מ' ${height > tallFrom ? ">" : height >= highFrom ? "≥" : "<"} ${height > tallFrom ? tallFrom : highFrom} מ' ← ${category?.label}` : "חסר גובה" },
    ...checks.map((c) => ({ label: c.label, expr: c.detail })),
  ];
  return { height, road, stagingL, stagingW, toFacade, hydrant, category, checks, steps };
}
