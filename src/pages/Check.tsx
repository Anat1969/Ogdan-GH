import { motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useRef } from "react";
import { chapters } from "../data/permitData";
import { parsePlanFile, planTemplateCsv, runPlanCheck, type CheckStatus } from "../logic/planCheck";
import { href } from "../state/router";
import { exampleProject, projectStore, updateProject, useProject } from "../state/store";
import { Icon } from "../components/icons";
import { PageHead, useToast } from "../components/ui";
import { Light, Ring } from "../components/viz";

const label: Record<CheckStatus, string> = { ok: "עומד", warn: "חסר עד 10%", bad: "חסר", idle: "לא נבדק" };
const fmt = (n: number | null, d = 2) => (n === null ? "—" : n.toLocaleString("he-IL", { maximumFractionDigits: d }));

function download(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** פס השוואה: דרישה מול מוצע */
function Compare({ required, proposed, status }: { required: number | null; proposed: number | null; status: CheckStatus }) {
  const reduce = useReducedMotion();
  if (required === null || proposed === null) return <span className="muted" style={{ fontSize: 12 }}>—</span>;
  const max = Math.max(required, proposed, 0.0001);
  return (
    <div className={`cmp st-${status}`} aria-hidden="true">
      <motion.i className="cmp-p" style={{ transformOrigin: "right" }} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1, width: `${(proposed / max) * 100}%` }} transition={{ duration: 0.6 }} />
      <span className="cmp-r" style={{ insetInlineStart: `${(required / max) * 100}%` }} />
    </div>
  );
}

