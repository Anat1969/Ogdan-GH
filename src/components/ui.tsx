import { motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Step } from "../logic/calculators";
import { Icon } from "./icons";
import { CountUp, statusOf } from "./viz";
import { href, type Route } from "../state/router";

export function Sheet({ title, label, children, tone, id, className = "" }: { title?: ReactNode; label?: ReactNode; children: ReactNode; tone?: string; id?: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      className={`sheet ${tone ? `tone-${tone} tick` : ""} ${className}`}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {(title || label) && (
        <header className="sheet-head">
          {title && <h3>{title}</h3>}
          {label && <span className="label">{label}</span>}
        </header>
      )}
      {children}
    </motion.section>
  );
}

export function Metric({ v, u, k, n, tone, hero }: { v: ReactNode; u?: string; k: string; n?: string; tone?: string; hero?: boolean }) {
  return (
    <div className={`metric ${hero ? "hero" : ""} ${tone ? `tone-${tone}` : ""}`} role="group" aria-label={k}>
      <div className="v">
        {typeof v === "number" ? <CountUp value={v} /> : v}
        {u && <span className="u">{u}</span>}
      </div>
      <div className="k">{k}</div>
      {n && <div className="n">{n}</div>}
    </div>
  );
}

export function Stamp({ kind, seal, title, children }: { kind: "ok" | "no" | "warn"; seal: string; title: string; children?: ReactNode }) {
  return (
    <div className={`stamp ${kind}`} role="status">
      <span className="seal" aria-hidden="true"><Icon name={kind === "ok" ? "check" : kind === "no" ? "x" : "alert"} size={18} strokeWidth={2.2} /></span>
      <div>
        <span className="seal-t">{seal}</span>
        <b>{title}</b>
        {children && <div className="muted" style={{ fontSize: 14 }}>{children}</div>}
      </div>
    </div>
  );
}

export function Steps({ steps, limits }: { steps: Step[]; limits?: string }) {
  return (
    <details className="calc-steps">
      <summary>
        <span>שלבי החישוב, שורה אחר שורה</span>
      </summary>
      <div style={{ padding: "0 16px 12px" }} className="layers" aria-label="שכבות האמינות">
        <span className="layer code">חושב בקוד, דטרמיניסטי</span>
        <span className="layer">מקדמים מהאוגדן ומתקנים מקובלים</span>
        <span className="layer pro">אומדן בלבד: עורך הבקשה מאשר וחותם</span>
      </div>
      <ol>
        {steps.map((s, i) => (
          <li key={i}>
            <span>{s.label}</span>
            <code>{s.expr}</code>
          </li>
        ))}
      </ol>
      {limits && <p style={{ padding: "0 16px 14px", fontSize: 13 }} className="muted">מגבלות: {limits}</p>}
    </details>
  );
}

export function NumField({ label, value, onChange, hint, linked, placeholder, testId }: { label: string; value: string; onChange: (v: string) => void; hint?: string; linked?: boolean; placeholder?: string; testId?: string }) {
  return (
    <label className="field">
      <span>
        {label}
        {linked && <span className="label" style={{ marginInlineStart: 8, color: "var(--blueprint)" }}>משותף</span>}
      </span>
      <input
        className={`input ${linked ? "linked" : ""}`}
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        placeholder={placeholder ?? "0"}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        title={linked ? "שדה משותף: ערך שמוזן כאן מתעדכן בכל המחשבונים ובתיק הבקשה" : undefined}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="btn sm" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className={`progress st-${statusOf(value)}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <i style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export const CheckMark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M2.5 7.5 5.5 10.5 11.5 3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

export function Crumbs({ items }: { items: { label: string; route?: Route }[] }) {
  return (
    <nav className="crumbs" aria-label="פירורי לחם">
      {items.map((it, i) => (
        <span key={i} className="row" style={{ gap: 8 }}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.route ? <a href={href(it.route)}>{it.label}</a> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** כותרת דף אחידה, באותו גריד כמו כותרת האגף: אייקון | כותרת והסבר בשורה אחת | פעולות */
export function PageHead({ crumbs, title, lead, label, tone, children, icon }: { crumbs?: { label: string; route?: Route }[]; title: string; lead?: string; label?: string; tone?: string; children?: ReactNode; icon?: string }) {
  return (
    <header className={`ws-head page-head ${tone ? `tone-${tone}` : ""}`}>
      {icon ? <span className="iconbox ws-icon" aria-hidden="true"><Icon name={icon} size={22} /></span> : <span />}
      <div className="ws-title">
        {crumbs && <Crumbs items={label ? [...crumbs, { label }] : crumbs} />}
        <h1>{title}</h1>
        {lead && <p className="muted" title={lead}>{lead}</p>}
      </div>
      {children ? <div className="ws-meta ph-acts">{children}</div> : <span />}
    </header>
  );
}

/* הודעות */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="sr-only">{msg}</div>
      {msg && <div className="toast" role="status" data-testid="toast">{msg}</div>}
    </ToastCtx.Provider>
  );
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
