// מקור הנתונים המרכזי: אוגדן הנחיות מידע להיתר לעורכי בקשה, עיריית אשדוד, נוסח 01/01/2025.
// כל תצוגה באפליקציה נגזרת מהקובץ הזה. אין טקסט מקצועי קשיח בתוך רכיבי UI.

export interface ContactPerson {
  name: string;
  role: string;
  phone: string;
  email: string;
  /** אימות מול אתרי העירייה. בלי שדה: הנתון מהאוגדן (01/2025) ולא אומת */
  checked?: { status: "confirmed" | "changed" | "notfound"; date: string; source?: string; note?: string };
}

export type ToolId = "parking" | "fee" | "waste" | "drainage" | "green" | "water" | "program" | "levies" | "devob" | "mamad" | "fireAccess";

export type Block =
  | { kind: "text"; title: string; body: string }
  | { kind: "checklist"; id: string; title: string; items: string[] }
  | { kind: "notes"; title: string; items: string[] }
  | { kind: "cards"; title: string; cards: { title: string; body: string }[] }
  | { kind: "stages"; title: string; items: string[] }
  | { kind: "alert"; body: string }
  | { kind: "contactInfo"; title: string; lines: string[]; alert?: string }
  | { kind: "tracks" }
  | { kind: "bank" }
  | { kind: "tool"; tool: ToolId }
  | { kind: "sources"; title: string; items: { title: string; url?: string; verified: boolean; note?: string }[] };

export interface Chapter {
  id: string;
  title: string;
  short: string;
  description: string;
  /** מפתח ייעוד הקרקע במקרא מבא"ת (src/data/landuse.ts) שקובע את צבע האגף */
  tone: string;
  department: string;
  hours: string;
  contacts: ContactPerson[];
  blocks: Block[];
}

/** קיים אוגדן מעודכן יותר: "מותאם לנוהל 29-09-2025" (ashdod.muni.il/media/16515813/). האפליקציה מבוססת על נוסח 01/01/2025. */
export const newerSource = { label: "אוגדן הנחיות מידע להיתר, מותאם לנוהל 29-09-2025", url: "https://www.ashdod.muni.il/media/16515813/", index: "https://digital.ashdod.muni.il/page/Department-Engineer-file-Instructions" };

/** קישורים כלליים לכל אגף. קישורים ייעודיים נאספים מבלוקי המקורות של האגף */
export const generalLinks = [
  { title: "תיק מידע והנחיות, מינהל הנדסה (אתר הדיגיטל)", url: newerSource.index },
  { title: newerSource.label, url: newerSource.url },
  { title: "מבא\"ת: מקרא ייעודי קרקע (מינהל התכנון)", url: "https://www.gov.il/he/departments/guides/mavat" },
];

export const source = {
  title: "אוגדן הנחיות מידע להיתר לעורכי בקשה",
  publisher: "עיריית אשדוד, מינהל הנדסה",
  version: "01/01/2025",
  versionLabel: "ינואר 2025",
};

export const permitTracks = [
  { id: "short", name: "מסלול מקוצר", days: 25, description: "בקשות פשוטות ללא חריגות" },
  { id: "full", name: "מסלול מלא, תואם תב\"ע", days: 45, description: "בקשות תואמות תכנית בניין עיר" },
  { id: "relief", name: "מסלול מלא, כולל הקלות או שימושים חורגים", days: 90, description: "בקשות הכוללות הקלות או שימושים חורגים" },
];

export const bankAccounts = [
  { bank: "לאומי", bankNum: "10", branch: "932", account: "49660021", iban: "IL32019320000049660021" },
  { bank: "לאומי", bankNum: "10", branch: "932", account: "700100/04", iban: "ILl07109320000070010004" },
  { bank: "הפועלים", bankNum: "12", branch: "658", account: "14579", iban: "IL200126580000000014579" },
  { bank: "דיסקונט", bankNum: "11", branch: "004", account: "3506", iban: "IL49011004000000200350" },
  { bank: "מזרחי", bankNum: "20", branch: "416", account: "325338", iban: "IL610204160000000325338" },
  { bank: "הבינלאומי", bankNum: "31", branch: "33", account: "409015806", iban: "IL300310330000000015806" },
  { bank: "איגוד", bankNum: "13", branch: "71", account: "80400043", iban: "IL470130710000080400043" },
];

export const paymentNote = "לאחר ביצוע תשלום יש להעביר אסמכתא והודעת חיוב במייל: agrot@ashdod.muni.il (בגרסת האוגדן הופיע בטעות asdod; תוקן לפי אתר הדיגיטל, 11/2026)";