export default function Check() {
  const p = useProject();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = "בדיקת תכנית · אוגדן הנחיות להיתר"; }, []);
  const checks = runPlanCheck(p);
  const tested = checks.filter((c) => c.status !== "idle");
  const ok = tested.filter((c) => c.status === "ok").length;
  const counts = { ok, warn: tested.filter((c) => c.status === "warn").length, bad: tested.filter((c) => c.status === "bad").length, idle: checks.length - tested.length };
  const groups = [...new Set(checks.map((c) => c.group))];
  const noBase = !p.plot && !p.units && !p.parking.some((e) => e.units);
  let row = 0;

  const setProp = (id: string, v: string) => updateProject({ proposed: { ...(p.proposed ?? {}), [id]: v } });

  return (
    <div>
      <PageHead
        crumbs={[{ label: "בית", route: { name: "home" } }, { label: "בדיקת תכנית" }]}
        label="חיבור האוגדן לתכנית הבינוי"
        title="בדיקת תכנית מול האוגדן"
        icon="compare"
        lead="מזינים את הערכים שמופיעים בתכנית הבינוי (או טוענים קובץ טבלת שטחים), והמערכת משווה כל ערך לדרישה שחושבה במחשבונים. ירוק עומד, כתום חסר עד 10%, אדום חסר."
      >
        <div className="row" style={{ marginTop: 8 }}>
          <input ref={file} type="file" accept=".csv,.txt,.json,.tsv" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const vals = parsePlanFile(await f.text());
              const n = Object.keys(vals).length;
              if (!n) { toast("לא נמצאו בקובץ ערכים מוכרים. השתמשו בתבנית להורדה"); return; }
              updateProject({ proposed: { ...(p.proposed ?? {}), ...vals } });
              toast(`נטענו ${n} ערכים מהתכנית`);
            } catch { toast("הקובץ לא נקרא. נדרש CSV של מזהה,ערך או JSON"); }
            e.target.value = "";
          }} />
          <button type="button" className="btn primary" onClick={() => file.current?.click()} data-testid="plan-upload"><Icon name="upload" size={16} />טעינת קובץ מהתכנית</button>
          <button type="button" className="btn" onClick={() => download("ogdan-plan-template.csv", "﻿" + planTemplateCsv(), "text/csv;charset=utf-8")}><Icon name="download" size={16} />תבנית CSV</button>
          <button type="button" className="btn" onClick={() => download("ogdan-project.json", JSON.stringify(projectStore.get(), null, 2), "application/json")}><Icon name="download" size={16} />ייצוא תיק הבקשה</button>
          {noBase && <button type="button" className="btn" onClick={() => projectStore.set(exampleProject())} data-testid="check-example">טעינת דוגמה</button>}
        </div>
      </PageHead>

      {noBase && (
        <p className="frame-explain" style={{ marginBottom: 16 }}>
          כדי לחשב דרישות צריך קודם נתוני בסיס (שטח מגרש, יח"ד, שימושים) ב<a href={href({ name: "project" })}>תיק הבקשה</a>. בלי הם השורות יישארו "לא נבדק".
        </p>
      )}

      <div className="split check-split">
        <section className="frame">
          <header className="frame-head">
            <span className="frame-num mono">1</span>
            <div><h3>ערכים מהתכנית מול הדרישה</h3><p className="frame-explain">כל שורה: הערך שבתכנית, הדרישה מהמחשבון, הפער וההסבר. הפס מראה את המוצע, והקו האנכי את הדרישה.</p></div>
          </header>
          <div className="table-wrap">
            <table className="check-table">
              <thead><tr><th>#</th><th>בדיקה</th><th>בתכנית</th><th>נדרש</th><th>השוואה</th><th>מצב</th></tr></thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g}>
                    <tr className="group-row"><td colSpan={6}>{g}</td></tr>
                    {checks.filter((c) => c.group === g).map((c) => {
                      row++;
                      const ch = chapters.find((x) => x.id === c.chapter)!;
                      return (
                        <tr key={c.id} data-testid={`check-row-${c.id}`} data-status={c.status}>
                          <td className="num">{row}</td>
                          <td>
                            <a href={href({ name: "chapter", id: c.chapter })} style={{ textDecoration: "none" }}>{c.label}</a>
                            <div className="muted" style={{ fontSize: 12 }}>{c.basis} · {ch.short}</div>
                          </td>
                          <td style={{ minWidth: 96 }}>
                            <input className="input sm" type="number" inputMode="decimal" min={0} value={p.proposed?.[c.id] ?? ""} onChange={(e) => setProp(c.id, e.target.value)} aria-label={`${c.label}, ערך בתכנית`} data-testid={`prop-${c.id}`} />
                          </td>
                          <td className="num">{fmt(c.required)} <span className="muted" style={{ fontSize: 11 }}>{c.unit}</span></td>
                          <td style={{ minWidth: 110 }}><Compare required={c.required} proposed={c.proposed} status={c.status} /></td>
                          <td><Light status={c.status}>{label[c.status]}{c.gap !== null && c.gap < 0 ? ` (${fmt(c.gap)})` : ""}</Light></td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="frame">
          <header className="frame-head">
            <span className="frame-num mono">2</span>
            <div><h3>תמונת מצב</h3><p className="frame-explain">כמה מהבדיקות עומדות בדרישה, ומה עוד חסר. מתעדכן בכל הקלדה.</p></div>
          </header>
          <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
            <Ring value={tested.length ? ok / tested.length : 0} label="עומד בדרישות" sub={`${ok} מתוך ${tested.length} שנבדקו`} size={150} status={!tested.length ? "idle" : counts.bad ? "bad" : counts.warn ? "warn" : "ok"} />
            <div className="status-bar" aria-label="פילוח מצבים">
              {(["ok", "warn", "bad", "idle"] as const).map((s) => counts[s] > 0 && (
                <motion.i key={s} className={`st-${s}`} initial={{ flexGrow: 0 }} animate={{ flexGrow: counts[s] }} transition={{ duration: 0.6 }} title={`${label[s]}: ${counts[s]}`} />
              ))}
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 16 }}>
              {(["ok", "warn", "bad", "idle"] as const).map((s) => <Light key={s} status={s}>{label[s]} <b className="mono">{counts[s]}</b></Light>)}
            </div>
            {tested.filter((c) => c.status === "bad" || c.status === "warn").length > 0 && (
              <ol className="numlist" style={{ width: "100%" }}>
                {tested.filter((c) => c.status === "bad" || c.status === "warn").map((c, i) => (
                  <li key={c.id}><span className="num-badge mono">{i + 1}</span><span><Light status={c.status}>{c.label}</Light><span className="muted" style={{ display: "block", fontSize: 12 }}>בתכנית {fmt(c.proposed)}, נדרש {fmt(c.required)} {c.unit}</span></span></li>
                ))}
              </ol>
            )}
            <p className="muted" style={{ fontSize: 12 }}>
              קובץ: CSV עם שורות "מזהה,ערך" (אפשר גם את שם הבדיקה בעברית), או JSON. קריאה ישירה של DWG או PDF עדיין לא נתמכת: מייצאים את טבלת השטחים מהשרטוט ל-CSV.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
