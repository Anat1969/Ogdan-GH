import { useState, type ReactNode } from "react";
import { KDEFS, type KGroup } from "../logic/constants";
import { toolDocs } from "../data/toolDocs";
import { setK, setKText, useK, useProject } from "../state/store";
import { Icon } from "./icons";
import { Light } from "./viz";

/** פאנל קבועים: כל מקדם עם ערך, יחידה, מקור, מצב אימות, עריכה ואיפוס */
export function ConstantsPanel({ group }: { group: KGroup }) {
  const p = useProject();
  const k = useK();
  const defs = KDEFS.filter((d) => d.group === group);
  const changed = defs.filter((d) => k[d.id] !== d.value).length;
  const unverified = defs.filter((d) => !d.verified).length;
  const [open, setOpen] = useState(false);
  if (!defs.length) return null;
  return (
    <details className="kpanel" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)} data-testid={`kpanel-${group}`}>
      <summary>
        <span className="ic-row"><Icon name="calc" size={16} /><b>קבועי החישוב</b> <span className="muted">({defs.length}, ערך וטקסט ניתנים לעריכה)</span></span>
        <span className="row" style={{ gap: 12 }}>
          {changed > 0 && <Light status="warn">{changed} שונו</Light>}
          {unverified > 0 && <Light status="idle">{unverified} לאימות</Light>}
        </span>
      </summary>
      {open && (
        <div className="table-wrap">
          <table className="ktable">
            <thead><tr><th>#</th><th>קבוע</th><th>ערך</th><th>יחידה</th><th>מקור</th><th></th></tr></thead>
            <tbody>
              {defs.map((d, i) => {
                const cur = p.k?.[d.id] ?? "";
                const isChanged = k[d.id] !== d.value;
                const kt = p.kText?.[d.id] ?? {};
                const txt = (field: "label" | "unit" | "source", def: string) => (e: React.ChangeEvent<HTMLInputElement>) => setKText(d.id, field, e.target.value === def ? null : e.target.value);
                return (
                  <tr key={d.id} className={isChanged ? "changed" : ""}>
                    <td className="num">{i + 1}</td>
                    <td><input className="ktxt" value={kt.label ?? d.label} onChange={txt("label", d.label)} aria-label={`שם הקבוע ${d.label}`} />{d.note && <div className="muted" style={{ fontSize: 12 }}>{d.note}</div>}</td>
                    <td style={{ minWidth: 100 }}>
                      <input className="input sm" type="number" step={d.step ?? 1} min={0} value={cur} placeholder={String(+d.value.toFixed(4))} onChange={(e) => setK(d.id, e.target.value === "" ? null : e.target.value)} aria-label={d.label} data-testid={`k-${d.id}`} />
                    </td>
                    <td><input className="ktxt sm" value={kt.unit ?? d.unit} onChange={txt("unit", d.unit)} aria-label={`יחידה ${d.label}`} /></td>
                    <td style={{ fontSize: 12 }}><Light status={d.verified ? "ok" : "idle"}>{d.verified ? "מקור" : "לאימות"}</Light><input className="ktxt muted" value={kt.source ?? d.source} onChange={txt("source", d.source)} aria-label={`מקור ${d.label}`} /></td>
                    <td>{Object.keys(kt).length > 0 && <button type="button" className="btn sm ghost" onClick={() => (["label", "unit", "source"] as const).forEach((f) => setKText(d.id, f, null))} aria-label={`החזרת הטקסט של ${d.label}`}>טקסט מקורי</button>}{isChanged && <button type="button" className="btn sm ghost" onClick={() => setK(d.id, null)} aria-label={`החזרת ${d.label} לברירת המחדל`}><Icon name="reset" size={14} />{+d.value.toFixed(4)}</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

/** איך זה מחושב: היגיון ויחידות */
export function ToolDocView({ id }: { id: string }) {
  const doc = toolDocs[id];
  if (!doc) return null;
  return (
    <details className="kpanel doc" data-testid={`doc-${id}`}>
      <summary><span className="ic-row"><Icon name="licensing" size={16} /><b>איך זה מחושב</b> <span className="muted">היגיון, יחידות ומידות</span></span></summary>
      <div className="doc-body">
        <ol className="numlist">{doc.logic.map((l, i) => <li key={i}><span className="num-badge mono">{i + 1}</span><span>{l}</span></li>)}</ol>
        <dl className="units">{doc.units.map(([u, d]) => <div key={u}><dt className="mono">{u}</dt><dd>{d}</dd></div>)}</dl>
      </div>
    </details>
  );
}

export function ToolShell({ id, children }: { id: string; children: ReactNode }) {
  const g = toolDocs[id]?.kGroup;
  return (
    <div className="stack">
      {children}
      <ToolDocView id={id} />
      {g && <ConstantsPanel group={g} />}
    </div>
  );
}
