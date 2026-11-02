// מחשבונים נוספים: פרוגרמה לצורכי ציבור, מטלות יזם (היטלים ואגרות), בדיקת ממ"ד, בדיקת גישת כבאות.
// כל נורמה ניתנת לעריכה ונשמרת עם מקור. כשאין מקור מאומת, השדה ריק ומוסבר.
import { useState } from "react";
import { calcFireAccess, calcLevies, calcMamad, calcProgram } from "../logic/calculators2";
import { defaultLevies, defaultProgram, uid, updateProject, useK, useProject, type LevyRow, type ProgramRow } from "../state/store";
import { Icon } from "./icons";
import { Metric, NumField, Stamp, Steps } from "./ui";
import { Light, StackBar, Waffle, type Status } from "./viz";

const fmt = (n: number, d = 0) => n.toLocaleString("he-IL", { maximumFractionDigits: d });

const SourceLinks = ({ links }: { links: [string, string][] }) => (
  <div className="sources">
    <b>מקורות לאימוץ הנורמות</b>
    <ol className="numlist">
      {links.map(([t, u], i) => <li key={u}><span className="num-badge mono">{i + 1}</span><a href={u} target="_blank" rel="noreferrer">{t}</a></li>)}
    </ol>
  </div>
);

/* ---------------- פרוגרמה לצורכי ציבור ---------------- */
export function ProgramTool() {
  const p = useProject();
  const prog = p.program ?? defaultProgram();
  const r = calcProgram(p.units, prog);
  const set = (patch: Partial<typeof prog>) => updateProject({ program: { ...prog, ...patch } });
  const setRow = (id: string, patch: Partial<ProgramRow>) => set({ rows: prog.rows.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const cell = (row: ProgramRow, key: keyof ProgramRow, label: string) => (
    <input className="input sm" type="number" min={0} step="any" value={row[key]} onChange={(e) => setRow(row.id, { [key]: e.target.value })} aria-label={`${row.name}: ${label}`} />
  );
  return (
    <div className="stack" data-tool="program">
      <Stamp kind="warn" seal="נורמות" title="הנורמות ריקות עד שיוזנו ממקור מאומת">
        המדריך הארצי להקצאת שטחים לצורכי ציבור (2016) והנחיות אשדוד לעריכת פרוגרמה (דצמבר 2025) לא היו נגישים מהסביבה שבה נבנה הכלי. מזינים את הנורמות מהמסמך, וכל שורה נשמרת בתיק הבקשה.
      </Stamp>
      <div className="grid g3">
        <NumField label="יחידות דיור בתכנית" value={p.units} onChange={(units) => updateProject({ units })} linked testId="units" />
        <NumField label="גודל משק בית (נפשות ליח״ד)" value={prog.household} onChange={(household) => set({ household })} hint="לפי הלמ״ס לאשדוד או לפי המדריך" testId="household" />
        <NumField label='שצ"פ לנפש (מ"ר)' value={prog.spaPerCapita} onChange={(spaPerCapita) => set({ spaPerCapita })} hint="לפי המדריך, לפי מדרג שכונתי או רובעי" />
      </div>
      <label className="field"><span>מקור הנורמות שהוזנו</span><input className="input text" value={prog.source} onChange={(e) => set({ source: e.target.value })} placeholder="לדוגמה: הנחיות אשדוד לפרוגרמה, דצמבר 2025, טבלה 3" /></label>
      <div className="table-wrap">
        <table className="ktable">
          <thead><tr><th>#</th><th>שירות</th><th>קבוצת גיל, % מהאוכלוסייה</th><th>השתתפות, %</th><th>משתמשים ליחידה</th><th>מגרש ליחידה, דונם</th><th>בנוי ליחידה, מ"ר</th><th>יחידות</th><th>מגרש, דונם</th></tr></thead>
          <tbody>
            {prog.rows.map((row, i) => {
              const rr = r?.rows.find((x) => x.id === row.id);
              return (
                <tr key={row.id}>
                  <td className="num">{i + 1}</td>
                  <td style={{ minWidth: 150 }}><input className="input sm text" value={row.name} onChange={(e) => setRow(row.id, { name: e.target.value })} aria-label="שם השירות" /></td>
                  <td>{cell(row, "cohortPct", "קבוצת גיל")}</td>
                  <td>{cell(row, "participation", "השתתפות")}</td>
                  <td>{cell(row, "perUnit", "משתמשים ליחידה")}</td>
                  <td>{cell(row, "plotPerUnit", "מגרש ליחידה")}</td>
                  <td>{cell(row, "builtPerUnit", "בנוי ליחידה")}</td>
                  <td className="num"><b>{rr?.ok ? rr.units : "—"}</b></td>
                  <td className="num">{rr?.ok ? fmt(rr.plot, 2) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row">
        <button type="button" className="btn sm" onClick={() => set({ rows: [...prog.rows, { id: uid(), name: "שירות נוסף", cohortPct: "", participation: "", perUnit: "", plotPerUnit: "", builtPerUnit: "" }] })}><Icon name="plus" size={14} />הוספת שירות</button>
        <button type="button" className="btn sm ghost" onClick={() => set(defaultProgram())}><Icon name="reset" size={14} />איפוס הטבלה</button>
      </div>
      {r && r.population > 0 && (
        <>
          <div className="grid g4">
            <Metric hero v={Math.round(r.population)} k="אוכלוסייה צפויה" n={`${p.units} יח״ד × ${prog.household}`} />
            <Metric v={fmt(r.totalPlot, 2)} u="דונם" k="קרקע למבני ציבור" />
            <Metric v={fmt(r.totalBuilt)} u='מ"ר' k="שטח בנוי לשירותים" />
            <Metric v={r.spa !== null ? fmt(r.spa / 1000, 2) : "—"} u="דונם" k='שצ"פ נדרש' />
          </div>
          {r.rows.filter((x) => x.ok && x.plot > 0).length > 0 && (
            <StackBar label="קרקע לפי שירות" unit="דונם" segments={r.rows.filter((x) => x.ok && x.plot > 0).map((x, i) => ({ label: x.name, value: x.plot, shade: ([3, 1, 2, 4, 0] as const)[i % 5] }))} />
          )}
          {r.rows.some((x) => x.ok) && (
            <Waffle label="יחידות לפי שירות" groups={r.rows.filter((x) => x.ok).map((x, i) => ({ label: x.name, count: x.units, kind: (["solid", "mid", "ring", "dot", "light"] as const)[i % 5] }))} />
          )}
          <Steps steps={r.steps} limits="הכלי מחשב לפי הנורמות שהוזנו. סדרי גודל, מדרג (שכונתי, רובעי, עירוני) ושילוב שירותים במבנה משותף נקבעים מול אגף הפרוגרמות בעירייה." />
        </>
      )}
      <SourceLinks links={[
        ["מדריך להקצאת שטחים לצורכי ציבור, מנהל התכנון, 2016", "https://www.gov.il/BlobFolder/generalpage/guide_allocation_land_public_needs/he/Guide_allocation_land_public_purposes.pdf"],
        ["הנחיות לעריכת מסמך פרוגרמה לצורכי ציבור, עיריית אשדוד, דצמבר 2025", "https://www.ashdod.muni.il/media/16516695/הנחיות-לעריכת-מסמך-פרוגרמה-לצורכי-ציבור-דצמבר-2025-מונגש-pdfua.pdf"],
        ["עדכון פרק בתי ספר במגרשים קומפקטיים, 2018", "https://www.gov.il/BlobFolder/guide/compact_schools/he/education_compact_schools_.pdf"],
      ]} />
    </div>
  );
}

/* ---------------- מטלות יזם: היטלים ואגרות ---------------- */
export function LeviesTool() {
  const p = useProject();
  const levies = p.levies?.length ? p.levies : defaultLevies();
  const r = calcLevies(p.plot, p.gfa, p.units, levies);
  const setRow = (id: string, patch: Partial<LevyRow>) => updateProject({ levies: levies.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const inp = (row: LevyRow, key: keyof LevyRow, label: string, type = "number") => (
    <input className={`input sm ${type === "text" ? "text" : ""}`} type={type} min={0} step="any" value={row[key]} onChange={(e) => setRow(row.id, { [key]: e.target.value })} aria-label={`${row.name}: ${label}`} />
  );
  return (
    <div className="stack" data-tool="levies">
      <Stamp kind="warn" seal="תעריפים" title="התעריפים ריקים עד שיוזנו מהמקור">
        התעריפים נקבעים בחוקי העזר של אשדוד ובכללי תאגידי המים, ומתעדכנים במדד. הסכום המחייב נמסר עם טיוטת ההיתר. ליד כל תעריף רושמים את המקור ואת התאריך.
      </Stamp>
      <div className="grid g3">
        <NumField label='שטח מגרש (מ"ר)' value={p.plot} onChange={(plot) => updateProject({ plot })} linked testId="plot" />
        <NumField label='שטח בנייה (מ"ר)' value={p.gfa} onChange={(gfa) => updateProject({ gfa })} linked testId="gfa" />
        <NumField label="יחידות דיור" value={p.units} onChange={(units) => updateProject({ units })} linked testId="units" />
      </div>
      <div className="table-wrap">
        <table className="ktable">
          <thead><tr><th>#</th><th>היטל או אגרה</th><th>₪ למ"ר קרקע</th><th>₪ למ"ר בנייה</th><th>₪ ליח"ד</th><th>מקור ותאריך</th><th>סכום</th></tr></thead>
          <tbody>
            {levies.map((row, i) => {
              const rr = r.rows.find((x) => x.id === row.id)!;
              return (
                <tr key={row.id}>
                  <td className="num">{i + 1}</td>
                  <td style={{ minWidth: 160 }}><b>{row.name}</b><div className="muted" style={{ fontSize: 12 }}>{row.basis}</div></td>
                  <td style={{ minWidth: 90 }}>{inp(row, "rateLand", "תעריף לקרקע")}</td>
                  <td style={{ minWidth: 90 }}>{inp(row, "rateBuilt", "תעריף לבנייה")}</td>
                  <td style={{ minWidth: 90 }}>{inp(row, "rateUnit", "תעריף ליח״ד")}</td>
                  <td style={{ minWidth: 150 }}>{inp(row, "source", "מקור", "text")}{inp(row, "date", "תאריך", "text")}</td>
                  <td className="num">{rr.total > 0 ? `₪${fmt(rr.total)}` : <Light status="idle">חסר תעריף</Light>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {r.total > 0 && (
        <>
          <div className="grid g3">
            <Metric hero v={`₪${fmt(r.total)}`} k="סך ההיטלים והאגרות" n={`${r.filled} מתוך ${levies.length} עם תעריף`} />
            <Metric v={`₪${fmt(r.perUnit)}`} k="ליחידת דיור" />
            <Metric v={`₪${fmt(r.perSqm)}`} k='למ"ר בנייה' />
          </div>
          <StackBar label="חלוקת העלויות" unit="₪" segments={r.rows.filter((x) => x.total > 0).map((x, i) => ({ label: x.name, value: x.total, shade: ([4, 3, 1, 2, 0] as const)[i % 5] }))} />
          <Steps steps={r.steps} limits="אומדן לתכנון תקציבי. לא כולל מע״מ, הצמדה, פטורים והנחות. הסכום המחייב נקבע על ידי מחלקת האגרות ותאגיד יובלים." />
        </>
      )}
      <ul className="notes">
        <li>על פי האוגדן (2022), העתקת מערכות עירוניות היא על חשבון היזם.</li>
        <li>התשלום מתבצע לאחר הפקת טיוטת ההיתר; האסמכתא נשלחת למחלקת האגרות.</li>
      </ul>
    </div>
  );
}

/* ---------------- בדיקת ממ"ד ---------------- */
export function MamadTool() {
  const p = useProject();
  const k = useK();
  const m = p.mamad ?? { l: "", w: "", h: "", wall: "", window: false };
  const set = (patch: Partial<typeof m>) => updateProject({ mamad: { ...m, ...patch } });
  const r = calcMamad(m, k);
  return (
    <div className="stack" data-tool="mamad">
      <div className="grid g4">
        <NumField label="אורך פנימי נטו (מ')" value={m.l} onChange={(l) => set({ l })} testId="mamad-l" />
        <NumField label="רוחב פנימי נטו (מ')" value={m.w} onChange={(w) => set({ w })} testId="mamad-w" />
        <NumField label="גובה פנימי (מ')" value={m.h} onChange={(h) => set({ h })} testId="mamad-h" />
        <NumField label='עובי קיר חוץ (ס"מ)' value={m.wall} onChange={(wall) => set({ wall })} testId="mamad-wall" />
      </div>
      <label className="check" style={{ gridTemplateColumns: "24px minmax(0,1fr)" }}>
        <input type="checkbox" checked={m.window} onChange={(e) => set({ window: e.target.checked })} />
        <span className="box"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5 5.5 10.5 11.5 3.5" fill="none" stroke="#fff" strokeWidth="2" /></svg></span>
        <span className="t">בקיר החוץ יש חלון הדף נגרר</span>
      </label>
      {r && (
        <div className="split">
          <div className="stack">
            <div className="grid g2">
              <Metric hero v={fmt(r.area, 2)} u='מ"ר' k="שטח נטו" n={`נדרש ${r.minArea}`} />
              <Metric v={fmt(r.volume, 2)} u='מ"ק' k="נפח" n={`נדרש ${r.minVolume}`} />
            </div>
            {r.checks.map((c) => <Stamp key={c.label} kind={c.status === "ok" ? "ok" : c.status === "bad" ? "no" : "warn"} seal={c.status === "ok" ? "עומד" : c.status === "bad" ? "חסר" : "חסר נתון"} title={c.label}>{c.detail}</Stamp>)}
            <Steps steps={r.steps} limits="בדיקה ראשונית מול הקבועים. הממ״ד מאושר על ידי פיקוד העורף לפי המפרט העדכני; הערכים מסומנים לאימות." />
          </div>
          <MamadDrawing l={r.l} w={r.w} h={r.h} wall={r.wall} window={m.window} ok={r.checks.every((c) => c.status === "ok")} />
        </div>
      )}
      {!r && <p className="muted" style={{ fontSize: 14 }}>הזינו מידות פנימיות כדי לבדוק שטח, נפח ועובי קירות.</p>}
    </div>
  );
}

function MamadDrawing({ l, w, h, wall, window: win, ok }: { l: number; w: number; h: number; wall: number; window: boolean; ok: boolean }) {
  const [view, setView] = useState<"plan" | "section">("plan");
  const S = 60; // פיקסלים למטר
  const t = (wall / 100) * S;
  const W = l * S, D = w * S, H = h * S;
  return (
    <figure className="viewer" style={{ minHeight: 0 }}>
      <header className="viewer-bar">
        <b className="viewer-title">ממ"ד בקנה מידה, 1 מ' = {S} יח'</b>
        <div className="seg">{(["plan", "section"] as const).map((v) => <button key={v} type="button" className="btn sm" aria-pressed={view === v} onClick={() => setView(v)}>{v === "plan" ? "תכנית" : "חתך"}</button>)}</div>
      </header>
      <div style={{ padding: 16 }}>
        {view === "plan" ? (
          <svg viewBox={`-30 -30 ${W + 2 * t + 60} ${D + 2 * t + 60}`} className="drawing" style={{ maxHeight: 340 }}>
            <rect x="0" y="0" width={W + 2 * t} height={D + 2 * t} className="wall-fill" />
            <rect x={t} y={t} width={W} height={D} className={`room ${ok ? "" : ""}`} style={{ fill: ok ? "color-mix(in srgb, var(--ok) 12%, var(--sheet))" : "color-mix(in srgb, var(--bad) 12%, var(--sheet))" }} />
            {win && <rect x={t + W * 0.35} y={-2} width={Math.min(60, W * 0.3)} height={t + 4} className="window" />}
            <rect x={t + W - 50} y={t + D - 2} width="46" height={t + 4} className="box" />
            <g className="dim"><line x1={t} y1={-14} x2={t + W} y2={-14} /><text x={t + W / 2} y={-18} textAnchor="middle">{l.toFixed(2)} מ'</text></g>
            <g className="dim"><line x1={W + 2 * t + 14} y1={t} x2={W + 2 * t + 14} y2={t + D} /><text x={W + 2 * t + 18} y={t + D / 2} textAnchor="start">{w.toFixed(2)} מ'</text></g>
            <text x={t + W / 2} y={t + D / 2} textAnchor="middle" className="dt" style={{ fontSize: 14 }}>{(l * w).toFixed(2)} מ"ר נטו</text>
            <text x={t / 2} y={t + D / 2} textAnchor="middle" className="dt" style={{ fontSize: 9, fill: "#fff" }} transform={`rotate(-90 ${t / 2} ${t + D / 2})`}>{wall} ס"מ</text>
          </svg>
        ) : (
          <svg viewBox={`-30 -30 ${W + 2 * t + 60} ${H + 2 * t + 60}`} className="drawing" style={{ maxHeight: 340 }}>
            <rect x="0" y="0" width={W + 2 * t} height={H + 2 * t} className="wall-fill" />
            <rect x={t} y={t} width={W} height={H} className="room" />
            <g className="dim"><line x1={-14} y1={t} x2={-14} y2={t + H} /><text x={-18} y={t + H / 2} textAnchor="end">{h.toFixed(2)} מ'</text></g>
            <text x={t + W / 2} y={t + H / 2} textAnchor="middle" className="dt" style={{ fontSize: 14 }}>{(l * w * h).toFixed(1)} מ"ק</text>
          </svg>
        )}
      </div>
      <figcaption className="viewer-cap">המידות מהשדות, בקנה מידה. ירוק: עומד בשטח ובנפח. אדום: לא עומד.</figcaption>
    </figure>
  );
}

/* ---------------- בדיקת גישת כבאות ---------------- */
export function FireAccessTool() {
  const p = useProject();
  const k = useK();
  const f = p.fire ?? { height: "", road: "", stagingL: "", stagingW: "", toFacade: "", hydrant: "" };
  const set = (patch: Partial<typeof f>) => updateProject({ fire: { ...f, ...patch } });
  const r = calcFireAccess(f, k);
  const st = (s: Status) => (s === "ok" ? "ok" : s === "bad" ? "no" : "warn") as "ok" | "no" | "warn";
  return (
    <div className="stack" data-tool="fireAccess">
      <div className="grid g3">
        <NumField label="גובה הבניין (מ')" value={f.height} onChange={(height) => set({ height })} hint="מפלס הכניסה עד רצפת הקומה העליונה המאוכלסת" testId="fire-height" />
        <NumField label="רוחב דרך הגישה נטו (מ')" value={f.road} onChange={(road) => set({ road })} testId="fire-road" />
        <NumField label="מרחק ברז כיבוי מהכניסה (מ')" value={f.hydrant} onChange={(hydrant) => set({ hydrant })} testId="fire-hydrant" />
        <NumField label="אורך רחבת היערכות (מ')" value={f.stagingL} onChange={(stagingL) => set({ stagingL })} />
        <NumField label="רוחב רחבת היערכות (מ')" value={f.stagingW} onChange={(stagingW) => set({ stagingW })} />
        <NumField label="מרחק הרחבה מהחזית (מ')" value={f.toFacade} onChange={(toFacade) => set({ toFacade })} />
      </div>
      {r.category && <Stamp kind={r.category.level === 0 ? "ok" : "warn"} seal="סיווג" title={r.category.label}>{r.category.detail}</Stamp>}
      <div className="split">
        <div className="stack" style={{ gap: 8 }}>
          {r.checks.map((c) => <Stamp key={c.label} kind={st(c.status)} seal={c.status === "ok" ? "עומד" : c.status === "bad" ? "לא עומד" : c.status === "warn" ? "בהקלה" : "חסר נתון"} title={c.label}>{c.detail}</Stamp>)}
          <Steps steps={r.steps} limits="הערכים מסומנים לאימות מול תקנות התכנון והבנייה (תוספת שנייה, בטיחות אש) והוראות נציב הכבאות. האישור הסופי ניתן על ידי רשות הכבאות." />
        </div>
        <FireDrawing r={r} />
      </div>
    </div>
  );
}

function FireDrawing({ r }: { r: ReturnType<typeof calcFireAccess> }) {
  const roadW = Math.max(2, Math.min(8, r.road || 4)) * 10;
  const sl = (r.stagingL || 12) * 10, sw = (r.stagingW || 6) * 10, gap = (r.toFacade || 6) * 10;
  const color = (s: Status) => (s === "ok" ? "var(--ok)" : s === "bad" ? "var(--bad)" : s === "warn" ? "var(--warn)" : "var(--gray-mid)");
  const c = Object.fromEntries(r.checks.map((x) => [x.id, x.status])) as Record<string, Status>;
  return (
    <figure className="viewer" style={{ minHeight: 0 }}>
      <header className="viewer-bar"><b className="viewer-title">גישה לרכב כיבוי, 1 מ' = 10 יח'</b></header>
      <div style={{ padding: 12 }}>
        <svg viewBox="0 0 400 300" className="drawing">
          <rect x="0" y={300 - roadW - 10} width="400" height={roadW} style={{ fill: "color-mix(in srgb, " + color(c.road) + " 25%, var(--gray-light))" }} />
          <text x="390" y={300 - roadW / 2 - 6} textAnchor="end" className="dt">דרך גישה {r.road || "?"} מ'</text>
          <rect x="120" y="30" width="200" height="110" className="wall-fill" />
          <text x="220" y="90" textAnchor="middle" className="dt" style={{ fill: "#fff" }}>בניין {r.height || "?"} מ'</text>
          <rect x="150" y="137" width="40" height="6" className="window" />
          <rect x={170 - sl / 2 + 60} y={140 + gap} width={Math.min(sl, 260)} height={Math.min(sw, 90)} style={{ fill: "color-mix(in srgb, " + color(c.staging) + " 30%, var(--sheet))", stroke: color(c.staging), strokeWidth: 2, strokeDasharray: "6 3" }} />
          <text x={170 + 60} y={140 + gap + Math.min(sw, 90) / 2 + 4} textAnchor="middle" className="dt">רחבה {r.stagingL || "?"}×{r.stagingW || "?"}</text>
          <line x1="110" y1="140" x2="110" y2={140 + gap} style={{ stroke: color(c.facade), strokeWidth: 2 }} />
          <text x="104" y={140 + gap / 2} textAnchor="end" className="dt">{r.toFacade || "?"} מ'</text>
          <circle cx="60" cy="150" r="7" style={{ fill: color(c.hydrant), stroke: "var(--ink)" }} />
          <line x1="67" y1="150" x2="120" y2="100" style={{ stroke: color(c.hydrant), strokeDasharray: "4 3" }} />
          <text x="60" y="172" textAnchor="middle" className="dt">ברז {r.hydrant || "?"} מ'</text>
        </svg>
      </div>
      <figcaption className="viewer-cap">סכמה בקנה מידה משוער. הצבעים לפי תוצאת הבדיקה.</figcaption>
    </figure>
  );
}
