// ויזואליזציות: אפורים ושחור לכמויות, צבע רק לסטטוס (רמזור). כל תנועה מעבירה מידע ומכבדת הפחתת תנועה.
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export type Status = "ok" | "warn" | "bad" | "idle";
export const statusOf = (ratio: number): Status => (ratio >= 1 ? "ok" : ratio > 0 ? "warn" : "idle");
const statusLabel: Record<Status, string> = { ok: "הושלם", warn: "בתהליך", bad: "חסר", idle: "לא התחיל" };

/* מספר שעולה עד הערך */
export function CountUp({ value, decimals = 0, prefix = "" }: { value: number; decimals?: number; prefix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    const c = animate(from.current, value, { duration: 0.8, ease: [0.2, 0.7, 0.2, 1], onUpdate: (v) => setShown(v) });
    from.current = value;
    return () => c.stop();
  }, [value, reduce]);
  return <span ref={ref}>{prefix}{shown.toLocaleString("he-IL", { maximumFractionDigits: decimals, minimumFractionDigits: 0 })}</span>;
}

/* פס מוערם: חלוקת שלם לחלקים, עם קו סף אופציונלי */
export interface Seg { label: string; value: number; shade: 0 | 1 | 2 | 3 | 4; status?: Status }
export function StackBar({ segments, unit, marker, label }: { segments: Seg[]; unit: string; marker?: { at: number; label: string; status?: Status }; label: string }) {
  const reduce = useReducedMotion();
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  return (
    <figure className="viz stackbar" aria-label={label}>
      <div className="sb-track">
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            className={`sb-seg shade-${s.shade} ${s.status ? `st-${s.status}` : ""}`}
            style={{ transformOrigin: "right" }}
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1, flexBasis: `${(Math.max(0, s.value) / total) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
            title={`${s.label}: ${s.value.toLocaleString("he-IL", { maximumFractionDigits: 1 })} ${unit}`}
          />
        ))}
        {marker && (
          <motion.div className={`sb-marker ${marker.status ? `st-${marker.status}` : ""}`} style={{ insetInlineStart: `${Math.min(100, (marker.at / total) * 100)}%` }} initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <span>{marker.label}</span>
          </motion.div>
        )}
      </div>
      <figcaption className="sb-legend">
        {segments.map((s) => (
          <span key={s.label}>
            <i className={`sw shade-${s.shade} ${s.status ? `st-${s.status}` : ""}`} />
            {s.label}
            <b className="mono">{s.value.toLocaleString("he-IL", { maximumFractionDigits: 1 })}</b>
            <span className="muted">{Math.round((Math.max(0, s.value) / total) * 100)}%</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/* רשת יחידות: כל ריבוע הוא יחידה (חניה, עץ). קבוצות בגווני אפור, סימון בצורה */
export interface WaffleGroup { label: string; count: number; kind: "solid" | "mid" | "light" | "ring" | "dot" }
export function Waffle({ groups, label, perSquare = 1 }: { groups: WaffleGroup[]; label: string; perSquare?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const cells = groups.flatMap((g) => Array.from({ length: Math.ceil(g.count / perSquare) }, () => g.kind));
  return (
    <figure className="viz" aria-label={label}>
      <div className="waffle" ref={ref}>
        {cells.slice(0, 400).map((k, i) => (
          <motion.i key={i} className={`wf ${k}`} initial={reduce ? false : { opacity: 0, scale: 0.3 }} animate={inView ? { opacity: 1, scale: 1 } : undefined} transition={{ delay: Math.min(1.2, i * 0.012), duration: 0.25 }} />
        ))}
      </div>
      <figcaption className="sb-legend">
        {groups.map((g) => (
          <span key={g.label}><i className={`wf ${g.kind}`} />{g.label}<b className="mono">{g.count}</b></span>
        ))}
        {perSquare > 1 && <span className="muted">כל ריבוע = {perSquare}</span>}
      </figcaption>
    </figure>
  );
}

/* טבעת התקדמות */
export function Ring({ value, label, sub, size = 92, status }: { value: number; label: string; sub?: string; size?: number; status?: Status }) {
  const reduce = useReducedMotion();
  const st = status ?? statusOf(value);
  const r = 40;
  return (
    <figure className={`viz ring st-${st}`} aria-label={`${label}: ${Math.round(value * 100)}%, ${statusLabel[st]}`} style={{ width: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} className="ring-bg" />
        <motion.circle cx="50" cy="50" r={r} className="ring-fg" transform="rotate(-90 50 50)" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: Math.max(0.0001, Math.min(1, value)) }} transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }} />
        <text x="50" y="55" textAnchor="middle" className="ring-t">{Math.round(value * 100)}%</text>
      </svg>
      <figcaption><b>{label}</b>{sub && <span className="muted">{sub}</span>}</figcaption>
    </figure>
  );
}

/* מכל: נפח מול קיבולת. מעל הקיבולת: אדום */
export function Tank({ fill, capacity, label, unit }: { fill: number; capacity: number; label: string; unit: string }) {
  const reduce = useReducedMotion();
  const ratio = capacity > 0 ? fill / capacity : 0;
  const st: Status = ratio > 1 ? "bad" : ratio > 0.85 ? "warn" : "ok";
  return (
    <figure className={`viz tank st-${st}`} aria-label={`${label}: ${fill.toFixed(2)} מתוך ${capacity} ${unit}`}>
      <div className="tank-body">
        <motion.div className="tank-fill" style={{ transformOrigin: "bottom" }} initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: Math.min(1, ratio) }} transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1] }} />
        {[0.25, 0.5, 0.75].map((t) => <span key={t} className="tank-tick" style={{ bottom: `${t * 100}%` }} />)}
        <span className="tank-pct mono">{Math.round(ratio * 100)}%</span>
      </div>
      <figcaption><b>{label}</b><span className="mono">{fill.toFixed(2)} / {capacity} {unit}</span></figcaption>
    </figure>
  );
}

/* תכנית מגרש בקנה מידה: מגרש, מבנה, ירוק, מרוצף ועצים */
export function SitePlan({ plot, footprint, green, trees = 0, minGreen }: { plot: number; footprint: number; green: number; trees?: number; minGreen?: number }) {
  const reduce = useReducedMotion();
  if (plot <= 0) return null;
  const W = 300;
  const H = 200;
  const fb = Math.min(1, footprint / plot);
  const gr = Math.min(1 - fb, green / plot);
  // מבנה: מלבן ממורכז ביחס 3:2 שמייצג את התכסית
  const bw = W * Math.sqrt(fb);
  const bh = H * Math.sqrt(fb);
  const bx = (W - bw) / 2 + W * 0.08 * (1 - Math.sqrt(fb));
  const by = (H - bh) / 2;
  // ירוק: רצועה בצד שמאל של המגרש, ברוחב לפי השטח
  const gw = W * gr;
  const meets = minGreen === undefined ? true : green >= minGreen;
  const treeCount = Math.min(trees, 60);
  const cols = Math.max(1, Math.ceil(Math.sqrt(treeCount * (gw / H || 1))));
  const pts = Array.from({ length: treeCount }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const rows = Math.ceil(treeCount / cols);
    return { x: gw > 18 ? 8 + ((c + 0.5) / cols) * (gw - 16) : 8 + ((i % 12) + 0.5) * ((W - 16) / 12), y: gw > 18 ? 8 + ((r + 0.5) / rows) * (H - 16) : H - 10 - Math.floor(i / 12) * 12 };
  });
  return (
    <figure className="viz siteplan" aria-label={`תכנית מגרש: ${Math.round(fb * 100)}% מבנה, ${Math.round(gr * 100)}% ירוק`}>
      <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} width="100%" style={{ maxWidth: 520 }}>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={H} className="sp-plot" />
        <motion.rect x="0" y="0" height={H} className={`sp-green ${meets ? "" : "st-bad"}`} initial={reduce ? false : { width: 0 }} animate={{ width: gw }} transition={{ duration: 0.8 }} />
        <rect x="0" y="0" height={H} width={gw} fill="url(#hatch)" />
        <motion.rect x={bx} y={by} width={bw} height={bh} className="sp-building" initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: "center", transformBox: "fill-box" }} transition={{ duration: 0.6, delay: 0.2 }} />
        {minGreen !== undefined && <line x1={W * (minGreen / plot)} x2={W * (minGreen / plot)} y1="-4" y2={H + 4} className={`sp-req ${meets ? "st-ok" : "st-bad"}`} />}
        {pts.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="4.5" className="sp-tree" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.03 }} />
        ))}
      </svg>
      <figcaption className="sb-legend">
        <span><i className="sw shade-4" />מבנה</span>
        <span><i className="sw shade-1 hatched" />ירוק מחלחל</span>
        <span><i className="sw shade-0" />מרוצף ופתוח</span>
        {trees > 0 && <span><i className="sw dot" />עץ בוגר</span>}
        {minGreen !== undefined && <span><i className={`sw line ${meets ? "st-ok" : "st-bad"}`} />סף 15%</span>}
      </figcaption>
    </figure>
  );
}

/* רמזור: נקודת סטטוס עם טקסט */
export function Light({ status, children }: { status: Status; children: React.ReactNode }) {
  return <span className={`light st-${status}`}><i aria-hidden="true" />{children}<span className="sr-only">, {statusLabel[status]}</span></span>;
}
