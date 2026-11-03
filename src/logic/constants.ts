// מרשם הקבועים: כל מקדם שמשתתף בחישוב, עם ברירת מחדל, יחידה, מקור והסבר.
// המשתמש יכול לשנות כל קבוע (נשמר בתיק הבקשה), לראות שהוא שונה ולהחזיר לברירת המחדל.
// מקור "גרסה 1" = המקדם הגיע מהגרסה הקודמת של האוגדן הדיגיטלי ולא אומת מול מסמך רשמי. יש לאמת לפני הגשה.

export type KGroup = "parking" | "fee" | "waste" | "drainage" | "green" | "water" | "program" | "levies" | "hfc" | "fire";

export interface KDef {
  id: string;
  group: KGroup;
  label: string;
  unit: string;
  value: number;
  source: string;
  verified: boolean;
  note?: string;
  step?: number;
}

const V1 = "גרסה 1 של האוגדן הדיגיטלי, לא אומת מול מסמך רשמי";
const OGDAN = "אוגדן הנחיות מידע להיתר, אשדוד, 01/01/2025";

const parkingUses: [string, string, number, number, number][] = [
  // מזהה, שם, אשדוד, ארצי, תפעולי (חניות ליחידה)
  ["residential_small", "מגורים עד 100 מ\"ר, ליח\"ד", 1.2, 1, 0.05],
  ["residential_large", "מגורים מעל 100 מ\"ר, ליח\"ד", 1.75, 1.5, 0.05],
  ["office", "משרדים, למ\"ר עיקרי", 1 / 22, 1 / 25, 1 / 500],
  ["commercial", "מסחר, למ\"ר עיקרי", 1 / 20, 1 / 25, 1 / 200],
  ["hotel", "מלון, לחדר", 1 / 2.5, 1 / 3, 1 / 30],
  ["education", "חינוך, לכיתה", 2.5, 2, 0.5],
  ["industry", "תעשייה ומלאכה, למ\"ר עיקרי", 1 / 40, 1 / 50, 1 / 300],
  ["clinic", "מרפאה, למ\"ר עיקרי", 1 / 15, 1 / 15, 1 / 250],
];

