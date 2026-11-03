import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { FlowNode } from "../../data/flows";

const W = 560, CX = 330, BW = 250, SX = 92, SW = 160, ROW = 74;

/** שבירת טקסט לשורות לפי אורך */
function wrap(s: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const w of s.split(" ")) {
    if ((line + " " + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}

function Txt({ x, y, s, max, cls }: { x: number; y: number; s: string; max: number; cls?: string }) {
  const ls = wrap(s, max);
  return (
    <text x={x} y={y - ((ls.length - 1) * 13) / 2 + 4} textAnchor="middle" className={cls}>
      {ls.map((l, i) => <tspan key={i} x={x} dy={i ? 13 : 0}>{l}</tspan>)}
    </text>
  );
}

/**
 * תרשים זרימה: מלמעלה למטה. שאלה היא מעוין; "כן" ממשיך למטה, "לא" יוצא לפעולה בצד וחוזר לרצף.
 * הצמתים מופיעים לפי הסדר, והקווים נמתחים אחריהם.
 */
export function Flow({ nodes, title }: { nodes: FlowNode[]; title: string }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const H = nodes.length * ROW + 40;
  const d = (i: number) => (reduce ? 0 : i * 0.35);
  const ap = (i: number) => ({ initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, transition: { delay: d(i), duration: 0.3 } });
  const line = (i: number) => ({ initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay: d(i) + 0.2, duration: 0.3 } });

  return (
    <div className="flow" data-testid="flow">
      <div className="flow-bar"><b>{title}</b><button type="button" className="btn sm" onClick={() => setRun((r) => r + 1)}>הפעלה מחדש</button></div>
      <svg key={run} viewBox={`0 0 ${W} ${H}`} className="flow-svg" role="img" aria-label={`תרשים זרימה: ${title}`}>
        <defs>
          <marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#666" /></marker>
        </defs>
        {nodes.map((n, i) => {
          const y = 30 + i * ROW;
          const last = i === nodes.length - 1;
          return (
            <g key={i}>
              {!last && <motion.path d={`M${CX} ${y + 22} L${CX} ${y + ROW - 22}`} className="fl-edge" markerEnd="url(#fa)" {...line(i)} />}
              {n.t === "q" && !last && <motion.text x={CX + 8} y={y + ROW / 2 + 4} className="fl-yes" {...ap(i)}>כן</motion.text>}
              <motion.g {...ap(i)}>
                {n.t === "q" ? (
                  <polygon points={`${CX},${y - 26} ${CX + BW / 2 + 10},${y} ${CX},${y + 26} ${CX - BW / 2 - 10},${y}`} className="fl-q" />
                ) : (
                  <rect x={CX - BW / 2} y={y - 22} width={BW} height={44} rx={n.t === "step" ? 2 : 22} className={`fl-${n.t}`} />
                )}
                <Txt x={CX} y={y} s={n.text} max={n.t === "q" ? 30 : 36} cls="fl-t" />
                {n.t !== "q" && "who" in n && n.who && <text x={CX + BW / 2 - 6} y={y - 26} textAnchor="start" className="fl-who">{n.who}</text>}
              </motion.g>
              {n.t === "q" && (
                <g>
                  <motion.path d={`M${CX - BW / 2 - 10} ${y} L${SX + SW / 2 + 4} ${y}`} className="fl-edge no" markerEnd="url(#fa)" {...line(i)} />
                  <motion.text x={(CX - BW / 2 - 10 + SX + SW / 2) / 2} y={y - 6} textAnchor="middle" className="fl-no" {...ap(i)}>לא</motion.text>
                  <motion.g {...ap(i + 0.5)}>
                    <rect x={SX - SW / 2} y={y - 24} width={SW} height={48} rx={2} className="fl-act" />
                    <Txt x={SX} y={y} s={n.no} max={24} cls="fl-t sm" />
                  </motion.g>
                  {!last && !n.noEnd && <motion.path d={`M${SX} ${y + 24} L${SX} ${y + ROW / 2} L${CX - 4} ${y + ROW / 2}`} className="fl-edge back" {...line(i + 0.5)} />}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <dl className="legend flow-legend">
        <div><dt><svg width="20" height="14"><rect x="1" y="2" width="18" height="10" rx="5" className="fl-start" /></svg></dt><dd>התחלה / סיום</dd></div>
        <div><dt><svg width="20" height="14"><rect x="1" y="2" width="18" height="10" className="fl-step" /></svg></dt><dd>פעולה</dd></div>
        <div><dt><svg width="20" height="14"><polygon points="10,1 19,7 10,13 1,7" className="fl-q" /></svg></dt><dd>שאלה: כן למטה, לא לצד</dd></div>
        <div><dt><svg width="20" height="14"><rect x="1" y="2" width="18" height="10" className="fl-act" /></svg></dt><dd>מה עושים אם לא</dd></div>
      </dl>
    </div>
  );
}
