import { Suspense, lazy, useMemo, useRef, useState } from "react";
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
        <div className="viewer-stage is3d">
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
      <figcaption className="viewer-cap">גלגלת: זום · גרירה: סיבוב. מידות בבורדו. המודל מתעדכן עם כל שינוי בטופס.</figcaption>
    </figure>
  );
}