export const KDEFS: KDef[] = [
  ...parkingUses.flatMap(([id, label, ash, nat, op]) => [
    { id: `pk.${id}.ashdod`, group: "parking" as const, label: `${label}: תקן אשדוד`, unit: "חניות ליחידה", value: ash, source: V1, verified: false, step: 0.001 },
    { id: `pk.${id}.national`, group: "parking" as const, label: `${label}: תקן ארצי`, unit: "חניות ליחידה", value: nat, source: `${V1}. לבדוק מול תקנות התכנון והבנייה (התקנת מקומות חניה), התשע"ו-2016`, verified: false, step: 0.001 },
    { id: `pk.${id}.op`, group: "parking" as const, label: `${label}: רכב תפעולי`, unit: "מקומות ליחידה", value: op, source: V1, verified: false, step: 0.001 },
  ]),
  { id: "pk.disabledPct", group: "parking", label: "חניות נכים מסך החניות", unit: "%", value: 5, source: `${V1}. ${OGDAN}: חניות נכים לפי חוק הנגישות, באחריות יועץ נגישות`, verified: false },
  { id: "pk.disabledMin", group: "parking", label: "מינימום חניות נכים", unit: "מקומות", value: 1, source: V1, verified: false },
  { id: "pk.evPct", group: "parking", label: "עמדות טעינה בפועל", unit: "%", value: 20, source: `${OGDAN}, פרק כבישים: 20% מחניות המסחר עם עמדות טעינה בפועל; לשאר החניות תשתית הכנה`, verified: true, note: "באוגדן ה-20% חלים על חניות מסחר. החישוב מחיל אותם על סך החניות כאומדן עליון." },

  { id: "fee.perSqm", group: "fee", label: "אגרת בנייה למ\"ר", unit: "₪ למ\"ר", value: 188, source: `${V1}. התעריף המחייב נקבע בתקנות ומתעדכן במדד`, verified: false },
  { id: "fee.depositPct", group: "fee", label: "פיקדון מסך האגרה", unit: "%", value: 20, source: V1, verified: false },

  { id: "ws.litersPerUnit", group: "waste", label: "נפח אשפה ליח\"ד ליום", unit: "ליטר", value: 7, source: `${OGDAN}, טבלת נפחי אשפה: דירת מגורים`, verified: true },
  { id: "ws.wetPct", group: "waste", label: "שיעור אשפה רטובה", unit: "%", value: 40, source: V1, verified: false },
  { id: "ws.days", group: "waste", label: "ימי אצירה בין פינויים", unit: "ימים", value: 2.5, source: `${V1}: פינוי 3 פעמים בשבוע`, verified: false },
  { id: "ws.dualFloors", group: "waste", label: "סף קומות למערכת כפולה", unit: "קומות", value: 9, source: V1, verified: false },
  { id: "ws.dualUnits", group: "waste", label: "סף יח\"ד למערכת כפולה", unit: "יח\"ד", value: 60, source: V1, verified: false },
  { id: "ws.tamun", group: "waste", label: "נפח טמון", unit: "קוב", value: 5, source: V1, verified: false },
  { id: "ws.unitsPerRecycling", group: "waste", label: "יח\"ד לעמדת מחזור", unit: "יח\"ד", value: 50, source: V1, verified: false },
  { id: "ws.gardenPer100", group: "waste", label: "רחבת גזם לכל 100 יח\"ד", unit: "מ\"ר", value: 12, source: V1, verified: false },

  { id: "dr.cRoof", group: "drainage", label: "מקדם נגר: גג ומבנה", unit: "C", value: 0.95, source: "ערך מקובל בספרות ההנדסית לנוסחת הרציונל (0.75 עד 0.95 לגגות)", verified: true, step: 0.01 },
  { id: "dr.cPaved", group: "drainage", label: "מקדם נגר: ריצוף ואספלט", unit: "C", value: 0.85, source: "ערך מקובל בספרות (0.70 עד 0.95 לאספלט ובטון)", verified: true, step: 0.01 },
  { id: "dr.cGreen", group: "drainage", label: "מקדם נגר: שטח ירוק", unit: "C", value: 0.2, source: "ערך מקובל בספרות (0.10 עד 0.25 לדשא על קרקע חולית)", verified: true, step: 0.01 },
  { id: "dr.intensity", group: "drainage", label: "עוצמת גשם תכנונית", unit: "מ\"מ לשעה", value: 120, source: `${V1}: ערך אופייני לאשדוד, אירוע 5 שנים, 15 דקות. לאמת מול עקומות IDF של השירות המטאורולוגי`, verified: false },
  { id: "dr.duration", group: "drainage", label: "משך אירוע תכנוני", unit: "דקות", value: 15, source: V1, verified: false },
  { id: "dr.annual", group: "drainage", label: "משקעים שנתיים ממוצעים", unit: "מ\"מ", value: 400, source: `${V1}. לאמת מול נתוני השירות המטאורולוגי לאשדוד`, verified: false },
  { id: "dr.retention", group: "drainage", label: "גובה אצירה לבור חלחול", unit: "מ\"מ", value: 30, source: V1, verified: false },
  { id: "dr.minInfilPct", group: "drainage", label: "שטח מחלחל מינימלי", unit: "% מהמגרש", value: 15, source: `${OGDAN}, פרק סביבה: לפחות 15% שטחים מחלחלים`, verified: true },

  { id: "gr.minGreenPct", group: "green", label: "שטח ירוק מינימלי", unit: "% מהמגרש", value: 15, source: `${OGDAN}, פרק סביבה (נגר עילי)`, verified: true },
  { id: "gr.m2PerTree", group: "green", label: "שטח ירוק לעץ בוגר", unit: "מ\"ר", value: 50, source: V1, verified: false },
  { id: "gr.parkingPerUnit", group: "green", label: "הערכת שטח חניה עילית ליח\"ד", unit: "מ\"ר", value: 25, source: V1, verified: false },
  { id: "gr.shadePct", group: "green", label: "הצללה נדרשת מהשטח המשותף", unit: "%", value: 30, source: V1, verified: false },
  { id: "gr.shadePerTree", group: "green", label: "הצללה מעץ בוגר", unit: "מ\"ר", value: 30, source: V1, verified: false },

  { id: "wt.residential", group: "water", label: "צריכה: מגורים, לנפש ליום", unit: "ליטר", value: 150, source: V1, verified: false },
  { id: "wt.office", group: "water", label: "צריכה: משרדים, לעובד ליום", unit: "ליטר", value: 80, source: V1, verified: false },
  { id: "wt.commercial", group: "water", label: "צריכה: מסחר, לעובד ליום", unit: "ליטר", value: 100, source: V1, verified: false },
  { id: "wt.hotel", group: "water", label: "צריכה: מלונאות, לאורח ליום", unit: "ליטר", value: 300, source: V1, verified: false },
  { id: "wt.industry", group: "water", label: "צריכה: תעשייה, לעובד ליום", unit: "ליטר", value: 100, source: V1, verified: false },
  { id: "wt.education", group: "water", label: "צריכה: חינוך, לתלמיד ליום", unit: "ליטר", value: 50, source: V1, verified: false },
  { id: "wt.public", group: "water", label: "צריכה: מבנה ציבור, למבקר ליום", unit: "ליטר", value: 80, source: V1, verified: false },
  { id: "wt.personsPerUnit", group: "water", label: "נפשות ליחידת דיור", unit: "נפשות", value: 3.5, source: `${V1}. אפשר להחליף בגודל משק בית לפי הלמ"ס לאשדוד`, verified: false, step: 0.1 },
  { id: "wt.irr.lawn", group: "water", label: "השקיה: דשא", unit: "מ\"ק למ\"ר בשנה", value: 1.2, source: V1, verified: false, step: 0.05 },
  { id: "wt.irr.shrubs", group: "water", label: "השקיה: שיחים ופרחים", unit: "מ\"ק למ\"ר בשנה", value: 0.7, source: V1, verified: false, step: 0.05 },
  { id: "wt.irr.trees", group: "water", label: "השקיה: עצים", unit: "מ\"ק למ\"ר בשנה", value: 0.5, source: V1, verified: false, step: 0.05 },
  { id: "wt.irr.mixed", group: "water", label: "השקיה: מעורב", unit: "מ\"ק למ\"ר בשנה", value: 0.9, source: V1, verified: false, step: 0.05 },
  { id: "wt.irr.drip", group: "water", label: "השקיה: טפטוף חסכוני", unit: "מ\"ק למ\"ר בשנה", value: 0.4, source: V1, verified: false, step: 0.05 },
  { id: "wt.peakFactor", group: "water", label: "מקדם שיא יומי", unit: "×", value: 2.5, source: V1, verified: false, step: 0.1 },
  { id: "wt.peakHours", group: "water", label: "שעות צריכת שיא ביום", unit: "שעות", value: 10, source: V1, verified: false },
  { id: "wt.velocity", group: "water", label: "מהירות זרימה תכנונית בצינור", unit: "מ' לשנייה", value: 1.5, source: "ערך מקובל לתכנון צנרת מים (1 עד 2 מ'/ש')", verified: true, step: 0.1 },

  { id: "hfc.minArea", group: "hfc", label: "שטח נטו מינימלי לממ\"ד", unit: "מ\"ר", value: 9, source: "תקנות ההתגוננות האזרחית (מפרטים לבניית מקלטים), תש\"ן-1990, כפי שצוטטו במקורות משניים (כל זכות, ויקיפדיה)", verified: false, note: "באישור פיקוד העורף ובתנאים הנדסיים מיוחדים: עד 5 מ\"ר ו-12.5 מ\"ק (משני)" },
  { id: "hfc.minVolume", group: "hfc", label: "נפח מינימלי לממ\"ד", unit: "מ\"ק", value: 22.5, source: "תקנות ההתגוננות האזרחית תש\"ן-1990, לפי מקור משני", verified: false, step: 0.1 },
  { id: "hfc.wallExt", group: "hfc", label: "עובי קיר חוץ", unit: "ס\"מ", value: 25, source: "תקנות ההתגוננות האזרחית תש\"ן-1990, ציטוט מנבו בתקציר חיפוש", verified: false },
  { id: "hfc.wallWindow", group: "hfc", label: "עובי קיר חוץ עם חלון הדף נגרר", unit: "ס\"מ", value: 30, source: "כנ\"ל, ציטוט מתקציר חיפוש", verified: false },
  { id: "hfc.minHeight", group: "hfc", label: "גובה פנימי מינימלי", unit: "מ'", value: 2.5, source: "מקורות משניים (2.50 עד 2.80 מ'); לא נמצא בנוסח הרשמי", verified: false, step: 0.05 },

  { id: "fire.roadMin", group: "fire", label: "רוחב דרך גישה לרכב כיבוי", unit: "מ'", value: 4, source: "תקנות התכנון והבנייה (בקשה להיתר), תש\"ל-1970, תוספת שנייה, בניינים גבוהים: דרך גישה. ציטוט מתקציר חיפוש", verified: false, step: 0.05 },
  { id: "fire.roadException", group: "fire", label: "רוחב מינימלי בהקלה", unit: "מ'", value: 3.7, source: "כנ\"ל: באישור הרשות, בחוות דעת הנדסית ובהתייעצות עם הכבאות", verified: false, step: 0.05 },
  { id: "fire.stagingL", group: "fire", label: "אורך רחבת היערכות", unit: "מ'", value: 12, source: "כנ\"ל: רחבה 6×12 מ' לפחות (תקציר חיפוש)", verified: false },
  { id: "fire.stagingW", group: "fire", label: "רוחב רחבת היערכות", unit: "מ'", value: 6, source: "כנ\"ל", verified: false },
  { id: "fire.stagingToFacade", group: "fire", label: "מרחק מרבי מהרחבה לחזית עם חלון חילוץ", unit: "מ'", value: 6, source: "כנ\"ל", verified: false },
  { id: "fire.hydrantToEntrance", group: "fire", label: "מרחק מרבי מברז כיבוי לכניסה", unit: "מ'", value: 30, source: "הוראת נציב 550, תקציר חיפוש משובש", verified: false },
  { id: "fire.hydrantSpacing", group: "fire", label: "מרווח מרבי בין ברזי כיבוי ברחוב, אזור מגורים", unit: "מ'", value: 120, source: "כללי המים (אספקת מים לכבאות והצלה), תשע\"ח-2018, תקציר חיפוש", verified: false },
  { id: "fire.highFrom", group: "fire", label: "בניין גבוה: מגובה", unit: "מ'", value: 13, source: "מקורות משניים", verified: false },
  { id: "fire.tallFrom", group: "fire", label: "בניין רב קומות: מעל גובה", unit: "מ'", value: 29, source: "מקורות משניים; תואם את סף הגנרטור באוגדן אשדוד (29 מ')", verified: false },
  { id: "prog.household", group: "program", label: "נפשות ליחידת דיור, אשדוד", unit: "נפש ליח\"ד", value: 3.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: הלמ\"ס 2023", verified: false, step: 0.1 },
  { id: "prog.daycare.pct", group: "program", label: "מעון יום (0 עד 3): שיעור מהתושבים", unit: "%", value: 2.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.1 },
  { id: "prog.daycare.per", group: "program", label: "מעון יום: ילדים לקבוצה", unit: "ילדים", value: 20, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 1 },
  { id: "prog.daycare.m2", group: "program", label: "מעון יום: מ\"ר לילד", unit: "מ\"ר", value: 8, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.5 },
  { id: "prog.kinder.pct", group: "program", label: "גן ילדים (3 עד 6): שיעור מהתושבים", unit: "%", value: 3, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.1 },
  { id: "prog.kinder.per", group: "program", label: "גן ילדים: ילדים לכיתה", unit: "ילדים", value: 35, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 1 },
  { id: "prog.kinder.m2", group: "program", label: "גן ילדים: מ\"ר לילד", unit: "מ\"ר", value: 8, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.5 },
  { id: "prog.elem.pct", group: "program", label: "בית ספר יסודי (6 עד 12): שיעור מהתושבים", unit: "%", value: 5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.1 },
  { id: "prog.elem.per", group: "program", label: "יסודי: תלמידים לכיתה", unit: "תלמידים", value: 32, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 1 },
  { id: "prog.elem.m2", group: "program", label: "יסודי: מ\"ר לתלמיד", unit: "מ\"ר", value: 6, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.5 },
  { id: "prog.middle.pct", group: "program", label: "חטיבת ביניים (12 עד 15): שיעור מהתושבים", unit: "%", value: 2.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.1 },
  { id: "prog.middle.per", group: "program", label: "חטיבת ביניים: תלמידים לכיתה", unit: "תלמידים", value: 32, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 1 },
  { id: "prog.middle.m2", group: "program", label: "חטיבת ביניים: מ\"ר לתלמיד", unit: "מ\"ר", value: 7, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.5 },
  { id: "prog.high.pct", group: "program", label: "תיכון (15 עד 18): שיעור מהתושבים", unit: "%", value: 2.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.1 },
  { id: "prog.high.per", group: "program", label: "תיכון: תלמידים לכיתה", unit: "תלמידים", value: 32, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 1 },
  { id: "prog.high.m2", group: "program", label: "תיכון: מ\"ר לתלמיד", unit: "מ\"ר", value: 7, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד החינוך", verified: false, step: 0.5 },
  { id: "prog.pk.res", group: "program", label: "חניות דיירים ליח\"ד", unit: "חניות", value: 1.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 0.05 },
  { id: "prog.pk.vis", group: "program", label: "חניות אורחים ליח\"ד", unit: "חניות", value: 0.25, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים (1 לכל 4 דירות)", verified: false, step: 0.05 },
  { id: "prog.garden", group: "program", label: "גינה שכונתית", unit: "מ\"ר לנפש", value: 4, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: תמ\"א 70", verified: false, step: 0.5 },
  { id: "prog.park", group: "program", label: "פארק שכונתי", unit: "מ\"ר לנפש", value: 7, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: תמ\"א 70", verified: false, step: 0.5 },
  { id: "prog.sport", group: "program", label: "מגרשי ספורט", unit: "מ\"ר לנפש", value: 3, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: תמ\"א 70", verified: false, step: 0.5 },
  { id: "prog.community.m2", group: "program", label: "מרכז קהילתי", unit: "מ\"ר לנפש", value: 0.1, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 0.01 },
  { id: "prog.community.min", group: "program", label: "מרכז קהילתי: מינימום", unit: "מ\"ר", value: 500, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 10 },
  { id: "prog.community.th", group: "program", label: "מרכז קהילתי: סף אוכלוסייה", unit: "נפש", value: 1000, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 100 },
  { id: "prog.clinic.m2", group: "program", label: "מרפאה וקופת חולים", unit: "מ\"ר לנפש", value: 0.05, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הבריאות", verified: false, step: 0.01 },
  { id: "prog.clinic.min", group: "program", label: "מרפאה: מינימום", unit: "מ\"ר", value: 300, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הבריאות", verified: false, step: 10 },
  { id: "prog.clinic.th", group: "program", label: "מרפאה: סף אוכלוסייה", unit: "נפש", value: 2000, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הבריאות", verified: false, step: 100 },
  { id: "prog.library.m2", group: "program", label: "ספרייה ציבורית", unit: "מ\"ר לנפש", value: 0.04, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 0.01 },
  { id: "prog.library.min", group: "program", label: "ספרייה: מינימום", unit: "מ\"ר", value: 200, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 10 },
  { id: "prog.library.th", group: "program", label: "ספרייה: סף אוכלוסייה", unit: "נפש", value: 3000, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 100 },
  { id: "prog.syn.per", group: "program", label: "בית כנסת: נפשות לבית כנסת", unit: "נפש", value: 2000, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 100 },
  { id: "prog.syn.min", group: "program", label: "בית כנסת: מינימום", unit: "מ\"ר", value: 150, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 10 },
  { id: "prog.syn.m2", group: "program", label: "בית כנסת", unit: "מ\"ר לנפש", value: 0.05, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד הפנים", verified: false, step: 0.01 },
  { id: "prog.retail", group: "program", label: "מסחר שכונתי", unit: "מ\"ר לנפש", value: 0.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד השיכון", verified: false, step: 0.1 },
  { id: "prog.storage", group: "program", label: "מחסנים ואחסון", unit: "מ\"ר ליח\"ד", value: 0.2, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: משרד השיכון", verified: false, step: 0.1 },
  { id: "prog.shelter", group: "program", label: "מרחב מוגן ציבורי: נפשות למ\"ר", unit: "נפש", value: 10, source: "אפליקציית \"יועץ פרוגרמות\" של ענת: פיקוד העורף", verified: false, step: 1 },
  { id: "dev.rate", group: "levies", label: "שיעור מטלת יזם משטח המתחם", unit: "%", value: 5.5, source: "אפליקציית \"יועץ פרוגרמות\" של ענת; לא צוין מקור במקור", verified: false, step: 0.1 },
  { id: "dev.cap.shelter", group: "levies", label: "מטלה: תקרת ממ\"ד ציבורי", unit: "% מהמטלה", value: 15, source: "אפליקציית \"יועץ פרוגרמות\" של ענת", verified: false, step: 1 },
  { id: "dev.cap.community", group: "levies", label: "מטלה: תקרת מרכז קהילתי", unit: "% מהמטלה", value: 30, source: "אפליקציית \"יועץ פרוגרמות\" של ענת", verified: false, step: 1 },
  { id: "dev.cap.clinic", group: "levies", label: "מטלה: תקרת מרפאה", unit: "% מהמטלה", value: 20, source: "אפליקציית \"יועץ פרוגרמות\" של ענת", verified: false, step: 1 },
  { id: "dev.cap.library", group: "levies", label: "מטלה: תקרת ספרייה", unit: "% מהמטלה", value: 15, source: "אפליקציית \"יועץ פרוגרמות\" של ענת", verified: false, step: 1 },
  { id: "dev.cap.spa", group: "levies", label: "מטלה: תקרת שצ\"פ וגינה", unit: "% מהמטלה", value: 25, source: "אפליקציית \"יועץ פרוגרמות\" של ענת", verified: false, step: 1 },
];

export type KMap = Record<string, number>;
export const DEFAULT_K: KMap = Object.fromEntries(KDEFS.map((d) => [d.id, d.value]));
export const kDef = (id: string) => KDEFS.find((d) => d.id === id);

/** ממזג שינויים של המשתמש (מחרוזות מהשדות) עם ברירות המחדל */
export function mergeK(over?: Record<string, string>): KMap {
  const k = { ...DEFAULT_K };
  if (!over) return k;
  for (const [id, v] of Object.entries(over)) {
    const n = parseFloat(v);
    if (id in k && Number.isFinite(n) && n >= 0) k[id] = n;
  }
  return k;
}

export function changedK(over?: Record<string, string>) {
  const k = mergeK(over);
  return KDEFS.filter((d) => k[d.id] !== d.value);
}
