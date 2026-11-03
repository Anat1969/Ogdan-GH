import { describe, expect, it } from "vitest";
import { calcDrainage, calcFee, calcGreen, calcParking, calcWaste, calcWater, pipeFor } from "./calculators";

describe("חניה", () => {
  it("40 יח\"ד קטנות בתקן אשדוד", () => {
    const r = calcParking([{ id: "a", useType: "residential_small", units: "40" }], "ashdod");
    expect(r.total).toBe(48);
    expect(r.operational).toBe(2);
    expect(r.disabled).toBe(3);
    expect(r.ev).toBe(10);
    expect(r.grand).toBe(50);
  });
  it("שימוש מעורב בתקן ארצי", () => {
    const r = calcParking(
      [
        { id: "a", useType: "residential_large", units: "10" },
        { id: "b", useType: "commercial", units: "500" },
      ],
      "national",
    );
    expect(r.total).toBe(15 + 20);
    expect(r.operational).toBe(1 + 3);
  });
  it("קלט ריק לא מייצר חניות נכים", () => {
    const r = calcParking([{ id: "a", useType: "office", units: "" }], "ashdod");
    expect(r.total).toBe(0);
    expect(r.disabled).toBe(0);
    expect(r.hasInput).toBe(false);
  });
});

describe("אגרות", () => {
  it("188 ₪ למ\"ר ופיקדון 20%", () => {
    const r = calcFee("1000");
    expect(r.fee).toBe(188000);
    expect(r.deposit).toBe(37600);
  });
});

describe("אשפה", () => {
  it("מבנה קטן: טמונים", () => {
    const r = calcWaste(20, 5)!;
    expect(r.dual).toBe(false);
    expect(r.tamunim).toEqual({ wet: 1, dry: 1 });
    expect(r.recycling).toBe(1);
    expect(r.gardenWaste).toBe(12);
  });
  it("מעל 60 יח\"ד: מערכת כפולה ודחסניות 12 קוב", () => {
    const r = calcWaste(100, 8)!;
    expect(r.dual).toBe(true);
    expect(r.compactors).toEqual({ wet: 12, dry: 12 });
    expect(r.totalM3).toBeCloseTo(1.75, 5);
  });
  it("אין יח\"ד: אין תוצאה", () => {
    expect(calcWaste("", "")).toBeNull();
  });
});

describe("ניקוז", () => {
  it("נוסחת הרציונל", () => {
    const r = calcDrainage(1000, 400, 150)!;
    expect(r.paved).toBe(450);
    expect(r.weightedC).toBeCloseTo((380 + 382.5 + 30) / 1000, 6);
    // 1,000 מ"ר = 0.1 הקטר
    expect(r.peakLps).toBeCloseTo(((r.weightedC * 120 * 0.1) / 360) * 1000, 6);
    expect(r.peakLps).toBeCloseTo(26.42, 2);
    expect(r.meetsInfiltration).toBe(true);
    expect(r.pitM3).toBeCloseTo(25.5, 6);
  });
  it("פחות מ-15% ירוק נכשל", () => {
    expect(calcDrainage(1000, 400, 100)!.meetsInfiltration).toBe(false);
  });
});

describe("שטח ירוק", () => {
  it("עצים לפי הגבוה מבין ירוק והצללה", () => {
    const r = calcGreen(2000, 600, 40)!;
    expect(r.minGreen).toBe(300);
    expect(r.treesByGreen).toBe(6);
    expect(r.common).toBe(400);
    expect(r.treesForShade).toBe(4);
    expect(r.trees).toBe(6);
    expect(r.meets).toBe(true);
  });
});

describe("מים", () => {
  it("מגורים והשקיה", () => {
    const r = calcWater(2000, 600, "mixed", [{ id: "a", type: "residential", units: "40", residents: "" }])!;
    expect(r.rows[0].people).toBe(140);
    expect(r.domestic).toBeCloseTo((140 * 150 * 365) / 1000, 6);
    expect(r.irrigationM3).toBeCloseTo(1260, 6);
  });
  it("טבלת קטרים", () => {
    expect(pipeFor(20)).toBe('3/4"');
    expect(pipeFor(40)).toBe('1.5"');
    expect(pipeFor(100)).toBe('3"+');
  });
});

import { parsePlanFile, runPlanCheck } from "./planCheck";
import { exampleProject } from "../state/store";

describe("בדיקת תכנית", () => {
  it("פרויקט לדוגמה: חניה חסרה, בור חלחול עומד, גנרטור חסר מעל 29 מ'", () => {
    const r = Object.fromEntries(runPlanCheck(exampleProject()).map((c) => [c.id, c]));
    expect(r.parking_regular.required).toBe(72);
    expect(r.parking_regular.status).toBe("warn"); // 70 מתוך 72: חסר פחות מ-10%
    expect(r.pit_volume.status).toBe("ok");
    expect(r.generators.required).toBe(1);
    expect(r.generators.status).toBe("bad");
    expect(r.trees.status).toBe("bad"); // 5 מתוך 6 חסר יותר מ-10%
  });
  it("אין ערך מוצע: לא נבדק", () => {
    const p = exampleProject();
    p.proposed = {};
    expect(runPlanCheck(p).every((c) => c.status === "idle")).toBe(true);
  });
  it("קריאת CSV ו-JSON", () => {
    expect(parsePlanFile("id,value\nparking_regular,48\ntrees,6\nunknown,3")).toEqual({ parking_regular: "48", trees: "6" });
    expect(parsePlanFile('{"proposed":{"pit_volume":12,"x":1}}')).toEqual({ pit_volume: "12" });
    expect(parsePlanFile("עצים בוגרים בתכנית הנטיעה\t7")).toEqual({ trees: "7" });
  });
});

