import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { scenes3d } from "./scenes3d";

const Scene3D = lazy(() => import("./Scene3D"));
import { Icon } from "../icons";
import { ActiveCtx, illustrations } from "./drawings";

/**
 * מסגרת המחשה: תכנית, חתך או תלת־ממד (אקסונומטרי), עם זום (גלגלת, כפתורים, צביטה), גרירה ואיפוס.
 * בתלת־ממד השרטוט מוטה, והמבנים מוגבהים בשכבות כדי לתת נפח.
 */
export function Viewer({ id, active, tone }: { id: string; active: number | null; tone?: string }) {
  const base = illustrations[id];
  // תלת־ממד אמיתי במקום הטיה של השרטוט, כשיש מודל
  const ill = base && scenes3d[id]
    ? { ...base, views: [...base.views.filter((v) => v.id !== "axo"), { id: "axo" as const, label: "תלת־ממד", Draw: () => <></> }] }
    : base;
  const reduce = useReducedMotion();
  const [view, setView] = useState(ill?.views[0].id ?? "plan");
  const [z, setZ] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => { setZ(1); setPan({ x: 0, y: 0 }); }, []);
  const zoom = useCallback((d: number) => setZ((v) => Math.min(4, Math.max(0.6, +(v * d).toFixed(2)))), []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("canvas")) return; // בתלת־ממד הזום מטופל במצלמה
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom]);

  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [full]);

  if (!ill) return null;
  const cur = ill.views.find((v) => v.id === view) ?? ill.views[0];
  const Draw = cur.Draw;
  const isAxo = cur.id === "axo";
  const real3d = isAxo && !!scenes3d[id];

  return (
    <figure className={`viewer ${full ? "full" : ""} ${tone ? `tone-${tone}` : ""}`} aria-label={`המחשה: ${ill.title}`} data-testid={`viewer-${id}`}>
      <header className="viewer-bar">
        <b className="viewer-title">{ill.title}</b>
        {ill.views.length > 1 && (
          <div className="seg" role="tablist" aria-label="סוג תצוגה">
            {ill.views.map((v) => (
              <button key={v.id} role="tab" type="button" className="btn sm" aria-pressed={v.id === cur.id} aria-selected={v.id === cur.id} onClick={() => { setView(v.id); reset(); }}>{v.label}</button>
            ))}
          </div>
        )}
        <div className="row" style={{ gap: 4, display: real3d ? "none" : undefined }}>
          <button type="button" className="btn sm icon" onClick={() => zoom(1 / 1.25)} aria-label="התרחקות"><Icon name="minus" size={16} /></button>
          <span className="mono zoom-v" aria-live="polite">{Math.round(z * 100)}%</span>
          <button type="button" className="btn sm icon" onClick={() => zoom(1.25)} aria-label="התקרבות"><Icon name="plus" size={16} /></button>
          <button type="button" className="btn sm icon" onClick={reset} aria-label="איפוס תצוגה"><Icon name="reset" size={16} /></button>
          <button type="button" className="btn sm icon" onClick={() => setFull((f) => !f)} aria-label={full ? "יציאה ממסך מלא" : "מסך מלא"} aria-pressed={full}><Icon name={full ? "shrink" : "expand"} size={16} /></button>
        </div>
      </header>
      <div
        ref={box}
        className={`viewer-stage ${isAxo && !real3d ? "axo" : ""} ${real3d ? "is3d" : ""}`}
        onPointerDown={(e) => { if (real3d) return; (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; }}
        onPointerMove={(e) => { const d = drag.current; if (d) setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) }); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onDoubleClick={() => zoom(1.5)}
      >
        <ActiveCtx.Provider value={active}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={cur.id}
              className="viewer-canvas"
              style={{ x: pan.x, y: pan.y, scale: z }}
              initial={reduce ? false : { opacity: 0, rotateX: isAxo ? 0 : 8 }}
              animate={{ opacity: 1, rotateX: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {real3d ? (
                <Suspense fallback={<div className="viewer-loading">טוען מודל תלת־ממדי</div>}>
                  <Scene3D id={id} active={active} tone={tone} />
                </Suspense>
              ) : isAxo ? (
                <div className="axo-stack">
                  <div className="axo-layer base"><Draw /></div>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="axo-layer mass" style={{ transform: `translateZ(${i * 5}px)` }} aria-hidden="true"><Draw /></div>
                  ))}
                  <div className="axo-layer roof" style={{ transform: "translateZ(32px)" }} aria-hidden="true"><Draw /></div>
                </div>
              ) : (
                <Draw />
              )}
            </motion.div>
          </AnimatePresence>
        </ActiveCtx.Provider>
      </div>
      <figcaption className="viewer-cap">{real3d ? "גלגלת: זום · גרירה: סיבוב · ימני: הזזה." : "גלגלת: זום · גרירה: הזזה · לחיצה כפולה: הגדלה."} סכמה להמחשה, לא בקנה מידה. המספרים כמו ברשימה.</figcaption>
    </figure>
  );
}
