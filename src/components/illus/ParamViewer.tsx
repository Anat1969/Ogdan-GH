import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KDEFS } from "../../logic/constants";
import { toolDocs } from "../../data/toolDocs";
import { exampleProject, replaceProject, useK, useProject, type Project } from "../../state/store";
import { paramScene, toolSteps } from "./paramScenes";
import { Legend } from "./Legend";

const Scene3D = lazy(() => import("./Scene3D"));

/**
 * מסגרת המחשה למחשבון: מודל תלת־ממדי שנבנה מהנתונים שהוזנו, דרישות החישוב לצד המסגרת,
 * ודוגמה מונחית שעוברת על שלבי החישוב אחד אחד.
 */
export function ParamViewer({ tool }: { tool: string }) {
  const p = useProject();
  const k = useK();
  const scene = useMemo(() => paramScene(tool, p, k), [tool, p, k]);
  const steps = useMemo(() => toolSteps(tool, p, k), [tool, p, k]);
  const [demo, setDemo] = useState<number | null>(null);
  const saved = useRef<Project | null>(null);
  const group = toolDocs[tool]?.kGroup;
  const reqs = group ? KDEFS.filter((d) => d.group === group).slice(0, 10) : [];

  const startDemo = () => {
    saved.current = p;
    const ex = exampleProject();
    replaceProject({ ...ex, k: p.k, name: p.name, address: p.address });
    setDemo(0);
  };
  const endDemo = (keep: boolean) => {
    if (!keep && saved.current) replaceProject(saved.current);
    saved.current = null;
    setDemo(null);
  };
  // תוויות במודל לא עולות זו על זו: כל תווית שחופפת לקודמת יורדת מתחתיה. רץ שוב כשהמצלמה זזה
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fix = () => {
      const ls = [...el.querySelectorAll<HTMLElement>(".l3")];
      // המיקום הבסיסי = המיקום הנוכחי פחות ההזזה שכבר הוחלה, כדי לא לאפס ולהבהב
      const items = ls.map((l) => {
        const cur = Number(l.dataset.dy || 0);
        const b = l.getBoundingClientRect();
        return { l, cur, r: new DOMRect(b.left, b.top - cur, b.width, b.height) };
      }).sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
      const placed: DOMRect[] = [];
      for (const { l, cur, r } of items) {
        let dy = 0;
        for (let guard = 0; guard < 12; guard++) {
          const hit = placed.find((p) => r.left < p.right + 3 && p.left - 3 < r.right && r.top + dy < p.bottom + 2 && p.top - 2 < r.bottom + dy);
          if (!hit) break;
          dy = hit.bottom - r.top + 3;
        }
        if (dy !== cur) { l.dataset.dy = String(dy); l.style.transform = dy ? `translateY(${dy}px)` : ""; }
        placed.push(new DOMRect(r.left, r.top + dy, r.width, r.height));
      }
    };
    fix();
    const id = window.setInterval(fix, 250);
    return () => window.clearInterval(id);
  }, [scene]);

  const st = demo !== null ? steps[Math.min(demo, steps.length - 1)] : null;

  return (
    <figure className="viewer pviewer" aria-label="מודל מהנתונים" data-testid={`pviewer-${tool}`}>
      <header className="viewer-bar">
        <b className="viewer-title">מודל מהנתונים שהוזנו</b>
        <span className="muted" style={{ fontSize: 11.5 }}>אקסונומטריה · סכמטי, לא בקנ"מ</span>
        {demo === null
          ? <button type="button" className="btn sm" onClick={startDemo} data-testid="demo-start">דוגמה מונחית</button>
          : <button type="button" className="btn sm" onClick={() => endDemo(false)} data-testid="demo-end">סיום, החזרת הנתונים שלי</button>}
      </header>
      <div className="pviewer-body">
        <div className="viewer-stage is3d" ref={stage}>
          {scene ? (
            <Suspense fallback={<div className="viewer-loading">טוען מודל</div>}>
              <Scene3D id={tool} scene={scene} active={null} />
            </Suspense>
          ) : (
            <div className="viewer-empty">
              <p>המודל נבנה מהנתונים. הזינו נתונים בטופס, או לחצו "דוגמה מונחית".</p>
            </div>
          )}
          <AnimatePresence>
            {st && (
              <motion.div key={demo} className="demo-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid="demo-card">
                <span className="mono demo-n">שלב {Math.min(demo! + 1, steps.length)} מתוך {steps.length}</span>
                <b>{st.label}</b>
                <code className="ltr-expr">{st.expr}</code>
                <div className="row" style={{ gap: 6 }}>
                  <button type="button" className="btn sm" disabled={demo === 0} onClick={() => setDemo((d) => Math.max(0, (d ?? 0) - 1))}>הקודם</button>
                  {demo! < steps.length - 1
                    ? <button type="button" className="btn sm primary" onClick={() => setDemo((d) => (d ?? 0) + 1)} data-testid="demo-next">הבא</button>
                    : <button type="button" className="btn sm primary" onClick={() => endDemo(true)}>להשאיר את הדוגמה</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <aside className="preqs" aria-label="דרישות החישוב">
          <b className="preqs-h">דרישות וקבועים</b>
          <ol>
            {reqs.map((d, i) => (
              <li key={d.id}><span className="mono n">{i + 1}</span><span className="t">{p.kText?.[d.id]?.label ?? d.label}</span><span className="mono v">{+(k[d.id] ?? d.value).toFixed(3)} {p.kText?.[d.id]?.unit ?? d.unit}</span>{!d.verified && <i className="lv" title="לאימות">לאימות</i>}</li>
            ))}
          </ol>
          <Legend kinds={["mass", "plot", "dim", "green", "water", "tone"]} />
        </aside>
      </div>
      {scene?.key && <ol className="viewer-key" aria-label="מפתח מספרים במודל">{scene.key.map((t) => <li key={t}><span>{t}</span></li>)}</ol>}
      <figcaption className="viewer-cap">גלגלת: זום · גרירה: סיבוב. מידות בבורדו. המודל מתעדכן עם כל שינוי בטופס.</figcaption>
    </figure>
  );
}