import { calcFireAccess, calcLevies, calcMamad, calcProgram } from "./calculators2";
import { DEFAULT_K } from "./constants";
import { calcFee as feeK, calcParking as parkK } from "./calculators";

describe("קבועים ניתנים לשינוי", () => {
  it("שינוי תעריף אגרה ומקדם חניה משנה את התוצאה", () => {
    expect(feeK(100, { ...DEFAULT_K, "fee.perSqm": 200 }).fee).toBe(20000);
    expect(parkK([{ id: "a", useType: "office", units: "220" }], "ashdod", { ...DEFAULT_K, "pk.office.ashdod": 1 / 10 }).total).toBe(22);
  });
});

describe("מחשבונים נוספים", () => {
  it("פרוגרמה: יחידות לפי נורמות שהוזנו", () => {
    const r = calcProgram(1000, { household: "3", spaPerCapita: "5", rows: [{ id: "k", name: "גנים", cohortPct: "6", participation: "100", perUnit: "30", plotPerUnit: "0.5", builtPerUnit: "140" }, { id: "x", name: "ריק", cohortPct: "", participation: "", perUnit: "", plotPerUnit: "", builtPerUnit: "" }] })!;
    expect(r.population).toBe(3000);
    expect(r.rows[0].units).toBe(6); // 3000 × 6% = 180 ÷ 30
    expect(r.rows[0].plot).toBe(3);
    expect(r.rows[1].ok).toBe(false);
    expect(r.spa).toBe(15000);
  });
  it("פרוגרמה בלי גודל משק בית: אין תוצאה", () => {
    expect(calcProgram(100, { household: "", spaPerCapita: "", rows: [] })).toBeNull();
  });
  it("היטלים: קרקע + בנייה + יח\"ד", () => {
    const r = calcLevies(1000, 3000, 30, [{ id: "a", name: "א", rateLand: "10", rateBuilt: "20", rateUnit: "" }, { id: "b", name: "ב", rateLand: "", rateBuilt: "", rateUnit: "1000" }]);
    expect(r.total).toBe(10000 + 60000 + 30000);
    expect(r.filled).toBe(2);
  });
  it("ממ\"ד: 3.2×2.9×2.5 עומד, קיר 25 עם חלון לא עומד", () => {
    const r = calcMamad({ l: "3.2", w: "2.9", h: "2.5", wall: "25", window: true })!;
    expect(r.area).toBeCloseTo(9.28, 2);
    expect(r.checks[0].status).toBe("ok");
    expect(r.checks[1].status).toBe("ok");
    expect(r.checks[3].status).toBe("bad");
  });
  it("כבאות: 3.8 מ' בהקלה, 31 מ' רב קומות", () => {
    const r = calcFireAccess({ height: "31", road: "3.8", stagingL: "12", stagingW: "6", toFacade: "7", hydrant: "25" });
    expect(r.category?.level).toBe(2);
    expect(r.checks.find((c) => c.id === "road")?.status).toBe("warn");
    expect(r.checks.find((c) => c.id === "staging")?.status).toBe("ok");
    expect(r.checks.find((c) => c.id === "facade")?.status).toBe("bad");
  });
});

import plansData from "../data/plans.json";
import { extractFacts, reviewPlan, type PlanRecord } from "./planReview";

describe("בדיקת תוכנית בינוי לפי מספר", () => {
  const plans = (plansData as { plans: PlanRecord[] }).plans;
  const p1815 = plans.find((p) => p.num === "1815")!;
  it("תב/1815: 54 יח\"ד, 6 קומות, חסרים אישורי תשתיות, סביבה וחשמל", () => {
    const f = extractFacts(p1815);
    expect(f.units).toBe(54);
    expect(f.floors).toBe(6);
    expect(f.missingApprovals.join(" ")).toMatch(/תשתיות/);
    expect(f.missingApprovals.join(" ")).toMatch(/חשמל/);
    expect(f.reliefs.length).toBeGreaterThan(0);
  });
  it("תב/1815: אישורי גורמים חסר, חשמל דורש בדיקה, כבאות נמצא", () => {
    const r = reviewPlan(p1815);
    const by = Object.fromEntries(r.findings.map((x) => [x.id, x]));
    expect(by.approvals.verdict).toBe("missing");
    expect(by.electricity.verdict).toBe("review");
    expect(by.fire.verdict).not.toBe("missing");
    expect(r.parkingRequired).toBe(Math.ceil(54 * 1.2));
  });
  it("כל 16 התוכניות נבדקות בלי שגיאה", () => {
    expect(plans.length).toBe(16);
    for (const p of plans) expect(reviewPlan(p).findings.length).toBe(11);
  });
});
