// בדיקת התאמה של תוכנית בינוי לדרישות גורמי העירייה, מתוך חוות הדעת והשדות של התוכנית (PLANS-GH).
// לכל גורם: מצב (תואם, לא תואם, חסר, דורש בדיקה), ממצא, ציטוט מהמקור והמלצה.
// הבדיקה מבוססת טקסט: היא מאתרת התייחסות ומספרים, ואינה מחליפה את בדיקת הגורם המקצועי.
import { DEFAULT_K, type KMap } from "./constants";
import { calcParking } from "./calculators";

export type Verdict = "ok" | "bad" | "missing" | "review";
export const verdictLabel: Record<Verdict, string> = { ok: "תואם", bad: "לא תואם", missing: "חסר", review: "דורש בדיקה" };

export interface PlanRecord {
  num: string;
  name: string;
  committeeDate: string;
  session: string;
  decision: string;
  fields: Record<string, string>;
  opinion: string;
  images: { file: string; cat: string; title: string; source: string; page: string }[];
}

export interface Finding {
  id: string;
  chapter: string;
  topic: string;
  verdict: Verdict;
  finding: string;
  evidence: string;
  action: string;
}

const sentences = (t: string) => t.split(/\n|(?<=[.;])\s+/).map((s) => s.replace(/\s+/g, " ").trim()).filter((s) => s.length > 3);

function find(text: string, re: RegExp) {
  return sentences(text).filter((s) => re.test(s));
}

function section(text: string, start: RegExp, end: RegExp) {
  const a = text.search(start);
  if (a < 0) return "";
  const rest = text.slice(a);
  const b = rest.slice(10).search(end);
  return b < 0 ? rest : rest.slice(0, b + 10);
}

export interface PlanFacts {
  units: number | null;
  floors: number | null;
  zoning: string | null;
  approvalsLine: string | null;
  missingApprovals: string[];
  reliefs: string[];
  infiltrationPct: number | null;
  fireStaging: number | null;
}

