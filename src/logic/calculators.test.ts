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