export const wasteVolumeTable = [
  { type: "דירת מגורים", unit: "יח\"ד", volumePerUnit: 7, note: "ליטר ליום" },
  { type: "משרד", unit: "מ\"ר עיקרי", volumePerUnit: 2, note: "ליטר ליום" },
  { type: "מסחר כללי (300-2,000 מ\"ר)", unit: "מ\"ר עיקרי", volumePerUnit: 5, note: "מכבש קרטון" },
  { type: "מסחר גדול (מעל 2,000 מ\"ר)", unit: "מ\"ר עיקרי", volumePerUnit: 10, note: "דחסן קרטון" },
  { type: "מוסד חינוך", unit: "תלמיד", volumePerUnit: 5, note: "ליטר ליום" },
  { type: "בתי חולים", unit: "מ\"ר עיקרי", volumePerUnit: 40, note: "דחסנית קרטון" },
  { type: "תעשיה", unit: "מ\"ר עיקרי", volumePerUnit: 4, note: "ליטר ליום" },
];

export const chapters: Chapter[] = [
  {
    id: "licensing",
    title: "רישוי להיתר",
    short: "רישוי",
    description: "בדיקת בקשות להיתר, מסלולי הגשה, אגרות ופיקדון",
    tone: "res",
    department: "מחלקת רישוי",
    hours: "קבלת קהל: א'-ה', 8:30-12:00 | טלפוני: 8:30-11:00",
    contacts: [
      { name: "ג'ני רוזנבלט", role: "מנהלת מחלקת רישוי בנייה", phone: "08-8545322", email: "geni@ashdod.muni.il", checked: { status: "changed", date: "11/2026", source: "https://www.ashdod.muni.il/he-il/אתר-העיר/הנדסה/רישוי-בנייה/", note: "תואר התפקיד באתר העירייה: מנהלת מחלקת רישוי בנייה. הטלפון שבאתר הוא קו המחלקה 08-8545319" } },
      { name: "אורלי אסייג", role: "מנהלת מחלקת רישוי", phone: "08-9238613", email: "orlyass@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "סילס שריס", role: "מזכירת מחלקת רישוי", phone: "08-8545319", email: "cecil@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "שרונה פנסו", role: "רכזת בקשות להיתר", phone: "08-8545384", email: "sharonap@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "גלינה ליפוביץ", role: "בודקת רישוי", phone: "08-9568127", email: "galinali@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "רימה פלקין", role: "בודקת רישוי", phone: "08-9568243", email: "rimafalkin@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "ליליה נוטקין", role: "בודקת רישוי", phone: "08-9568339", email: "lelya@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "ליאור לוי", role: "מנהל מינהלת התחדשות עירונית", phone: "08-9238701", email: "liorlev@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", note: "חדש, מדף ההתחדשות העירונית באתר העירייה" } },
      { name: "עדן יפרח", role: "מנהלת מחלקת התחדשות עירונית", phone: "08-8545383", email: "edeno@ashdod.muni.il", checked: { status: "notfound", date: "11/2026", note: "בדף ההתחדשות העירונית מופיע ליאור לוי כמנהל המינהלת; התפקיד של עדן יפרח לא אומת" } },
    ],
    blocks: [
      {
        kind: "text",
        title: "תחום אחריות",
        body: "מחלקת הרישוי אחראית לבדיקת התאמת בקשות להיתר להוראות חוק התכנון והבנייה (תשכ\"ה 1965), לתקנותיו ותיקוניו, למדיניות הוועדה, להנחיות המרחביות ולתכניות החלות בקרקע.",
      },
      { kind: "tracks" },
      {
        kind: "checklist",
        id: "graphic",
        title: "תכולה גרפית, התכנית הראשית",
        items: [
          "טבלת שטחים ותרשים סכמתי של חישוב שטחים",
          "תכניות בנייה כוללות תכנית התנוחה של כל מבנה",
          "חתכים וחזיתות כולל ציון חומרי גמר, גבהים, מפלסים",
          "סימון קבועות סניטריות, פירים, צמ\"ג, צ\"א, מתקני תברואה",
          "סימון אלמנטי קונסטרוקציה: עמודים, קורות יורדות, קירות",
          "סימון מיקום מעבי מזגנים, מערכות סולריות, מיזוג אוויר",
          "סימון ארובות, אנטנות, מתקנים טכניים בפירים",
          "סימון מרכיבי הנגשה למבנה",
          "תיאור מיקום מרחב מוגן או מקלט",
        ],
      },
      {
        kind: "contactInfo",
        title: "הזמנת תיק בניין והיתרים קודמים",
        lines: ["מענה טלפוני: א'-ה', 8:00-12:00", "טלפונים: 08-8545327, 08-8545153 (אומת באתר העירייה, 11/2026)", "דוא\"ל: archiv@ashdod.muni.il", "מנהלת הארכיון: שרלי אוחנה, 08-8545327, sharlib@ashdod.muni.il"],
        alert: "תיק בניין שהוזמן יישאר בארכיון 10 ימים מקבלתו, ולאחר מכן יוחזר לגנזך.",
      },
      { kind: "bank" },
      { kind: "tool", tool: "fee" },
    ],
  },
  {
    id: "supervision",
    title: "פיקוח על הבנייה",
    short: "פיקוח",
    description: "מעקב על ביצוע הבנייה, אישור תחילת עבודות, תעודת גמר",
    tone: "future",
    department: "מחלקת פיקוח",
    hours: "קבלת קהל: בזימון מראש | טלפוני: א'-ה', 8:30-11:00",
    contacts: [
      { name: "כרמית סיני", role: "מנהלת פיקוח בנייה", phone: "08-8545310", email: "karmitsi@ashdod.muni.il", checked: { status: "changed", date: "11/2026", source: "https://www.ashdod.muni.il/he-il/אתר-העיר/הנדסה/פיקוח-בנייה/", note: "באוגדן: 08-8545320" } },
      { name: "שירה אטדגי", role: "סגנית מנהלת מחלקת פיקוח", phone: "08-8545320", email: "shiraa@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", source: "https://www.ashdod.muni.il/he-il/אתר-העיר/הנדסה/פיקוח-בנייה/", note: "שם ותפקיד אומתו; הטלפון לא הופיע" } },
      { name: "אודליה פרטוש", role: "מזכירת מחלקת פיקוח בנייה", phone: "08-8545885", email: "odeliapar@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", source: "https://www.ashdod.muni.il/he-il/אתר-העיר/הנדסה/פיקוח-בנייה/", note: "חדשה, מאתר העירייה" } },
      { name: "שושנה אסור", role: "מנהלת מדור בקרה", phone: "08-8545320", email: "shosha@ashdod.muni.il", checked: { status: "changed", date: "11/2026", source: "https://www.ashdod.muni.il/he-il/אתר-העיר/הנדסה/פיקוח-בנייה/", note: "באוגדן: מזכירת מחלקת פיקוח. המזכירה כיום: אודליה פרטוש" } },
      { name: "פליקס מזיבינסקי", role: "מפקח רובע ט\"ז, ב'", phone: "08-9238335", email: "felixm@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", source: "https://www.ashdod.muni.il/media/16515813/", note: "מופיע באוגדן המעודכן 29-09-2025" } },
      { name: "חן אלמליח", role: "מפקחת רובע י\"ז, ד', חוף הים", phone: "08-8545331", email: "chenelmaliah@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", source: "https://www.ashdod.muni.il/media/16515813/", note: "מופיעה באוגדן המעודכן 29-09-2025" } },
    ],
    blocks: [
      {
        kind: "notes",
        title: "תחום אחריות: הגורם הבלעדי המופקד על אכיפת חוק התכנון והבנייה",
        items: [
          "מעקב ופיקוח על ביצוע הבנייה בהתאם להיתר",
          "אישור תחילת עבודות (טופס 2): חיבור מים, בנייה, חשמל",
          "איתור עבירות בנייה ושימושים חורגים",
          "ביצוע צווים מינהליים (הפסקת עבודה, הריסה)",
          "מתן תעודת גמר",
          "אישור טיולים (אישור מכירה או העברה לטאבו)",
          "טיפול ברישיון עסק",
        ],
      },
      { kind: "alert", body: "אין לבצע עבודות על פי היתר בנייה ללא קבלת אישור תחילת עבודות." },
      {
        kind: "checklist",
        id: "start",
        title: "דרישות לאישור תחילת עבודות",
        items: [
          "תכנית גידור והתארגנות אתר",
          "פירוט אמצעי בטיחות באתר",
          "עריכה לפי ההנחיות באתר עיריית אשדוד, מינהל הנדסה",
        ],
      },
    ],
  },
  {
    id: "roads",
    title: "תכנון כבישים ותנועה",
    short: "כבישים",
    description: "תכנון תנועה, חניה, פיתוח שטח, כניסות למגרש",
    tone: "road",
    department: "מחלקת תכנון כבישים",
    hours: "טלפוני: א'-ה', 8:30-11:00 | קבלת קהל: בזימון מראש",
    contacts: [
      { name: "לריסה קגנוב", role: "מנהלת מח' תכנון כבישים", phone: "08-8545290", email: "larisak@ashdod.muni.il" },
      { name: "דימיטרי שנדיבין", role: "מנהל מחלקת תנועה", phone: "08-9238964", email: "dimitrysh@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", note: "שם ותפקיד בכתבה מ-2024; טלפון ודוא\"ל לא אומתו" } },
      { name: "יבגני אברבוך", role: "אזה\"ת צפוני, מבני ים", phone: "08-8545295", email: "evgenyav@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "גליה בלומין", role: "בינוי, פינוי", phone: "08-8545291", email: "galyab@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
      { name: "יאיר רבניא", role: "רפרנט תיאום תשתיות", phone: "08-9238714", email: "yairra@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
    ],
    blocks: [
      {
        kind: "checklist",
        id: "development",
        title: "תכולה גרפית, תכנית פיתוח שטח",
        items: [
          "נערכה על ידי אדריכל נוף בחתימה דיגיטלית",
          "בקנ\"מ 1:250 או 1:100 על רקע מפת מדידה עדכנית",
          "כולל שטח המדרכה בחזית ותיאום עם מגרשים גובלים",
          "סימון ±0.00 ותכנון תנועה וחניה",
          "סימון גבהי קרקע קיימים ומתוכננים בחניה ובשבילים",
          "פתרון ניקוז עילי לכיוון הכניסה למגרש",
          "סימון צמחייה, עצים בוגרים, מתקני אשפה, גידור",
          "פריסת קירות וגדרות בקנ\"מ 1:100",
          "תכנית השקיה כולל מיקום ראש מערכת",
          "תכנית צמחייה: מיקום, כמות וסוג",
        ],
      },
      {
        kind: "checklist",
        id: "parking",
        title: "דרישות חניה, הנחיות ודגשים",
        items: [
          "תכנון חניות לרכב פרטי ותפעולי בהתאם לתקן ולהנחיות משרד התחבורה",
          "חניות נכים בהתאם לחוק הנגישות, באחריות יועץ נגישות",
          "עמדות טעינה לרכב חשמלי: תשתית הכנה לכל החניות הפרטיות",
          "20% מחניות המסחר עם עמדות טעינה בפועל",
          "לא תאושר חניה טורית, למעט מקרים חריגים (עד 10%)",
          "כניסה ויציאה אחת למגרש (למעט מגרשים גדולים)",
          "כניסה מרחובות מקומיים ואספים בלבד, לא מרחובות ראשיים",
          "גובה קירות וגדרות ליד כניסה עד 0.6 מ', שמירה על משולש ראות",
        ],
      },
      { kind: "tool", tool: "parking" },
    ],
  },
  {
    id: "drainage",
    title: "ניקוז ונחלים",
    short: "ניקוז",
    description: "מערכות ניקוז, בורות חלחול, חיבור לרשת עירונית",
    tone: "stream",
    department: "אגף ניקוז ונחלים",
    hours: "קבלת קהל: בזימון מראש",
    contacts: [
      { name: "מירון יעקובוב", role: "מנהל אגף ניקוז ונחלים", phone: "08-8545956", email: "miron@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", source: "https://www.ashdod.muni.il/media/16515813/", note: "מופיע באוגדן 29-09-2025; בפרוטוקול מועצה 01/2025 מוזכרת פרישה של בעל תפקיד, לא ברור אם הוא. לבדוק בטלפון" } },
      { name: "קרן שרייבר", role: "מזכירת מחלקה", phone: "08-8545347", email: "keren@ashdod.muni.il", checked: { status: "notfound", date: "11/2026" } },
    ],
    blocks: [
      {
        kind: "checklist",
        id: "annex",
        title: "תכולה גרפית, נספח ניקוז",
        items: [
          "תכנית פיתוח על רקע מפת מדידה עדכנית בקנ\"מ 1:250",
          "סימון צנרת ניקוז: קטרים, מפלסים, נתונים",
          "שלושה תאי בקרה: תא לפני חיבור, תא נוסף ותא חיבור לרשת עירונית",
          "חתך וחתכנית מערכת ביוב עם פרטי חיבור לרשת עירונית",
          "תכנית למערכת הניקוז כולל רומים של תאי הבקרה",
          "פרט בור חלחול כולל חישוב ספיקות לפי סוג הקרקע",
        ],
      },
      {
        kind: "notes",
        title: "דגשים לתכנון ניקוז",
        items: [
          "פתרון ניקוז עילי לכיוון הכניסה למגרש, ככל האפשר",
          "חיבור לרשת העירונית דרך תאי בקרה, בתיאום עם מחלקת הניקוז",
          "בבקשות לתעשייה ולמזון: לצרף לנספח את דרישות משרד הבריאות",
          "בבקשות עם חובת בקרת מכון: הנספח יתואם עם אגף הניקוז לפני העברה לבקרה",
        ],
      },
      { kind: "tool", tool: "drainage" },
    ],
  },
  {
    id: "planting",
    title: "נטיעות ופיתוח",
    short: "נטיעות",
    description: "גינון, נטיעות, השקיה, פקיד היערות",
    tone: "spa",
    department: "נטיעות ופיתוח",
    hours: "",
    contacts: [],
    blocks: [
      {
        kind: "cards",
        title: "הנחיות לגינון ונטיעות",
        cards: [
          { title: "מרחקי נטיעה מתשתיות", body: "3 מ' ממבנה, 2 מ' ממדרכה. 4 מ' מעמוד תאורה, 3 מ' מקולטן מים. 2 מ' מגדרות וקירות, 2.5 מ' מקווי חשמל. 4 מ' מביוב, 3 מ' מניקוז, 2 מ' ממים." },
          { title: "בור נטיעה", body: "מידות מינימליות: אורך 200 ס\"מ, רוחב 100 ס\"מ, עומק 100 ס\"מ. מילוי באדמת גן עם תוספת 50 ליטר קומפוסט." },
          { title: "השקיה", body: "מערכת השקיה בטפטוף היא חובה. מיקום ראש מערכת ההשקיה יסומן בתכנית. חובת חיבור לשעון מים נפרד." },
          { title: "מדשאות", body: "רק במקומות המיועדים לשימוש, לא ליופי בלבד. דשא מרבדים מקרקע קלה בלבד, ללא רשת פלסטית." },
        ],
      },
      { kind: "stages", title: "שלבי אישור נטיעות", items: ["בקרה מרחבית", "שלב התכן", "תחילת עבודות", "תעודת גמר"] },
      { kind: "tool", tool: "green" },
    ],
  },
  {
    id: "electricity",
    title: "חשמל, מאור ואחזקת רמזורים",
    short: "חשמל",
    description: "תשתיות חשמל, תאורה, גנרטורים, עמדות טעינה",
    tone: "eng",
    department: "אגף החשמל",
    hours: "קבלת קהל: א'-ה', 8:00-13:00, בזימון מראש",
    contacts: [
      { name: "יוחאי אמיר", role: "מנהל אגף החשמל", phone: "08-8545340", email: "amiry@ashdod.muni.il" },
      { name: "אוריאן גדג'", role: "רפרנט רמזורים ואחזקת מאור", phone: "08-9568354", email: "oriangu@ashdod.muni.il", checked: { status: "notfound", date: "11/2026", note: "באוגדן 2022 הופיע יורם שמש כמנהל יחידת רמזורים ומאור (08-8545336)" } },
      { name: "תומר כהן", role: "סגן מנהל מח' חשמל מב\"צ", phone: "08-8545185", email: "tomerc@ashdod.muni.il" },
    ],
    blocks: [
      {
        kind: "checklist",
        id: "spatial",
        title: "בקרה מרחבית",
        items: [
          "נספח פיתוח כולל פריסת תאורה",
          "הצהרת קרינה או יועץ קרינה",
          "סיכום טכני: גודל חדר שנאים ומיקומו",
          "הסכם עם חח\"י לעמדות טעינה חשמליות",
          "גודל חיבור כולל במתקן החשמל",
        ],
      },
      {
        kind: "checklist",
        id: "completion",
        title: "תעודת גמר",
        items: [
          "תכניות עדות (as-made) חשמל קומת קרקע ופיתוח",
          "תכניות עדות חניות תת-קרקעיות",
          "אישור בודק חשמל מוסמך או חברת חשמל",
          "אישור יועץ קרינה אלקטרומגנטית",
          "היתר גנרטור ממשרד התשתיות",
          "בדיקת המתקן בשטח על ידי מפקח אגף החשמל",
          "עמדות טעינה: תשתית לכל החניות הפרטיות, 20% בפועל למסחר",
        ],
      },
      {
        kind: "notes",
        title: "דגשים והנחיות לתכנון חשמל",
        items: [
          "בניין מעל 29 מ' מחויב בגנרטור אחד לפחות",
          "חניון משותף לבניינים מעל 28 מ': גנרטור לכל 2 בניינים",
          "כל בניין מחויב בגוף תאורה מואר בהדלקה עצמית עם שם הרחוב ומספר הבית",
          "תאורת לד חסכונית בגופי התאורה",
          "תאורת חירום בחדרי מדרגות (כולל תמ\"א 38)",
          "סקר היתכנות קרינה בקרבה לקווי מתח עיליים",
        ],
      },
    ],
  },
  {
    id: "sanitation",
    title: "תברואה ואצירת אשפה",
    short: "תברואה",
    description: "פתרונות אצירת אשפה, דחסנים, מצנחות שוט",
    tone: "industry",
    department: "מחלקת בקרה וכלי אצירה",
    hours: "קבלת קהל: בזימון מראש",
    contacts: [
      { name: "קובי זינו", role: "מנהל מחלקת בקרה טכנולוגית", phone: "08-8634863", email: "kobi@ashdod.muni.il", checked: { status: "confirmed", date: "11/2026", source: "https://www.ashdod.muni.il/media/16515813/", note: "מופיע באוגדן המעודכן 29-09-2025" } },
      { name: "עופר עמר", role: "סגן מנהל אגף תפו\"ח, מנהל מחלקת אשפה ומחזור", phone: "08-8634871", email: "oferamar@ashdod.muni.il", checked: { status: "changed", date: "11/2026", source: "https://www.ashdod.muni.il/he-il/אתר-העיר/תפעול/תברואה-פיקוח-וחניה/", note: "באוגדן: 08-8634887" } },
    ],
    blocks: [
      {
        kind: "checklist",
        id: "annex",
        title: "תכולה גרפית, נספח תברואה לאצירת אשפה",
        items: [
          "סוג המבנה המבוקש ושטח במ\"ר",
          "כמות יחידות דיור (קיימות ומוצעות)",
          "חישוב נפח אשפה ביתית מצטברת ליום",
          "חישוב נפח אשפת מחזור ליום",
          "הצעה לכמות ולסוג כלי האצירה",
          "תכנית חדרי אשפה או דחסנית מפורטת (תאורה, מים, ניקוז, חשמל, אוורור)",
          "תכנית תנועה וחניה למשאית פינוי",
          "סימון מרחק טמון: עד 5 מ' ממרכז המשאית; 10 מ' לפחות ממבנה",
        ],
      },
      { kind: "tool", tool: "waste" },
    ],
  },
  {
    id: "water",
    title: "תאגיד המים יובלים",
    short: "מים",
    description: "מערכות מים וביוב, נספח סניטרי, חיבור לרשת",
    tone: "infra",
    department: "תאגיד המים יובלים",
    hours: "כתובת: רחוב אורט 18, קומה 6, פורט-סי",
    contacts: [
      { name: "מקסים פטליס", role: "מהנדס מח' תכנון", phone: "08-8628906", email: "maxim@yuvallim.co.il", checked: { status: "notfound", date: "11/2026", note: "באתר יובלים פורסמה משרת מהנדס/ת מחלקת תכנון; ייתכן שהתפקיד התחלף" } },
      { name: "מזכירות", role: "מח' תכנון", phone: "08-8544333", email: "" },
    ],
    blocks: [
      {
        kind: "checklist",
        id: "sanitary",
        title: "תכולה גרפית, נספח סניטרי",
        items: [
          "תכנית בקנ\"מ 1:2500 או 1:1250",
          "מפת מדידה עדכנית על ידי מודד מוסמך",
          "פריסת קווי מים וביוב",
          "פרט חיבור לרשת המים העירונית (כולל חוזר)",
          "סכמת מערכת הספקת מים פנימית וחיצונית",
          "סכמת מערכת ביוב כולל קולטנים",
          "חתך קווי ביוב בחצר הבניין",
          "חישוב הידראולי של מהנדס אינסטלציה",
        ],
      },
      {
        kind: "checklist",
        id: "yuvallim",
        title: "תהליך מול תאגיד יובלים",
        items: [
          "בשלב חוות הדעת: קבלת מפת GIS של קווי המים והביוב ואוגדן הרישוי והתשתיות של יובלים, דרך מחלקת מידע להיתר",
          "תיאום מראש של חיבור מים זמני לבנייה",
          "מד מים לבנייה: מותקן על ידי התאגיד או בפיקוחו, אחרי תשלום, ורק כשיש תשתית בגבול המגרש",
          "העברת כתב ההתחייבות וההיתר למחלקת הגבייה לפתיחת חשבון ומד",
          "התקנת מכשיר מונע זרימה חוזרת (מז\"ח) בראש מערכת המים, על ידי מתקין מוסמך",
          "תשלום דמי הקמה למים ולביוב לפני חוות הדעת לתעודת גמר",
        ],
      },
      {
        kind: "sources",
        title: "מקורות: מים וביוב",
        items: [
          { title: "יובלים: הנחיות לקבלת אישור לאספקת מים וחיבור ביוב לבניין חדש", url: "https://www.yuvallim.co.il/", verified: false, note: "נקרא מתקציר חיפוש" },
          { title: "תקנות בריאות העם (התקנת מכשיר מונע זרימת מים חוזרת), התשנ\"ב-1992", verified: false, note: "סוג המכשיר לפי סיווג: לאימות" },
          { title: "הוראות למתקני תברואה (הל\"ת) ותקנות התכנון והבנייה (תכן הבנייה) (תברואה), תש\"ף-2019", verified: false, note: "מרחקים בין תאי בקרה: לאימות" },
        ],
      },
      { kind: "tool", tool: "water" },
    ],
  },
  {
    id: "environment",
    title: "איגוד ערים לאיכות הסביבה",
    short: "סביבה",
    description: "סקר קרקע, אסבסט, דוח אקוסטי, נגר עילי",
    tone: "nature",
    department: "איגוד ערים לאיכות הסביבה",
    hours: "כתובת: רחוב יאיר 2, אשדוד",
    contacts: [{ name: "איתי מירז", role: "מרכז תכנון סביבתי", phone: "08-8519500", email: "eitay@env.org.il", checked: { status: "notfound", date: "11/2026", note: "נמצא רק בדוח שנתי מ-2011" } }],
    blocks: [
      {
        kind: "checklist",
        id: "spatial",
        title: "בקרה מרחבית",
        items: [
          "סקר היסטורי לזיהום קרקע (במגרשים חשודים)",
          "תצהיר מאזן חומרי חפירה ומילוי",
          "דוח אקוסטי (שימושים ציבוריים ומסחר)",
          "חתך חדר גנרטור כולל מיגון אקוסטי (קנ\"מ 1:50)",
          "תצהיר עורך הבקשה בעניין אסבסט",
          "נספח הידרולוגיה (מגרשים עם פחות מ-15% שטח חלחול)",
          "סקר בטיחות קרינה ממתקני חשמל",
        ],
      },
      {
        kind: "checklist",
        id: "start",
        title: "תחילת עבודות",
        items: [
          "אישור המשרד להגנת הסביבה לטיפול בקרקע (אם נדרש)",
          "הודעה לדיירים 24 שעות לפני עבודות הריסה",
          "דוח סביבתי לעבודות הריסה (מעל 1,000 מ\"ר)",
          "אישור ממונה אסבסט לפירוק ולסילוק",
          "הסכם פינוי עודפי חפירה",
          "דוח אקלימי לפי סיווג המבנה",
        ],
      },
      {
        kind: "checklist",
        id: "completion",
        title: "תעודת גמר",
        items: [
          "אישור יועץ איטום לפי הנחיות הסביבה",
          "אישור אקוסטי על ביצוע ההמלצות",
          "אישור עורך נספח הניקוז והחדרת הנגר",
          "מדידת קרינה על ידי גורם מוסמך",
        ],
      },
      {
        kind: "cards",
        title: "דגשים סביבתיים",
        cards: [
          { title: "סקר קרקע", body: "נדרש בשטחים חשודים או מוכרים כמזוהמים: תחנות דלק, מפעלי תעשייה, בסיסים צבאיים, מוסכים. כולל דיגום קרקע וגז ותכנית טיפול." },
          { title: "אסבסט", body: "הריסת מבנים עם רכיבי אסבסט-צמנט תבוצע רק על ידי קבלן מורשה. מינוי קבלן מורשה הוא תנאי להיתר." },
          { title: "נגר עילי", body: "יש להציג לפחות 15% שטחים מחלחלים (לא מרוצפים, לא מעל מרתפים). ניקוז לערוגות גינון ולאזורים פנויים בתחומי המגרש בלבד." },
        ],
      },
    ],
  },
  {
    id: "fire",
    title: "כבאות והצלה",
    short: "כבאות",
    description: "דרך גישה ורחבת היערכות, ברזי כיבוי, סיווג גובה, ספח בטיחות אש",
    tone: "employ",
    department: "רשות הכבאות וההצלה, מחוז דרום",
    hours: "",
    contacts: [],
    blocks: [
      {
        kind: "sources",
        title: "מסגרת חוקית והוראות",
        items: [
          { title: "תקנות התכנון והבנייה (בקשה להיתר, תנאיו ואגרות), תש\"ל-1970, תוספת שנייה חלק ג' (פרק 3.9: בטיחות אש)", url: "https://www.nevo.co.il/law_html/law01/044_046.htm", verified: false },
          { title: "הוראת נציב 532: ספח בטיחות אש ומקרא אחיד (בתוקף מ-1.2.2022)", verified: false },
          { title: "הוראת נציב 550: מערכות גילוי וכיבוי אש (עדכון 7.2.2022)", verified: false },
          { title: "כללי המים (אספקת מים לכבאות והצלה), תשע\"ח-2018", url: "https://www.nevo.co.il/law_html/law01/501_852.htm", verified: false },
          { title: "ת\"י 1596 (מערכות מתזים), ת\"י 1220 (גילוי), ת\"י 412 (עומסים)", verified: false },
        ],
      },
      {
        kind: "checklist",
        id: "access",
        title: "גישה לרכב כיבוי",
        items: [
          "דרך גישה ברוחב 4 מ' לפחות, פנויה ממכשולים (הקלה עד 3.70 מ' בחוות דעת הנדסית ובתיאום)",
          "רחבת היערכות 6×12 מ' לפחות",
          "הרחבה במרחק עד 6 מ' מהחזית שבה חלון החילוץ",
          "ברז כיבוי במרחק עד 30 מ' מהכניסה לבניין",
          "ברזי כיבוי ברחוב: מרווח עד 120 מ' באזור מגורים, עד 80 מ' בתעשייה",
          "דרך ורחבה מתוכננות לעומס רכב כיבוי לפי ת\"י 412",
        ],
      },
      {
        kind: "checklist",
        id: "submit",
        title: "בקשה להיתר ותעודת גמר",
        items: [
          "ספח בטיחות אש לפי הוראת נציב 532, עם המקרא האחיד",
          "סימון דרך הגישה, רחבת ההיערכות וחלונות החילוץ בתכנית הפיתוח",
          "בניין גבוה: מתזים בשטחים המשותפים",
          "בניין רב קומות (מעל 29 מ'): שני חדרי מדרגות ומעלית אלונקה",
          "דרך צרה מהתקן (תמ\"א 38, פינוי בינוי): מתזים לפי הבהרת רשות הכבאות 09/2017",
          "בסיום הבנייה: הצהרת מהנדס שהרחבה ונתיב הגישה בוצעו לפי התכנון",
        ],
      },
      { kind: "tool", tool: "fireAccess" },
    ],
  },
  {
    id: "hfc",
    title: "פיקוד העורף: מיגון",
    short: "מיגון",
    description: "מרחב מוגן דירתי, קומתי ומוסדי, מפרטים ואישור פיקוד העורף",
    tone: "rail",
    department: "פיקוד העורף, ענף הנדסה",
    hours: "",
    contacts: [],
    blocks: [
      {
        kind: "sources",
        title: "מסגרת חוקית ומפרטים",
        items: [
          { title: "תקנות ההתגוננות האזרחית (מפרטים לבניית מקלטים), תש\"ן-1990, על תיקוניהן", url: "https://www.nevo.co.il/law_html/law01/125_020.htm", verified: false },
          { title: "מפרט פיקוד העורף לתכנון ממ\"ד: לבדוק את הגרסה העדכנית (אוקטובר 2024; עדכון 2026 לא אומת)", verified: false },
          { title: "מפרט חדרים רטובים במרחב מוגן, אוקטובר 2024", verified: false },
          { title: "ת\"י 4422 (חלונות הדף), ת\"י 4570 (מערכות סינון ואוורור)", verified: false },
        ],
      },
      {
        kind: "checklist",
        id: "mamad",
        title: "מרחב מוגן דירתי (ממ\"ד)",
        items: [
          "שטח נטו 9 מ\"ר לפחות, בלי עובי הקירות",
          "נפח 22.5 מ\"ק לפחות",
          "קיר חוץ מבטון מזוין 25 ס\"מ לפחות; 30 ס\"מ בקיר עם חלון הדף נגרר",
          "גובה פנימי לפי המפרט (במקורות משניים 2.50 עד 2.80 מ')",
          "חלון הדף ומסגרת לפי ת\"י 4422",
          "דלת הדף לפי המפרט",
          "מערכת סינון ואוורור לפי ת\"י 4570",
          "אישור תכנית הממ\"ד על ידי פיקוד העורף",
        ],
      },
      { kind: "tool", tool: "mamad" },
    ],
  },
  {
    id: "program",
    title: "פרוגרמה ומטלות יזם",
    short: "פרוגרמה",
    description: "צורכי ציבור לפי מספר יח\"ד, היטלים, אגרות ומטלות היזם",
    tone: "public",
    department: "מינהל הנדסה, אגף תכנון: מחלקת פרוגרמות ותועלות ציבוריות",
    hours: "",
    contacts: [],
    blocks: [
      { kind: "text", title: "למה פרוגרמה", body: "תכנית שמוסיפה יחידות דיור מוסיפה תושבים, ולכן גם ביקוש לגנים, לבתי ספר, למבני ציבור ולשטחים פתוחים. הפרוגרמה מתרגמת את מספר יח\"ד לשטחים הנדרשים, לפי נורמות ארציות ועירוניות." },
      { kind: "tool", tool: "program" },
      { kind: "tool", tool: "devob" },
      { kind: "tool", tool: "levies" },
    ],
  },
];