export function extractFacts(p: PlanRecord): PlanFacts {
  const all = `${p.opinion}\n${Object.values(p.fields).join("\n")}`;
  const proposed = section(p.opinion, /תוכנית בינוי מוצעת|תכנית בינוי מוצעת/, /מתקני תפעול|היבטים:/) || all;
  const unitMatches = [...proposed.matchAll(/(?:סה"כ\s*)?(\d[\d,]*)\s*יח"ד/g)];
  const total = [...proposed.matchAll(/סה"כ\s*(\d[\d,]*)\s*יח"ד/g)].map((m) => +m[1].replace(/,/g, ""));
  const units = total.length ? Math.max(...total) : unitMatches.length ? Math.max(...unitMatches.map((m) => +m[1].replace(/,/g, ""))) : null;
  const floorsM = [...proposed.matchAll(/(\d+)\s*קומות\s*מעל\s*0\.00/g)].map((m) => +m[1]);
  const zoning = /התאמה לתב"ע:\s*([^\n]+)/.exec(p.opinion)?.[1]?.trim() ?? null;
  const approvalsLine = /אישורי גורמים:\s*([^\n]+)/.exec(p.opinion)?.[1]?.trim() ?? null;
  const missingApprovals = approvalsLine && /למעט/.test(approvalsLine)
    ? approvalsLine.split(/למעט:?/)[1].split(/[–-]\s*יש להשלים|יש להשלים/)[0].split(/,|\sו(?=\S)/).map((s) => s.trim()).filter(Boolean)
    : [];
  const reliefs = find(all, /הקלה|בהקלה/).slice(0, 12);
  const pct = [...all.matchAll(/חלחול[^.\n]{0,40}?(\d{1,2})%/g)].map((m) => +m[1]);
  const fireM = /(\d+)\s*רחבות\s*כיבוי/.exec(all);
  return {
    units,
    floors: floorsM.length ? Math.max(...floorsM) : null,
    zoning,
    approvalsLine,
    missingApprovals,
    reliefs,
    infiltrationPct: pct.length ? Math.max(...pct) : null,
    fireStaging: fireM ? +fireM[1] : /רחב(ת|ות) כיבוי/.test(all) ? 1 : null,
  };
}

interface Rule { id: string; chapter: string; topic: string; any: RegExp; approval?: RegExp }

const rules: Rule[] = [
  { id: "parking", chapter: "roads", topic: "חניה, תנועה וכניסה למגרש", any: /חני(ה|יה|ון|ות)|כניסת רכבים|תנועת רכבים/, approval: /תנועה|תשתיות|כבישים/ },
  { id: "drainage", chapter: "drainage", topic: "ניקוז, חלחול והשהיה", any: /ניקוז|חלחול|החדרה|השהיה|בור קידוח/, approval: /ניקוז|תשתיות/ },
  { id: "planting", chapter: "planting", topic: "צמחייה, עצים והצללה", any: /צמחי|עצים|הצלל|פרגול|גינון/, approval: /נטיעות|גינון|נוף/ },
  { id: "electricity", chapter: "electricity", topic: "חדר שנאים, מיתוג ותאורה", any: /טרפו|שנאי|חדר מיתוג|חשמל/, approval: /חשמל/ },
  { id: "waste", chapter: "sanitation", topic: "אשפה, מחזור ופינוי", any: /אשפה|טמונ|דחסנ|מחזור|גזם/, approval: /תברואה|אשפה/ },
  { id: "water", chapter: "water", topic: "מדי מים, גמל וחיבור", any: /מד(י)? מים|גמל מים|מים וביוב/, approval: /מים|יובלים|תשתיות/ },
  { id: "environment", chapter: "environment", topic: "איכות הסביבה וקיימות", any: /סביבתי|קיימות|אקוסט|קרינ|אסבסט/, approval: /סביבה/ },
  { id: "fire", chapter: "fire", topic: "רחבות כיבוי וגישה לכבאות", any: /רחב(ת|ות) כיבוי|כיבוי אש/, approval: /כבאות|כיבוי/ },
  { id: "gas", chapter: "electricity", topic: "צובר גז", any: /צובר גז|גז/, approval: /גז/ },
];

export function reviewPlan(p: PlanRecord, k: KMap = DEFAULT_K) {
  const all = `${p.opinion}\n${Object.values(p.fields).join("\n")}`;
  const facts = extractFacts(p);
  const findings: Finding[] = [];

  // התאמה לתב"ע ואישורי גורמים
  findings.push({
    id: "zoning", chapter: "licensing", topic: "התאמה לתב\"ע",
    verdict: !facts.zoning ? "missing" : /למעט|הקל/.test(facts.zoning) ? "review" : /תואם/.test(facts.zoning) ? "ok" : "review",
    finding: facts.zoning ? facts.zoning : "לא נמצאה קביעה לגבי התאמה לתב\"ע",
    evidence: facts.zoning ? `התאמה לתב"ע: ${facts.zoning}` : "",
    action: facts.zoning && /למעט|הקל/.test(facts.zoning) ? "לבחון את ההקלות בהליך הבקשה להיתר" : facts.zoning ? "" : "להשלים חוות דעת התאמה לתב\"ע",
  });
  findings.push({
    id: "approvals", chapter: "licensing", topic: "אישורי גורמים",
    verdict: !facts.approvalsLine ? "missing" : facts.missingApprovals.length ? "missing" : "ok",
    finding: facts.missingApprovals.length ? `חסרים אישורים: ${facts.missingApprovals.join(", ")}` : facts.approvalsLine ?? "לא נמצא פירוט אישורי גורמים",
    evidence: facts.approvalsLine ? `אישורי גורמים: ${facts.approvalsLine}` : "",
    action: facts.missingApprovals.length ? `להשלים חתימות: ${facts.missingApprovals.join(", ")}` : facts.approvalsLine ? "" : "לצרף טבלת אישורי גורמים",
  });

  for (const r of rules) {
    const hits = find(all, r.any);
    const relief = hits.find((s) => /הקלה|בהקלה/.test(s));
    const missingApproval = r.approval ? facts.missingApprovals.find((m) => r.approval!.test(m)) : undefined;
    let verdict: Verdict = hits.length ? "ok" : "missing";
    let finding = hits.length ? `נמצאה התייחסות (${hits.length})` : "לא נמצאה התייחסות בתוכנית";
    let action = hits.length ? "" : `להשלים פתרון ל${r.topic} בנספח הבינוי`;
    if (relief) { verdict = "review"; finding = "מבוקשת הקלה בנושא"; action = "לבחון את ההקלה מול התקן ומול הגורם"; }
    if (missingApproval) { verdict = verdict === "missing" ? "missing" : "review"; finding += `; חסר אישור ${missingApproval}`; action = `להשלים אישור ${missingApproval}`; }

    if (r.id === "drainage" && facts.infiltrationPct !== null) {
      const req = k["dr.minInfilPct"];
      if (facts.infiltrationPct < req) { verdict = "bad"; finding = `שטח מחלחל ${facts.infiltrationPct}% מול ${req}% נדרש`; action = "להגדיל שטח מחלחל או לצרף נספח הידרולוגיה"; }
      else finding = `שטח מחלחל ${facts.infiltrationPct}%, מעל ${req}% הנדרשים`;
    }
    if (r.id === "fire" && facts.fireStaging !== null) finding = `${facts.fireStaging} רחבות כיבוי מסומנות`;
    if (r.id === "fire" && facts.floors !== null && facts.floors * 3.2 > k["fire.tallFrom"] && !/מתז|ספרינקלר/.test(all)) {
      verdict = verdict === "ok" ? "review" : verdict;
      finding += `; כ-${facts.floors} קומות (בניין רב קומות), לא נמצאה התייחסות למתזים`;
      action = "לוודא ספח בטיחות אש: מתזים, שני חדרי מדרגות ומעלית אלונקה";
    }
    findings.push({ id: r.id, chapter: r.chapter, topic: r.topic, verdict, finding, evidence: (relief ?? hits[0] ?? "").slice(0, 220), action });
  }

  // בדיקה מספרית: חניה נדרשת לפי האוגדן ליחידות שבתוכנית
  let parkingRequired: number | null = null;
  if (facts.units) {
    parkingRequired = calcParking([{ id: "u", useType: "residential_small", units: String(facts.units) }], "ashdod", k).total;
  }

  const counts = { ok: 0, bad: 0, missing: 0, review: 0 } as Record<Verdict, number>;
  findings.forEach((f) => counts[f.verdict]++);
  const score = findings.length ? (counts.ok + counts.review * 0.5) / findings.length : 0;
  return { facts, findings, counts, score, parkingRequired };
}
