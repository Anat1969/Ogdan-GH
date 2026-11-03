// בדיקת תוכנית בינוי לפי מספר: דוח התאמה לגורמי העירייה, שרטוטים, ובדיקה מספרית.
// מיועד לפורום היועצים לתוכניות בינוי. הנתונים: חוות הדעת והשדות של התוכנית (PLANS-GH).
import { useEffect, useMemo, useRef, useState } from "react";
import plansData from "../data/plans.json";
import { chapters } from "../data/permitData";
import { reviewPlan, verdictLabel, type PlanRecord, type Verdict } from "../logic/planReview";
import { href } from "../state/router";
import { updateProject, useK } from "../state/store";
import { Icon } from "../components/icons";
import { Progress, useToast } from "../components/ui";
import { Ring } from "../components/viz";
import { NumericCheck } from "./CheckNumeric";
import { NotesReport } from "../components/NotesReport";

const plans = (plansData as { plans: PlanRecord[] }).plans;
const vStatus: Record<Verdict, "ok" | "bad" | "warn" | "idle"> = { ok: "ok", bad: "bad", missing: "bad", review: "warn" };
const pad = (n: number) => String(n).padStart(2, "0");
const catLabel: Record<string, string> = { tashrit: "תשריט", landscape: "פיתוח ונוף", render: "הדמיה", aerial: "צילום אוויר" };

/** צופה תמונה: גלגלת לזום, גרירה להזזה */
function ImagePan({ src, alt }: { src: string; alt: string }) {
  const [z, setZ] = useState(1);
  const [p, setP] = useState({ x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  useEffect(() => { setZ(1); setP({ x: 0, y: 0 }); }, [src]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const w = (e: WheelEvent) => { e.preventDefault(); setZ((v) => Math.min(6, Math.max(0.5, v * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))); };
    el.addEventListener("wheel", w, { passive: false });
    return () => el.removeEventListener("wheel", w);
  }, []);
  return (
    <div ref={box} className="imgpan" onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: p.x, py: p.y }; }}
      onPointerMove={(e) => { const d = drag.current; if (d) setP({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }); }}
      onPointerUp={() => (drag.current = null)} onDoubleClick={() => { setZ(1); setP({ x: 0, y: 0 }); }}>
      <img src={src} alt={alt} draggable={false} style={{ transform: `translate(${p.x}px, ${p.y}px) scale(${z})` }} />
      <span className="imgpan-z mono">{Math.round(z * 100)}%</span>
    </div>
  );
}

