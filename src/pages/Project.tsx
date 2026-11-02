import { useEffect } from "react";
import { allChecklistKeys, checklistBlocks, chapters, itemKey, permitTracks, source } from "../data/permitData";
import { calcDrainage, calcFee, calcGreen, calcParking, calcWaste, calcWater } from "../logic/calculators";
import { href } from "../state/router";
import { exampleProject, projectStore, updateProject, useChecks, useProject } from "../state/store";
import { Metric, NumField, PageHead, Progress, Seg, Sheet, Stamp } from "../components/ui";
import { Icon } from "../components/icons";
import { Ring } from "../components/viz";

const fmt = (n: number, d = 0) => n.toLocaleString("he-IL", { maximumFractionDigits: d });

export default function Project() {
  const p = useProject();
  const checks = useChecks();
  useEffect(() => { document.title = "תיק הבקשה · אוגדן הנחיות להיתר"; }, []);

  const parking = calcParking(p.parking, p.standard);
  const drainage = calcDrainage(p.plot, p.footprint, p.green);
  const green = calcGreen(p.plot, p.footprint, p.units);
  const waste = calcWaste(p.units, p.floors);
  const water = calcWater(p.plot, p.footprint, p.irrigation, p.water);
  const fee = calcFee(p.gfa);
  const track = permitTracks.find((t) => t.id === p.track)!;

  const per = chapters.map((c) => {
    const keys = allChecklistKeys(c);
    const done = keys.filter((k) => checks[k]).length;
    const open = checklistBlocks(c).flatMap((b) => b.items.map((it, i) => ({ it, b: b.title, k: itemKey(c.id, b.id, i) }))).filter((x) => !checks[x.k]);
    return { c, keys, done, open };
  });
  const total = per.reduce((s, x) => s + x.keys.length, 0);
  const done = per.reduce((s, x) => s + x.done, 0);

  const flags: { kind: "ok" | "no" | "warn"; seal: string; title: string; body: string }[] = [];
  if (drainage) flags.push(drainage.meetsInfiltration
    ? { kind: "ok", seal: "עומד", title: "שטח חלחול 15%", body: `${fmt(drainage.green)} מתוך ${fmt(drainage.minInfiltration)} מ"ר נדרשים` }
    : { kind: "no", seal: "חסר", title: "שטח חלחול מתחת ל-15%", body: `חסרים ${fmt(drainage.minInfiltration - drainage.green)} מ"ר. נדרש נספח הידרולוגיה (פרק סביבה).` });
  if (green && !green.meets) flags.push({ kind: "no", seal: "חסר", title: "שטח פתוח קטן מהשטח הירוק הנדרש", body: `פתוח ${fmt(green.open)} מ"ר, נדרש ${fmt(green.minGreen)} מ"ר.` });
  if (waste?.dual) flags.push({ kind: "warn", seal: "כפולה", title: "מערכת אשפה כפולה", body: `${waste.dualReason}: 2 צנרות שוט ו-2 דחסניות.` });
  const floors = parseFloat(p.floors) || 0;
  if (floors >= 9) flags.push({ kind: "warn", seal: "בדיקה", title: "גובה המבנה: בדיקת חובת גנרטור", body: "בניין מעל 29 מ' מחויב בגנרטור אחד לפחות (פרק חשמל). יש לבדוק את הגובה בפועל." });
  if (drainage?.overAreas) flags.push({ kind: "no", seal: "נתונים", title: "תכסית ושטח ירוק גדולים מהמגרש", body: "יש לתקן את נתוני השטחים." });

  const empty = !p.plot && !p.units && !p.gfa && !parking.hasInput;

  return (
    <div>
      <PageHead crumbs={[{ label: "בית", route: { name: "home" } }, { label: "תיק הבקשה" }]} label="נשמר אוטומטית בדפדפן" title="תיק הבקשה" icon="folder" lead="נתוני הפרויקט מוזנים כאן פעם אחת ומזינים את כל המחשבונים. הדוח למטה מסכם כמויות, חוסרים ודרישות פתוחות, ומוכן להדפסה.">
        <div className="row no-print" style={{ marginTop: 8 }}>
          <button type="button" className="btn primary" onClick={() => window.print()} data-testid="print"><Icon name="print" size={16} />הדפסת הדוח</button>
          {empty && <button type="button" className="btn" onClick={() => projectStore.set(exampleProject())} data-testid="load-example">טעינת פרויקט לדוגמה</button>}
        </div>
      </PageHead>

      <div className="stack">
        <Sheet title="פרטי הפרויקט" label="שדות משותפים לכל המחשבונים" className="no-print">
          <div className="stack">
            <div className="grid g2">
              <label className="field"><span>שם הפרויקט</span><input className="input text" value={p.name} onChange={(e) => updateProject({ name: e.target.value })} placeholder="לדוגמה: מגדל מגורים, מגרש 12" data-testid="project-name" /></label>
              <label className="field"><span>כתובת, גוש וחלקה</span><input className="input text" value={p.address} onChange={(e) => updateProject({ address: e.target.value })} placeholder="רחוב, רובע, גוש/חלקה" /></label>
            </div>
            <div className="grid g3">
              <NumField label='שטח מגרש (מ"ר)' value={p.plot} onChange={(plot) => updateProject({ plot })} linked testId="plot" />
              <NumField label='תכסית מבנה (מ"ר)' value={p.footprint} onChange={(footprint) => updateProject({ footprint })} linked testId="footprint" />
              <NumField label='שטח ירוק מחלחל (מ"ר)' value={p.green} onChange={(green) => updateProject({ green })} linked testId="green" />
              <NumField label="יחידות דיור" value={p.units} onChange={(units) => updateProject({ units })} linked testId="units" />
              <NumField label="קומות" value={p.floors} onChange={(floors) => updateProject({ floors })} linked testId="floors" />
              <NumField label='שטח בנייה מוצע (מ"ר)' value={p.gfa} onChange={(gfa) => updateProject({ gfa })} linked testId="gfa" />
            </div>
            <div className="spread">
              <span className="muted" style={{ fontSize: 14 }}>מסלול הגשה</span>
              <Seg label="מסלול הגשה" value={p.track} onChange={(track) => updateProject({ track })} options={permitTracks.map((t) => ({ value: t.id as typeof p.track, label: `${t.days} ימים` }))} />
            </div>
            <p className="muted" style={{ fontSize: 13 }}>שימושים לחניה ולמים מוגדרים בתוך המחשבונים עצמם: <a href={href({ name: "tool", id: "parking" })}>חניה</a>, <a href={href({ name: "tool", id: "water" })}>מים</a>.</p>
          </div>
        </Sheet>

        {/* הדוח */}
        <section className="sheet report" aria-label="דוח תיק הבקשה" data-testid="report">
          <header className="spread" style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 12, marginBottom: 20, alignItems: "flex-end" }}>
            <div>
              <span className="label">דוח תיק בקשה להיתר</span>
              <h2 style={{ fontSize: 30, fontWeight: 300 }}>{p.name || "פרויקט ללא שם"}</h2>
              {p.address && <p className="muted">{p.address}</p>}
            </div>
            <div className="mono" style={{ fontSize: 12, textAlign: "end" }} >
              <div>{new Date().toLocaleDateString("he-IL")}</div>
              <div className="muted">לפי {source.title}, נוסח {source.version}</div>
            </div>
          </header>

          <div className="grid g4" style={{ marginBottom: 20 }}>
            <Metric hero v={`${done}/${total}`} k="דרישות שסומנו" n={`${Math.round((done / total) * 100)}% מהתיק`} />
            <Metric v={track.days} u="ימים" k="זמן טיפול צפוי" n={track.name} />
            <Metric v={parking.hasInput ? parking.grand : "—"} k="חניות כולל תפעולי" n={parking.hasInput ? `${parking.disabled} נכים, ${parking.ev} טעינה` : "לא הוזן"} tone="clay" />
            <Metric v={fee.area ? `₪${fmt(fee.fee)}` : "—"} k="אגרה משוערת" n={fee.area ? `פיקדון ₪${fmt(fee.deposit)}` : "לא הוזן שטח"} tone="ink" />
          </div>

          {flags.length > 0 && (
            <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 500 }}>בדיקות אוטומטיות</h3>
              {flags.map((f) => <Stamp key={f.title} kind={f.kind} seal={f.seal} title={f.title}>{f.body}</Stamp>)}
            </div>
          )}

          <div className="viz-grid" style={{ marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>מוכנות לפי פרק</h3>
              <div className="rings">
                {per.filter((x) => x.keys.length).map(({ c, keys, done: d }) => (
                  <a key={c.id} href={href({ name: "chapter", id: c.id })} style={{ textDecoration: "none" }}>
                    <Ring value={d / keys.length} label={c.short} sub={`${d}/${keys.length}`} size={84} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>זמני טיפול לפי מסלול</h3>
              <div className="gantt" aria-label="ציר זמן מסלולי הגשה">
                {permitTracks.map((t) => (
                  <div key={t.id} className={`gantt-row ${t.id === p.track ? "mine" : ""}`}>
                    <span>{t.name}</span>
                    <span className="gantt-bar"><i style={{ width: `${(t.days / 90) * 100}%` }} /></span>
                    <span className="mono">{t.days} ימים</span>
                  </div>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>המסלול שנבחר מסומן בשחור. ניתן להחליף בפרטי הפרויקט.</p>
            </div>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>כמויות מהמחשבונים</h3>
          <div className="table-wrap" style={{ marginBottom: 24 }}>
            <table>
              <thead><tr><th>תחום</th><th>תוצאה</th><th>פירוט</th></tr></thead>
              <tbody>
                <tr><td>חניה</td><td className="num">{parking.hasInput ? `${parking.total} חניות` : "—"}</td><td>{parking.hasInput ? `תפעולי ${parking.operational}, נכים ${parking.disabled}, טעינה ${parking.ev}` : <a href={href({ name: "tool", id: "parking" })}>להזנה</a>}</td></tr>
                <tr><td>ניקוז</td><td className="num">{drainage ? `${fmt(drainage.peakLps, 1)} ל'/ש'` : "—"}</td><td>{drainage ? `בור חלחול ${fmt(drainage.pitM3, 1)} קוב, C=${fmt(drainage.weightedC, 2)}` : "נדרש שטח מגרש"}</td></tr>
                <tr><td>שטח ירוק</td><td className="num">{green ? `${fmt(green.minGreen)} מ"ר` : "—"}</td><td>{green ? `${green.trees} עצים בוגרים, הצללה ${fmt(green.shade)} מ"ר` : "נדרש שטח מגרש"}</td></tr>
                <tr><td>אשפה</td><td className="num">{waste ? `${fmt(waste.totalM3, 2)} קוב` : "—"}</td><td>{waste ? (waste.compactors ? `דחסניות ${waste.compactors.wet}/${waste.compactors.dry} קוב` : `טמונים ${waste.tamunim!.wet}+${waste.tamunim!.dry}`) + `, ${waste.recycling} עמדות מחזור` : "נדרש מספר יח״ד"}</td></tr>
                <tr><td>מים</td><td className="num">{water ? `${fmt(water.total)} מ"ק/שנה` : "—"}</td><td>{water ? `סניטרי ${fmt(water.domestic)}, השקיה ${fmt(water.irrigationM3)}, צינור ${water.pipe}` : "נדרש שטח מגרש"}</td></tr>
                <tr><td>אגרות</td><td className="num">{fee.area ? `₪${fmt(fee.fee)}` : "—"}</td><td>{fee.area ? `פיקדון ₪${fmt(fee.deposit)}` : "נדרש שטח בנייה"}</td></tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>מוכנות לפי פרק</h3>
          <div className="stack" style={{ gap: 12 }}>
            {per.filter((x) => x.keys.length).map(({ c, keys, done: d, open }) => (
              <div key={c.id} className={`tone-${c.tone}`} style={{ borderInlineStart: "3px solid var(--tone)", paddingInlineStart: 12 }}>
                <div className="spread" style={{ marginBottom: 6 }}>
                  <a href={href({ name: "chapter", id: c.id })} style={{ fontWeight: 500, textDecoration: "none" }}>{c.title}</a>
                  <span className="mono" style={{ fontSize: 13 }}>{d}/{keys.length}</span>
                </div>
                <Progress value={d / keys.length} label={c.title} />
                {open.length > 0 && (
                  <details style={{ marginTop: 6 }}>
                    <summary className="muted" style={{ fontSize: 13, cursor: "pointer" }}>{open.length} דרישות פתוחות</summary>
                    <ul className="notes" style={{ marginTop: 6 }}>{open.map((o) => <li key={o.k} style={{ fontSize: 13 }}>{o.it} <span className="muted">· {o.b}</span></li>)}</ul>
                  </details>
                )}
              </div>
            ))}
          </div>

          <p className="muted" style={{ fontSize: 12, marginTop: 24, borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
            הדוח הוא כלי עזר לעורך הבקשה. החישובים הם אומדן לפי מקדמי האוגדן ותקנים מקובלים, ואינם מחליפים את בדיקת מחלקת הרישוי, היועצים ואיש המקצוע החותם.
          </p>
        </section>
      </div>
    </div>
  );
}
