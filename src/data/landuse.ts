// מקרא ייעודי קרקע לפי נוהל מבא"ת, כפי שהוא מוגדר בשכבת ייעודי הקרקע הרשמית של מנהל התכנון (XPLAN).
// הערכים נקראו בעקיפין (דרך פרויקט קוד פתוח שמוריד את השכבה, נבנה 2026-10-02), ולא מתוך מסמך הנוהל עצמו.
// סטטוס: לאימות מול נוהל מבא"ת (גרסת ספטמבר 2024) כשהגישה ל-gov.il תתאפשר.

export interface LandUse {
  key: string;
  code: number;
  name: string;
  hex: string;
  hatched?: boolean;
  /** צבע טקסט קריא על הרקע */
  fg: "#000" | "#fff";
}

export const landUseSource = {
  label: "שכבת ייעודי קרקע XPLAN, מנהל התכנון (ags.iplan.gov.il), לפי קודי מבא\"ת",
  url: "https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic/Xplan/MapServer/4",
  status: "לאימות מול מסמך נוהל מבא\"ת",
};

export const landUses: LandUse[] = [
  { key: "res", code: 10, name: "מגורים", hex: "#FFDF7F", fg: "#000" },
  { key: "resA", code: 20, name: "מגורים א", hex: "#FFFF00", fg: "#000" },
  { key: "resB", code: 60, name: "מגורים ב", hex: "#FFBF00", fg: "#000" },
  { key: "resC", code: 100, name: "מגורים ג", hex: "#FF7F00", fg: "#000" },
  { key: "employ", code: 200, name: "תעסוקה", hex: "#FF00C5", fg: "#fff" },
  { key: "commerce", code: 210, name: "מסחר", hex: "#ADADAD", fg: "#000" },
  { key: "industry", code: 230, name: "תעשייה", hex: "#CC66CC", fg: "#fff" },
  { key: "eng", code: 280, name: "מתקנים הנדסיים", hex: "#7F7FFF", fg: "#000" },
  { key: "public", code: 400, name: "מבנים ומוסדות ציבור", hex: "#CC9966", fg: "#000" },
  { key: "spa", code: 670, name: "שטח ציבורי פתוח", hex: "#BFFF00", fg: "#000" },
  { key: "stream", code: 740, name: "נחל ותעלה", hex: "#7FFFFF", fg: "#000" },
  { key: "road", code: 830, name: "דרך מוצעת", hex: "#FF003F", fg: "#fff" },
  { key: "roadOk", code: 820, name: "דרך מאושרת", hex: "#CCB266", fg: "#000" },
  { key: "path", code: 860, name: "שביל", hex: "#009972", fg: "#fff" },
  { key: "future", code: 950, name: "שטח לתכנון בעתיד", hex: "#848484", hatched: true, fg: "#fff" },
  { key: "infra", code: 0, name: "רצועת תשתיות", hex: "#004DA8", hatched: true, fg: "#fff" },
  { key: "nature", code: 0, name: "שמורת טבע", hex: "#72994C", hatched: true, fg: "#fff" },
  { key: "rail", code: 0, name: "מסילה מאושרת", hex: "#5B5B5B", fg: "#fff" },
];

export const landUse = (key: string) => landUses.find((l) => l.key === key)!;