function Report({ plan }: { plan: PlanRecord }) {
  const k = useK();
  const r = useMemo(() => reviewPlan(plan, k), [plan, k]);
  const st = r.counts.bad + r.counts.missing ? "bad" : r.counts.review ? "warn" : "ok";
  const shot = plan.images.find((i) => i.cat === "tashrit") ?? plan.images[0];
  return (
    <article className="a4 report2" data-testid="plan-report">
      <header className="r2-head">
        <div>
          <span className="label">דוח התאמה לדרישות גורמי העירייה · פורום יועצים לתוכניות בינוי</span>
          <h2>תב/{plan.num} · {plan.name}</h2>
          <p className="muted">{plan.decision && `החלטה: ${plan.decision}`}{plan.committeeDate && ` · ועדה ${new Date(plan.committeeDate).toLocaleDateString("he-IL")}`}{plan.fields.zoningDetailed && ` · תב"ע ${plan.fields.zoningDetailed}`}</p>
        </div>
        <div className="r2-score">
          <Ring value={r.score} label="רמת התאמה" sub={`${r.counts.ok} תואם · ${r.counts.review} לבדיקה · ${r.counts.missing + r.counts.bad} חסר/לא תואם`} size={88} status={st} />
        </div>
      </header>

      <section className="r2-grid">
        <div className="r2-facts">
          {[
            ["יח\"ד בתוכנית", r.facts.units ?? "לא צוין"],
            ["קומות מעל 0.00", r.facts.floors ?? "לא צוין"],
            ["חניות נדרשות לפי האוגדן", r.parkingRequired ?? "חסר יח\"ד"],
            ["שטח מחלחל", r.facts.infiltrationPct !== null ? `${r.facts.infiltrationPct}%` : "לא צוין"],
            ["רחבות כיבוי", r.facts.fireStaging ?? "לא צוין"],
            ["הקלות מבוקשות", r.facts.reliefs.length],
          ].map(([kk, v]) => <div key={kk as string}><span>{kk}</span><b className="mono">{v}</b></div>)}
        </div>
        {shot && <img className="plan-shot" src={shot.file} alt={shot.title} />}
      </section>

      <table className="r2-table">
        <thead><tr><th>#</th><th>גורם ונושא</th><th>מצב</th><th>ממצא</th><th>מה לעשות</th></tr></thead>
        <tbody>
          {r.findings.map((f, i) => {
            const ch = chapters.find((c) => c.id === f.chapter);
            return (
              <tr key={f.id} data-verdict={f.verdict}>
                <td className="num">{i + 1}</td>
                <td><b>{f.topic}</b><div className="muted">{ch ? `${pad(chapters.indexOf(ch) + 1)} ${ch.short}` : ""}</div></td>
                <td><span className={`light st-${vStatus[f.verdict]}`}><i />{verdictLabel[f.verdict]}</span></td>
                <td>{f.finding}{f.evidence && <q className="r2-q">{f.evidence}</q>}</td>
                <td>{f.action || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {r.facts.reliefs.length > 0 && (
        <section className="r2-reliefs">
          <b>הקלות שהוזכרו</b>
          <ol>{r.facts.reliefs.slice(0, 5).map((x, i) => <li key={i}>{x.slice(0, 160)}</li>)}</ol>
        </section>
      )}
      <NotesReport compact />
      <footer className="r2-foot muted">
        הבדיקה מזהה התייחסות, מספרים ואישורים בחוות הדעת ובשדות התוכנית, ומשווה למקדמי האוגדן. היא כלי עזר לפורום היועצים ואינה מחליפה את בדיקת הגורם המקצועי. מקור הנתונים: תיק תוכנית הבינוי במערכת התוכניות של העירייה. הופק {new Date().toLocaleDateString("he-IL")}.
      </footer>
    </article>
  );
}

export default function Check() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [num, setNum] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [img, setImg] = useState(0);
  useEffect(() => { document.title = "בדיקת תוכנית בינוי · אוגדן הנחיות להיתר"; }, []);
  const plan = plans.find((p) => p.num === num) ?? null;
  const open = (v: string) => {
    const n = v.replace(/\D/g, "");
    const p = plans.find((x) => x.num === n);
    if (p) { setNum(p.num); setTab(0); setImg(0); } else toast(`תוכנית תב/${n || "?"} לא נמצאה. קיימות ${plans.length} תוכניות במערכת`);
  };
  const tabs = ["דוח התאמה", "שרטוטים והדמיות", "בדיקה מספרית"];
  return (
    <div className="ws ws-check">
      <header className="ws-head">
        <span className="iconbox ws-icon" aria-hidden="true"><Icon name="compare" size={24} /></span>
        <div className="ws-title">
          <nav className="crumbs"><a href={href({ name: "home" })}>בית</a><span>/</span><span>בדיקת תוכנית בינוי</span></nav>
          <h1>בדיקת תוכנית בינוי</h1>
          <p className="muted">רושמים מספר תוכנית, והמערכת מעלה את הנתונים והשרטוטים, בודקת התאמה לדרישות כל גורם ומפיקה דוח.</p>
        </div>
        <form className="ws-meta plan-search" onSubmit={(e) => { e.preventDefault(); open(q); }}>
          <label className="field" style={{ minWidth: 220 }}>
            <span>מספר תוכנית בינוי</span>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <span className="mono muted">תב/</span>
              <input className="input" list="plan-list" value={q} onChange={(e) => setQ(e.target.value)} placeholder="1815" inputMode="numeric" data-testid="plan-num" />
              <button className="btn primary" type="submit" data-testid="plan-go">בדיקה</button>
            </div>
            <datalist id="plan-list">{plans.map((p) => <option key={p.num} value={p.num}>{p.name}</option>)}</datalist>
          </label>
        </form>
      </header>

      <nav className="ws-tabs" role="tablist">
        {tabs.map((t, i) => (
          <button key={t} type="button" role="tab" className="ws-tab" aria-selected={tab === i} aria-pressed={tab === i} onClick={() => setTab(i)} disabled={i < 2 && !plan}>
            <span className="mono ws-tab-no">{i + 1}</span><span className="ws-tab-t">{t}</span>
          </button>
        ))}
      </nav>

      <div className="ws-body ws-body-1">
        <div className="ws-main">
          {tab === 2 ? (
            <div className="ws-scroll"><NumericCheck /></div>
          ) : !plan ? (
            <div className="ws-scroll">
              <div className="plan-pick">
                <p className="muted">בחרו תוכנית מהרשימה או הקלידו מספר:</p>
                <div className="plan-grid">
                  {plans.map((p) => (
                    <button key={p.num} type="button" className="plan-card" onClick={() => { setQ(p.num); open(p.num); }} data-testid={`plan-${p.num}`}>
                      {p.images[0] ? <img src={p.images[0].file} alt="" loading="lazy" /> : <span className="plan-card-ph" />}
                      <b className="mono">תב/{p.num}</b>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 0 ? (
            <div className="ws-scroll">
              <div className="row no-print" style={{ marginBottom: 10 }}>
                <button type="button" className="btn primary" onClick={() => window.print()}><Icon name="print" size={16} />הדפסת הדוח (A4)</button>
                <button type="button" className="btn" onClick={() => {
                  const r = reviewPlan(plan);
                  updateProject({ name: `תב/${plan.num} ${plan.name}`, address: plan.fields.parcel ?? "", units: r.facts.units ? String(r.facts.units) : "", floors: r.facts.floors ? String(r.facts.floors) : "" });
                  toast("נתוני התוכנית נטענו לתיק הבקשה ולמחשבונים");
                }}>טעינה לתיק הבקשה</button>
              </div>
              <Report plan={plan} />
            </div>
          ) : (
            <div className="ws-split">
              <div className="ws-scroll">
                <section className="frame">
                  <header className="frame-head"><span className="frame-num mono">2</span><div><h3>שרטוטים והדמיות</h3><p className="frame-explain">מתוך תיק התוכנית. גלגלת לזום, גרירה להזזה, לחיצה כפולה לאיפוס.</p></div></header>
                  <ol className="numlist">
                    {plan.images.map((im, i) => (
                      <li key={im.file}>
                        <button type="button" className={`btn sm ${i === img ? "is-active" : ""}`} aria-pressed={i === img} onClick={() => setImg(i)} style={{ width: "100%", justifyContent: "flex-start", whiteSpace: "normal", textAlign: "start" }}>
                          <span className="num-badge mono">{i + 1}</span>{catLabel[im.cat] ?? im.cat}: {im.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                  {!plan.images.length && <p className="muted">אין שרטוטים בתיק התוכנית.</p>}
                  <div style={{ marginTop: 12 }}><Progress value={plan.images.length ? (img + 1) / plan.images.length : 0} label="שרטוט" /></div>
                </section>
              </div>
              <figure className="viewer">
                <header className="viewer-bar"><b className="viewer-title">{plan.images[img] ? `${catLabel[plan.images[img].cat] ?? ""}: ${plan.images[img].title}` : "אין תמונה"}</b></header>
                {plan.images[img] && <ImagePan src={plan.images[img].file} alt={plan.images[img].title} />}
                <figcaption className="viewer-cap">מקור: {plan.images[img]?.source}{plan.images[img]?.page ? `, עמוד ${plan.images[img].page}` : ""}</figcaption>
              </figure>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
