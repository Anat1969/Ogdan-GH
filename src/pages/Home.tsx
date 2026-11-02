import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useState } from "react";
import { allChecklistKeys, chapters, directory, permitTracks, source, tools } from "../data/permitData";
import { calcDrainage, calcFee, calcGreen, calcParking, calcWaste, calcWater } from "../logic/calculators";
import { href, navigate } from "../state/router";
import { useChecks, useProject } from "../state/store";
import { Progress } from "../components/ui";
import { IconBox, chapterIcon, toolIcon } from "../components/icons";
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
  const reduce = useReducedMotion();
  const doneAll = Object.values(checks).filter(Boolean).length;
  const maxDays = Math.max(...permitTracks.map((t) => t.days));

  const preview: Record<string, string | null> = {
    parking: (() => { const r = calcParking(p.parking, p.standard); return r.hasInput ? `${r.total} חניות` : null; })(),
    drainage: (() => { const r = calcDrainage(p.plot, p.footprint, p.green); return r ? `${r.peakLps.toFixed(1)} ל'/ש'` : null; })(),
    green: (() => { const r = calcGreen(p.plot, p.footprint, p.units); return r ? `${r.trees} עצים` : null; })(),
    waste: (() => { const r = calcWaste(p.units, p.floors); return r ? `${r.totalM3.toFixed(2)} קוב` : null; })(),
    water: (() => { const r = calcWater(p.plot, p.footprint, p.irrigation, p.water); return r ? `${Math.round(r.total).toLocaleString("he-IL")} מ"ק` : null; })(),
    fee: (() => { const r = calcFee(p.gfa); return r.area ? `₪${Math.round(r.fee).toLocaleString("he-IL")}` : null; })(),
  };

  return (
    <div className="stack" style={{ gap: 72 }}>
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

      {/* חזון, מטרה, כלים, תוצאות */}
      <section className="grid g4 pillars">
        {[
          ["חזון", "עורך בקשה שמגיש פעם אחת, שלם ומדויק, בלי סבב תיקונים."],
          ["מטרה", "לתרגם אוגדן של עשרות עמודים למסלול עבודה: מה נדרש, ממי, ומתי."],
          ["כלים", "רשימות דרישות שנשמרות, 6 מחשבונים עם חישוב שקוף, ספר טלפונים וחיפוש בכל האוגדן."],
          ["תוצאות", "דוח תיק בקשה להדפסה, עם כל הכמויות, החוסרים והדרישות הפתוחות."],
        ].map(([t, b], i) => (
          <motion.div key={t} className="pillar" initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <span className="label">{String(i + 1).padStart(2, "0")}</span>
            <h3>{t}</h3>
            <p>{b}</p>
          </motion.div>
        ))}
      </section>

      {/* מסלולים */}
      <section className="stack" style={{ gap: 20 }}>
        <div className="spread">
          <h2 className="h2">מסלולי הגשה לרשות הרישוי</h2>
          <span className="label">ימי עבודה לטיפול</span>
        </div>
        <div className="tracks">
          {permitTracks.map((t, i) => (
            <div key={t.id} className={`track ${p.track === t.id ? "mine" : ""}`}>
              <div className="spread" style={{ marginBottom: 8 }}>
                <span><b style={{ fontWeight: 500 }}>{t.name}</b> <span className="muted" style={{ fontSize: 13 }}>{t.description}</span></span>
                <span className="mono" style={{ fontSize: 22 }}>{t.days}<span className="muted" style={{ fontSize: 13 }}> ימים</span></span>
              </div>
              <div className="track-bar">
                <motion.i style={{ width: `${(t.days / maxDays) * 100}%`, transformOrigin: "right" }} initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.12, ease: [0.2, 0.7, 0.2, 1] }} />
                {[...Array(Math.floor(maxDays / 15))].map((_, k) => <span key={k} style={{ insetInlineStart: `${((k + 1) * 15 / maxDays) * 100}%` }} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* פרקים */}
      <section className="stack" style={{ gap: 20 }}>
        <div className="spread">
          <h2 className="h2">פרקי האוגדן</h2>
          <span className="label">{totalReqs} דרישות לסימון</span>
        </div>
        <div className="grid g3">
          {chapters.map((c, i) => (
            <a key={c.id} className={`card-link tone-${c.tone} tick`} href={href({ name: "chapter", id: c.id })} data-testid={`chapter-card-${c.id}`}>
              <IconBox name={chapterIcon[c.id]} />
              <span className="label" style={{ display: "block" }}>אגף {String(i + 1).padStart(2, "0")}</span>
              <span className="go" aria-hidden="true">←</span>
              <h3>{String(i + 1).padStart(2, "0")} {c.title}</h3>
              <p>{c.description}</p>
              <div style={{ marginTop: 14 }}>
                {progress[c.id].total > 0 ? (
                  <>
                    <div className="spread" style={{ fontSize: 12, marginBottom: 4 }}><span className="muted">{c.contacts.length} אנשי קשר</span><span className="mono">{progress[c.id].done}/{progress[c.id].total}</span></div>
                    <Progress value={progress[c.id].ratio} label={`התקדמות ${c.short}`} />
                  </>
                ) : (
                  <span className="muted" style={{ fontSize: 12 }}>פרק הנחיות ומחשבון</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* כלים */}
      <section className="stack" style={{ gap: 20 }}>
        <div className="spread">
          <h2 className="h2">מחשבונים</h2>
          <span className="label">מחוברים לתיק הבקשה</span>
        </div>
        <div className="grid g3">
          {tools.map((t) => {
            const c = chapters.find((x) => x.id === t.chapter)!;
            return (
              <a key={t.id} className={`card-link tone-${c.tone}`} href={href({ name: "tool", id: t.id })}>
                <IconBox name={toolIcon[t.id]} />
                <span className="label" style={{ display: "block" }}>{c.short}</span>
                <span className="go" aria-hidden="true">←</span>
                <h3>{t.title}</h3>
                <p>{t.purpose}</p>
                <div className="mono" style={{ marginTop: 12, fontSize: 20, color: "var(--tone)", minHeight: 30 }}>{preview[t.id] ?? <span className="muted" style={{ fontSize: 13, fontFamily: "var(--sans)" }}>ממתין לנתונים</span>}</div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
