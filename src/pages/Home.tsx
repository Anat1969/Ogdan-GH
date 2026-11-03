import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useState } from "react";
import { allChecklistKeys, chapters, directory, source, tools } from "../data/permitData";
import { calcDrainage, calcFee, calcGreen, calcParking, calcWaste, calcWater } from "../logic/calculators";
import { href, navigate } from "../state/router";
import { useChecks, useK, useProject } from "../state/store";
import { Progress } from "../components/ui";
import { CountUp, statusOf } from "../components/viz";

const totalReqs = chapters.reduce((s, c) => s + allChecklistKeys(c).length, 0);

function useChapterProgress() {
  const checks = useChecks();
  return Object.fromEntries(
    chapters.map((c) => {
      const keys = allChecklistKeys(c);
      const done = keys.filter((k) => checks[k]).length;
      return [c.id, { done, total: keys.length, ratio: keys.length ? done / keys.length : 0 }];
    }),
  ) as Record<string, { done: number; total: number; ratio: number }>;
}

/* ---------- מודל תלת־ממדי: כל קומה היא פרק ---------- */
function Tower({ active, setActive, progress }: { active: string | null; setActive: (id: string | null) => void; progress: Record<string, { ratio: number }> }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rz = useSpring(useTransform(mx, [-1, 1], [-46, -30]), { stiffness: 60, damping: 18 });
  const rx = useSpring(useTransform(my, [-1, 1], [62, 52]), { stiffness: 60, damping: 18 });
  const floors = [...chapters];
  return (
    <div
      className="model"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); setActive(null); }}
      aria-hidden="true"
    >
      <motion.div className="tower" style={{ rotateX: reduce ? 58 : rx, rotateZ: reduce ? -38 : rz }}>
        <div className="ground" />
        {floors.map((c, i) => {
          const lifted = active === c.id;
          return (
            <motion.div
              key={c.id}
              className={`slab tone-${c.tone} st-${progress[c.id].ratio > 0 ? statusOf(progress[c.id].ratio) : "idle"} ${lifted ? "on" : ""} ${active && !lifted ? "dim" : ""}`}
              initial={reduce ? false : { z: 400, opacity: 0 }}
              animate={{ z: i * 26 + (lifted ? 18 : 0), opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.15 + i * 0.07, type: "spring", stiffness: 120, damping: 16 }}
              onPointerEnter={() => setActive(c.id)}
              onClick={() => navigate({ name: "chapter", id: c.id })}
            >
              <div className="face top">
                <i style={{ width: `${Math.round(progress[c.id].ratio * 100)}%` }} />
                <span>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="face front" />
              <div className="face back" />
              <div className="face left" />
              <div className="face right" />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<string | null>(null);
  const progress = useChapterProgress();
  const checks = useChecks();
  const p = useProject();
  const k = useK();
  const reduce = useReducedMotion();
  const doneAll = Object.values(checks).filter(Boolean).length;

  const preview: Record<string, string | null> = {
    parking: (() => { const r = calcParking(p.parking, p.standard, k); return r.hasInput ? `${r.total} חניות` : null; })(),
    drainage: (() => { const r = calcDrainage(p.plot, p.footprint, p.green, k); return r ? `${r.peakLps.toFixed(1)} ל'/ש'` : null; })(),
    green: (() => { const r = calcGreen(p.plot, p.footprint, p.units, k); return r ? `${r.trees} עצים` : null; })(),
    waste: (() => { const r = calcWaste(p.units, p.floors, k); return r ? `${r.totalM3.toFixed(2)} קוב` : null; })(),
    water: (() => { const r = calcWater(p.plot, p.footprint, p.irrigation, p.water, k); return r ? `${Math.round(r.total).toLocaleString("he-IL")} מ"ק` : null; })(),
    fee: (() => { const r = calcFee(p.gfa, k); return r.area ? `₪${Math.round(r.fee).toLocaleString("he-IL")}` : null; })(),
  };

  return (
    <div className="home-one">
      {/* פתיח */}
      <section className="home-hero">
        <div className="hero-text">
          <span className="label">{source.publisher} · נוסח {source.version}</span>
          <motion.h1 initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            מהאוגדן
            <br />
            <strong>לבקשה שלמה.</strong>
          </motion.h1>
          <p className="lead">
            {chapters.length} פרקי הנחיות, {totalReqs} דרישות להגשה, {directory.length} אנשי קשר ו-{tools.length} מחשבונים, במבנה אחד.
            מזינים את נתוני הפרויקט פעם אחת, וכל מחשבון, רשימת דרישות ודוח מתעדכנים יחד.
          </p>
          <div className="row" style={{ gap: 12, marginTop: 8 }}>
            <a className="btn primary" href={href({ name: "project" })} data-testid="cta-project">פתיחת תיק בקשה</a>
            <a className="btn" href={href({ name: "chapter", id: "licensing" })}>קריאת האוגדן מהפרק הראשון</a>
          </div>
          <div className="hero-stats">
            {[[chapters.length, "פרקים"], [totalReqs, "דרישות"], [directory.length, "אנשי קשר"], [tools.length, "מחשבונים"]].map(([n, l]) => (
              <div key={l as string}><b className="mono"><CountUp value={n as number} /></b><span>{l}</span></div>
            ))}
          </div>
          <div className="hero-meter">
            <div className="spread" style={{ fontSize: 13 }}>
              <span className="muted">התקדמות התיק שלכם</span>
              <span className="mono">{doneAll} / {totalReqs}</span>
            </div>
            <Progress value={doneAll / totalReqs} label="התקדמות כוללת" />
          </div>
          <ol className="home-tools" aria-label="מחשבונים ותוצאות מהתיק">
            {tools.map((t, i) => (
              <li key={t.id}>
                <a href={href({ name: "tool", id: t.id })} data-testid={`home-tool-${t.id}`}>
                  <span className="mono n">{i + 1}</span>
                  <span className="t">{t.title.replace(/^(מחשבון|בדיקת) /, "")}</span>
                  <span className="mono v">{preview[t.id] ?? "—"}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
        <div className="hero-model">
          <Tower active={active} setActive={setActive} progress={progress} />
          <ol className="legend" aria-label="פרקי האוגדן, מהקרקע ומעלה">
            {[...chapters].reverse().map((c) => {
              const i = chapters.indexOf(c);
              return (
                <li key={c.id}>
                  <a href={href({ name: "chapter", id: c.id })} className={`tone-${c.tone} st-${statusOf(progress[c.id].ratio)} ${active === c.id ? "on" : ""}`} onMouseEnter={() => setActive(c.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(c.id)} onBlur={() => setActive(null)}>
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                    <span>{c.short}</span>
                    <span className="mono muted">{progress[c.id].total ? `${progress[c.id].done}/${progress[c.id].total}` : "מידע"}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

    </div>
  );
}