export const tools: { id: ToolId; title: string; short: string; chapter: string; purpose: string }[] = [
  { id: "parking", title: "מחשבון חניה", short: "חניה", chapter: "roads", purpose: "מקומות חניה, רכב תפעולי, נכים ועמדות טעינה, לשימוש מעורב" },
  { id: "drainage", title: "מחשבון ניקוז", short: "ניקוז", chapter: "drainage", purpose: "ספיקת שיא לפי נוסחת הרציונל, נפח נגר, בור חלחול ובדיקת 15%" },
  { id: "green", title: "מחשבון שטח ירוק", short: "שטח ירוק", chapter: "planting", purpose: "שטח ירוק וחלחול, עצים בוגרים והצללה" },
  { id: "waste", title: "מחשבון אשפה", short: "אשפה", chapter: "sanitation", purpose: "נפחי אצירה רטובה ויבשה, דחסניות, טמונים ומחזור" },
  { id: "water", title: "מחשבון מים", short: "מים", chapter: "water", purpose: "צריכה סניטרית והשקיה שנתית, ספיקת שיא וקוטר צינור" },
  { id: "fee", title: "מחשבון אגרות", short: "אגרות", chapter: "licensing", purpose: "אומדן אגרת בנייה ופיקדון" },
  { id: "program", title: "מחשבון פרוגרמה לצורכי ציבור", short: "פרוגרמה", chapter: "program", purpose: "גנים, כיתות, מבני ציבור ושצ\"פ לפי מספר יח\"ד ונורמות שהוזנו" },
  { id: "devob", title: "מחשבון מטלת יזם", short: "מטלת יזם", chapter: "program", purpose: "שטח מטלת יזם משטח המתחם, וחלוקתו לשימושים לפי גודל האוכלוסייה" },
  { id: "levies", title: "מחשבון היטלים ואגרות", short: "היטלים", chapter: "program", purpose: "היטלי סלילה, תיעול ושצ\"פ, דמי הקמה ואגרת בנייה, לפי תעריפים שהוזנו" },
  { id: "mamad", title: "בדיקת ממ\"ד", short: "ממ\"ד", chapter: "hfc", purpose: "שטח נטו, נפח, גובה ועובי קיר מול המינימום, עם שרטוט בקנה מידה" },
  { id: "fireAccess", title: "בדיקת גישת כבאות", short: "כבאות", chapter: "fire", purpose: "סיווג גובה, דרך גישה, רחבת היערכות וברז כיבוי, עם סכמה צבעונית" },
];

export interface DirectoryEntry extends ContactPerson {
  department: string;
  chapterId: string;
}

export const directory: DirectoryEntry[] = chapters
  .flatMap((c) => c.contacts.map((p) => ({ ...p, department: c.department, chapterId: c.id })))
  .sort((a, b) => a.name.localeCompare(b.name, "he"));

export function checklistBlocks(chapter: Chapter) {
  return chapter.blocks.filter((b): b is Extract<Block, { kind: "checklist" }> => b.kind === "checklist");
}

export function itemKey(chapterId: string, blockId: string, index: number) {
  return `${chapterId}.${blockId}.${index}`;
}

export function allChecklistKeys(chapter: Chapter) {
  return checklistBlocks(chapter).flatMap((b) => b.items.map((_, i) => itemKey(chapter.id, b.id, i)));
}
