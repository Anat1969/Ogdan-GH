// לוגיקת המחשבונים: פונקציות טהורות, בלי UI. הנוסחאות והמקדמים זהים לגרסה הקודמת של האוגדן הדיגיטלי.
// כל פונקציה מחזירה גם את שלבי החישוב (steps) כדי שהממשק יציג "מה חושב בקוד" בשקיפות.

export interface Step {
  label: string;
  expr: string;
}

const num = (v: string | number | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const f = (n: number, d = 0) => n.toLocaleString("he-IL", { maximumFractionDigits: d, minimumFractionDigits: 0 });

/* ---------------- חניה ---------------- */

export type ParkingStandard = "ashdod" | "national";

export interface ParkingUse {
  label: string;
  unit: string;
  inputLabel: string;
  national: { ratio: number; description: string };
  ashdod: { ratio: number; description: string };
  operational: { ratio: number; description: string };
}

export const parkingRatios: Record<string, ParkingUse> = {
  residential_small: {
    label: "מגורים, דירה עד 100 מ\"ר", unit: "יח\"ד", inputLabel: "מספר יחידות דיור",
    national: { ratio: 1, description: "1 חניה לכל יח\"ד" },
    ashdod: { ratio: 1.2, description: "1.2 חניות לכל יח\"ד" },
    operational: { ratio: 0.05, description: "1 לכל 20 יח\"ד" },
  },
  residential_large: {
    label: "מגורים, דירה מעל 100 מ\"ר", unit: "יח\"ד", inputLabel: "מספר יחידות דיור",
    national: { ratio: 1.5, description: "1.5 חניות לכל יח\"ד" },
    ashdod: { ratio: 1.75, description: "1.75 חניות לכל יח\"ד" },
    operational: { ratio: 0.05, description: "1 לכל 20 יח\"ד" },
  },
  office: {
    label: "משרדים", unit: "מ\"ר", inputLabel: "שטח עיקרי במ\"ר",
    national: { ratio: 1 / 25, description: "1 חניה לכל 25 מ\"ר" },
    ashdod: { ratio: 1 / 22, description: "1 חניה לכל 22 מ\"ר" },
    operational: { ratio: 1 / 500, description: "1 לכל 500 מ\"ר" },
  },
  commercial: {
    label: "מסחר", unit: "מ\"ר", inputLabel: "שטח מסחרי עיקרי במ\"ר",
    national: { ratio: 1 / 25, description: "1 חניה לכל 25 מ\"ר" },
    ashdod: { ratio: 1 / 20, description: "1 חניה לכל 20 מ\"ר" },
    operational: { ratio: 1 / 200, description: "1 לכל 200 מ\"ר" },
  },
  hotel: {
    label: "מלון או אכסניה", unit: "חדרים", inputLabel: "מספר חדרי אירוח",
    national: { ratio: 1 / 3, description: "1 חניה לכל 3 חדרים" },
    ashdod: { ratio: 1 / 2.5, description: "1 חניה לכל 2.5 חדרים" },
    operational: { ratio: 1 / 30, description: "1 לכל 30 חדרים" },
  },
  education: {
    label: "מוסד חינוך", unit: "כיתות", inputLabel: "מספר כיתות",
    national: { ratio: 2, description: "2 חניות לכל כיתה" },
    ashdod: { ratio: 2.5, description: "2.5 חניות לכל כיתה" },
    operational: { ratio: 0.5, description: "1 לכל 2 כיתות" },
  },
  industry: {
    label: "תעשייה ומלאכה", unit: "מ\"ר", inputLabel: "שטח עיקרי במ\"ר",
    national: { ratio: 1 / 50, description: "1 חניה לכל 50 מ\"ר" },
    ashdod: { ratio: 1 / 40, description: "1 חניה לכל 40 מ\"ר" },
    operational: { ratio: 1 / 300, description: "1 לכל 300 מ\"ר" },
  },
  clinic: {
    label: "מרפאה או מכון רפואי", unit: "מ\"ר", inputLabel: "שטח עיקרי במ\"ר",
    national: { ratio: 1 / 15, description: "1 חניה לכל 15 מ\"ר" },
    ashdod: { ratio: 1 / 15, description: "1 חניה לכל 15 מ\"ר" },
    operational: { ratio: 1 / 250, description: "1 לכל 250 מ\"ר" },
  },
};

export interface ParkingEntry { id: string; useType: string; units: string }

export function calcParking(entries: ParkingEntry[], standard: ParkingStandard) {
  const rows = entries.map((e) => {
    const config = parkingRatios[e.useType] ?? parkingRatios.residential_small;
    const n = num(e.units);
    const std = config[standard];
    return {
      id: e.id, config, n, std,
      raw: n * std.ratio,
      parking: Math.ceil(n * std.ratio),
      operational: Math.ceil(n * config.operational.ratio),
    };
  });
  const total = rows.reduce((s, r) => s + r.parking, 0);
  const operational = rows.reduce((s, r) => s + r.operational, 0);
  const disabled = Math.max(total > 0 ? 1 : 0, Math.ceil(total * 0.05));
  const ev = Math.ceil(total * 0.2);
  const steps: Step[] = rows.filter((r) => r.n > 0).map((r) => ({
    label: r.config.label,
    expr: `${f(r.n, 2)} ${r.config.unit} × ${f(r.std.ratio, 4)} = ${f(r.raw, 2)} ← ${r.parking} חניות; תפעולי ${r.operational}`,
  }));
  steps.push({ label: "חניות נכים", expr: `max(1, ⌈${total} × 5%⌉) = ${disabled}` });
  steps.push({ label: "עמדות טעינה", expr: `⌈${total} × 20%⌉ = ${ev}` });
  return { rows, total, operational, disabled, ev, grand: total + operational, hasInput: rows.some((r) => r.n > 0), steps };
}

/* ---------------- אגרות ---------------- */

export const FEE_PER_SQM = 188;

export function calcFee(sqm: string | number) {
  const area = num(sqm);
  const fee = area * FEE_PER_SQM;
  const deposit = fee * 0.2;
  return {
    area, fee, deposit,
    steps: [
      { label: "אגרת בנייה", expr: `${f(area)} מ"ר × ₪${FEE_PER_SQM} = ₪${f(fee)}` },
      { label: "פיקדון", expr: `₪${f(fee)} × 20% = ₪${f(deposit)}` },
    ] as Step[],
  };
}

/* ---------------- אשפה ---------------- */

export function calcWaste(unitsIn: string | number, floorsIn: string | number) {
  const units = Math.floor(num(unitsIn));
  const floors = Math.floor(num(floorsIn));
  if (units <= 0) return null;
  const dailyTotal = units * 7;
  const dailyWet = dailyTotal * 0.4;
  const dailyDry = dailyTotal * 0.6;
  const storageDays = 2.5;
  const storageWet = dailyWet * storageDays;
  const storageDry = dailyDry * storageDays;
  const storageTotal = storageWet + storageDry;
  const wetM3 = storageWet / 1000;
  const dryM3 = storageDry / 1000;
  const totalM3 = storageTotal / 1000;
  const dual = floors > 9 || units > 60;
  let compactors: { wet: number; dry: number } | null = null;
  let tamunim: { wet: number; dry: number } | null = null;
  if (dual) {
    if (dryM3 <= 14 && wetM3 <= 14) compactors = { wet: wetM3 <= 12 ? 12 : 14, dry: dryM3 <= 12 ? 12 : 14 };
    else tamunim = { wet: Math.ceil(wetM3 / 5), dry: Math.ceil(dryM3 / 5) };
  } else {
    tamunim = { wet: Math.max(1, Math.ceil(wetM3 / 5)), dry: Math.max(1, Math.ceil(dryM3 / 5)) };
  }
  const recycling = Math.max(1, Math.ceil(units / 50));
  const gardenWaste = Math.max(12, Math.ceil((units / 100) * 12));
  const dualReason = floors > 9 ? "מעל 9 קומות" : "מעל 60 יח\"ד";
  const steps: Step[] = [
    { label: "נפח יומי", expr: `${units} יח"ד × 7 ל' = ${f(dailyTotal)} ל'/יום (רטובה 40% ${f(dailyWet, 1)}, יבשה 60% ${f(dailyDry, 1)})` },
    { label: "נפח אצירה", expr: `${f(dailyTotal)} × 2.5 ימים = ${f(storageTotal)} ל' = ${f(totalM3, 2)} קוב` },
    { label: "סוג מערכת", expr: dual ? `${dualReason}: מערכת כפולה, 2 צנרות שוט ו-2 דחסניות` : "מבנה קטן: טמונים בלבד, 5 קוב לטמון" },
    { label: "מחזור", expr: `max(1, ⌈${units} ÷ 50⌉) = ${recycling} עמדות` },
    { label: "רחבת גזם", expr: `max(12, ⌈${units} ÷ 100 × 12⌉) = ${gardenWaste} מ"ר` },
  ];
  return { units, floors, dailyTotal, dailyWet, dailyDry, storageTotal, storageWet, storageDry, wetM3, dryM3, totalM3, dual, dualReason, compactors, tamunim, recycling, gardenWaste, steps };
}

/* ---------------- ניקוז ---------------- */

export const DRAINAGE = { cRoof: 0.95, cPaved: 0.85, cGreen: 0.2, intensity: 120, duration: 0.25, annualMM: 400, retentionMM: 30 };

export function calcDrainage(plotIn: string | number, buildingIn: string | number, greenIn: string | number) {
  const plot = num(plotIn);
  const building = num(buildingIn);
  const green = num(greenIn);
  if (plot <= 0) return null;
  const { cRoof, cPaved, cGreen, intensity, duration, annualMM, retentionMM } = DRAINAGE;
  const paved = Math.max(0, plot - building - green);
  const effRoof = building * cRoof;
  const effPaved = paved * cPaved;
  const effGreen = green * cGreen;
  const effective = effRoof + effPaved + effGreen;
  const weightedC = effective / plot;
  // נוסחת הרציונל: Q[מ"ק/ש'] = C × I[מ"מ/שעה] × A[הקטר] / 360. (בגרסה 1 הוצב A בדונם, ולכן התוצאה הייתה גבוהה פי 10.)
  const hectare = plot / 10000;
  const peakM3s = (weightedC * intensity * hectare) / 360;
  const peakLps = peakM3s * 1000;
  const rainMM = intensity * duration;
  const eventM3 = (effective * rainMM) / 1000;
  const annualM3 = (effective * annualMM) / 1000;
  const minInfiltration = plot * 0.15;
  const meetsInfiltration = green >= minInfiltration;
  const impervious = building + paved;
  const pitM3 = (impervious * retentionMM) / 1000;
  const overAreas = building + green > plot;
  const steps: Step[] = [
    { label: "שטח מרוצף", expr: `${f(plot)} − ${f(building)} − ${f(green)} = ${f(paved)} מ"ר` },
    { label: "מקדם נגר משוקלל", expr: `(${f(building)}×0.95 + ${f(paved)}×0.85 + ${f(green)}×0.20) ÷ ${f(plot)} = ${f(weightedC, 2)}` },
    { label: "ספיקת שיא", expr: `Q = ${f(weightedC, 2)} × 120 × ${f(hectare, 3)} הקטר ÷ 360 = ${f(peakM3s, 4)} קוב/ש' (${f(peakLps, 1)} ל'/ש')` },
    { label: "נפח נגר לאירוע", expr: `${f(effective)} מ"ר × 30 מ"מ = ${f(eventM3, 1)} קוב` },
    { label: "נגר שנתי", expr: `${f(effective)} מ"ר × 0.4 מ' = ${f(annualM3)} קוב/שנה` },
    { label: "בור חלחול", expr: `${f(impervious)} מ"ר אטום × 30 מ"מ = ${f(pitM3, 1)} קוב` },
  ];
  return { plot, building, green, paved, effRoof, effPaved, effGreen, effective, weightedC, peakM3s, peakLps, eventM3, annualM3, minInfiltration, meetsInfiltration, impervious, pitM3, overAreas, municipal: plot > 2000, steps };
}

/* ---------------- שטח ירוק ---------------- */

export function calcGreen(plotIn: string | number, buildingIn: string | number, unitsIn: string | number) {
  const plot = num(plotIn);
  const building = num(buildingIn);
  const units = Math.floor(num(unitsIn));
  if (plot <= 0) return null;
  const minGreen = plot * 0.15;
  const open = Math.max(0, plot - building);
  const openPct = (open / plot) * 100;
  const treesByGreen = Math.ceil(minGreen / 50);
  const parkingEstimate = units * 25;
  const common = Math.max(0, open - parkingEstimate);
  const shade = common * 0.3;
  const treesForShade = Math.ceil(shade / 30);
  const trees = Math.max(treesByGreen, treesForShade);
  const shadeFromTrees = trees * 30;
  const meets = open >= minGreen;
  const steps: Step[] = [
    { label: "שטח פתוח", expr: `${f(plot)} − ${f(building)} = ${f(open)} מ"ר (${f(openPct, 1)}%)` },
    { label: "שטח ירוק מינימלי", expr: `${f(plot)} × 15% = ${f(minGreen)} מ"ר` },
    { label: "שטח משותף", expr: `${f(open)} − ${units} יח"ד × 25 מ"ר חניה = ${f(common)} מ"ר` },
    { label: "הצללה נדרשת", expr: `${f(common)} × 30% = ${f(shade)} מ"ר` },
    { label: "עצים", expr: `max(⌈${f(minGreen)} ÷ 50⌉ = ${treesByGreen}, ⌈${f(shade)} ÷ 30⌉ = ${treesForShade}) = ${trees}` },
  ];
  return { plot, building, units, minGreen, open, openPct, treesByGreen, common, shade, treesForShade, trees, shadeFromTrees, meets, ornamental: minGreen * 0.4, lawn: minGreen * 0.6, steps };
}

/* ---------------- מים ---------------- */

export const waterUses: Record<string, { label: string; perCapita: number; unitLabel: string; perUnit: number; description: string }> = {
  residential: { label: "מגורים", perCapita: 150, unitLabel: "יח\"ד", perUnit: 3.5, description: "150 ליטר לתושב ליום" },
  office: { label: "משרדים", perCapita: 80, unitLabel: "עובדים", perUnit: 1, description: "80 ליטר לעובד ליום" },
  commercial: { label: "מסחר", perCapita: 100, unitLabel: "עובדים", perUnit: 1, description: "100 ליטר לעובד ליום" },
  hotel: { label: "מלונאות", perCapita: 300, unitLabel: "חדרים", perUnit: 2, description: "300 ליטר לאורח ליום" },
  industry: { label: "תעשייה", perCapita: 100, unitLabel: "עובדים", perUnit: 1, description: "100 ליטר לעובד ליום" },
  education: { label: "חינוך", perCapita: 50, unitLabel: "תלמידים", perUnit: 1, description: "50 ליטר לתלמיד ליום" },
  public: { label: "מבנה ציבור", perCapita: 80, unitLabel: "מבקרים ביום", perUnit: 1, description: "80 ליטר למבקר ליום" },
};

export const irrigationRates: Record<string, { label: string; rate: number }> = {
  lawn: { label: "דשא", rate: 1.2 },
  shrubs: { label: "שיחים ופרחים", rate: 0.7 },
  trees: { label: "עצים בלבד", rate: 0.5 },
  mixed: { label: "מעורב", rate: 0.9 },
  drip: { label: "טפטוף חסכוני", rate: 0.4 },
};

export interface WaterEntry { id: string; type: string; units: string; residents: string }

export function pipeFor(mm: number) {
  return mm <= 25 ? '3/4"' : mm <= 32 ? '1"' : mm <= 50 ? '1.5"' : mm <= 63 ? '2"' : mm <= 75 ? '2.5"' : '3"+';
}

export function calcWater(plotIn: string | number, buildingIn: string | number, irrigation: string, entries: WaterEntry[]) {
  const plot = num(plotIn);
  const building = num(buildingIn);
  if (plot <= 0) return null;
  const open = Math.max(0, plot - building);
  const rate = irrigationRates[irrigation]?.rate ?? 0.9;
  const irrigationM3 = open * rate;
  const rows = entries.map((e) => {
    const c = waterUses[e.type] ?? waterUses.residential;
    const units = num(e.units);
    const custom = num(e.residents);
    const people = custom > 0 ? custom : units * c.perUnit;
    const daily = people * c.perCapita;
    return { id: e.id, config: c, units, people, daily, annual: (daily * 365) / 1000 };
  });
  const domestic = rows.reduce((s, r) => s + r.annual, 0);
  const total = domestic + irrigationM3;
  const peakDaily = (domestic / 365) * 2.5;
  const peakHourly = peakDaily / 10;
  const peakLps = (peakHourly * 1000) / 3600;
  const area = peakLps / 1000 / 1.5;
  const diameterMM = Math.sqrt((4 * area) / Math.PI) * 1000;
  const steps: Step[] = [
    ...rows.filter((r) => r.people > 0).map((r) => ({ label: r.config.label, expr: `${f(r.people, 1)} נפשות × ${r.config.perCapita} ל' × 365 = ${f(r.annual)} מ"ק/שנה` })),
    { label: "השקיה", expr: `(${f(plot)} − ${f(building)}) × ${rate} = ${f(irrigationM3)} מ"ק/שנה` },
    { label: "ספיקת שיא", expr: `${f(domestic)} ÷ 365 × 2.5 ÷ 10 שעות = ${f(peakLps, 2)} ל'/ש'` },
    { label: "קוטר", expr: `d = √(4Q ÷ (π × 1.5 מ'/ש')) = ${f(diameterMM, 1)} מ"מ ← ${pipeFor(diameterMM)}` },
  ];
  return { plot, building, open, rate, irrigationM3, rows, domestic, total, daily: total / 365, peakLps, diameterMM, pipe: pipeFor(diameterMM), steps };
}
