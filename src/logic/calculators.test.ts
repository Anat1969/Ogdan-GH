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
    expect(r.peakLps).toBeCloseTo(((r.weightedC * 120 * 1) / 360) * 1000, 6);
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
