import { AnimatePresence, motion } from "framer-motion";
import type { ToolId } from "../data/permitData";
import {
  calcDrainage, ratioText, calcFee, calcGreen, calcParking, calcWaste, calcWater,
  irrigationRates, parkingRatios, waterUses, type ParkingStandard,
} from "../logic/calculators";
import { uid, updateProject, useK, useProject } from "../state/store";
import { Metric, NumField, Seg, Stamp, Steps } from "./ui";
import { SitePlan, StackBar, Tank, Waffle } from "./viz";
import { ToolShell } from "./ToolShell";
import { DevObligationTool, FireAccessTool, LeviesTool, MamadTool, ProgramTool } from "./tools2";

const fmt = (n: number, d = 0) => n.toLocaleString("he-IL", { maximumFractionDigits: d });

const Empty = ({ children }: { children: string }) => (
  <p className="muted" style={{ padding: "16px 0", fontSize: 14 }} data-testid="empty-state">{children}</p>
);

const Reveal = ({ show, children }: { show: boolean; children: React.ReactNode }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div className="stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

/* ---------------- חניה ---------------- */
export function ParkingTool() {
  const p = useProject();
  const k = useK();
  const r = calcParking(p.parking, p.standard, k);
  const setEntry = (id: string, patch: Partial<(typeof p.parking)[number]>) =>
    updateProject({ parking: p.parking.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  return (
    <div className="stack" data-tool="parking">
      <div className="spread">
        <span className="muted" style={{ fontSize: 14 }}>תקן החניה לחישוב</span>
        <Seg<ParkingStandard> label="תקן חניה" value={p.standard} onChange={(standard) => updateProject({ standard })} options={[{ value: "ashdod", label: "תקן מקומי, אשדוד" }, { value: "national", label: "תקן ארצי" }]} />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {p.parking.map((e, i) => {
          const c = parkingRatios[e.useType];
          return (
            <div key={e.id} className="grid g3" style={{ alignItems: "end", padding: 12, background: "var(--paper)", border: "1px solid var(--rule)" }}>
              <label className="field">
                <span>שימוש {i + 1}</span>
                <select className="input" value={e.useType} onChange={(ev) => setEntry(e.id, { useType: ev.target.value })} data-testid={`parking-use-${i}`}>
                  {Object.entries(parkingRatios).map(([kk, v]) => <option key={kk} value={kk}>{v.label}</option>)}
                </select>
              </label>
              <NumField label={c.inputLabel} value={e.units} onChange={(units) => setEntry(e.id, { units })} testId={`parking-units-${i}`} hint={ratioText(k[`pk.${e.useType}.${p.standard}`], c.unit)} />
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn sm danger" disabled={p.parking.length <= 1} onClick={() => updateProject({ parking: p.parking.filter((x) => x.id !== e.id) })}>
                  הסרת שימוש
                </button>
              </div>
            </div>
          );
        })}
        <button type="button" className="btn" onClick={() => updateProject({ parking: [...p.parking, { id: uid(), useType: "commercial", units: "" }] })} data-testid="parking-add">
          הוספת שימוש נוסף, לחישוב שימוש מעורב
        </button>
      </div>
      {!r.hasInput && <Empty>הזינו כמות לפחות בשימוש אחד, והתוצאה תופיע כאן מיד.</Empty>}
      <Reveal show={r.hasInput}>
        <div className="grid g4">
          <Metric hero v={r.total} k="חניות נדרשות" n={p.standard === "ashdod" ? "תקן אשדוד" : "תקן ארצי"} />
          <Metric v={r.operational} k="רכב תפעולי" tone="clay" />
          <Metric v={r.disabled} k="חניות נכים" n="5%, מינימום 1" tone="moss" />
          <Metric v={r.ev} k="עמדות טעינה" n="20% מהסך" tone="amber" />
        </div>
        <Waffle
          label="פריסת מקומות החניה"
          perSquare={r.grand > 300 ? 5 : 1}
          groups={[
            { label: "חניה רגילה", count: Math.max(0, r.total - r.disabled - r.ev), kind: "solid" },
            { label: "נכים", count: r.disabled, kind: "ring" },
            { label: "עם עמדת טעינה", count: r.ev, kind: "dot" },
            { label: "רכב תפעולי", count: r.operational, kind: "mid" },
          ]}
        />
        {r.rows.filter((x) => x.parking > 0).length > 1 && (
          <StackBar label="חלוקת החניות לפי שימוש" unit="חניות" segments={r.rows.filter((x) => x.parking > 0).map((x, i) => ({ label: x.config.label, value: x.parking, shade: ([4, 2, 3, 1, 0] as const)[i % 5] }))} />
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>ייעוד</th><th>יחידה</th><th>מקדם, {p.standard === "ashdod" ? "אשדוד" : "ארצי"}</th><th>תפעולי</th></tr></thead>
            <tbody>
              {Object.entries(parkingRatios).map(([kk, v]) => (
                <tr key={kk} className={p.parking.some((e) => e.useType === kk) ? "active" : ""}>
                  <td>{v.label}</td><td>{v.unit}</td><td>{ratioText(k[`pk.${kk}.${p.standard}`], v.unit)}</td><td>{ratioText(k[`pk.${kk}.op`], v.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Steps steps={r.steps} limits="שימוש מעורב מחושב לכל ייעוד בנפרד ומסוכם. הסך כולל חניות רגילות ותפעולי. אינו מחליף את בדיקת יועץ התנועה ויועץ הנגישות." />
      </Reveal>
    </div>
  );
}

/* ---------------- אגרות ---------------- */
export function FeeTool() {
  const p = useProject();
  const k = useK();
  const r = calcFee(p.gfa, k);
  return (
    <div className="stack" data-tool="fee">
      <div className="grid g2">
        <NumField label='שטח בנייה מוצע (מ"ר)' value={p.gfa} onChange={(gfa) => updateProject({ gfa })} linked testId="gfa" hint={`תעריף: ₪${r.rate} למ"ר (ניתן לשינוי בקבועי החישוב)`} />
      </div>
      {r.area <= 0 && <Empty>הזינו שטח בנייה כדי לקבל אומדן אגרה ופיקדון.</Empty>}
      <Reveal show={r.area > 0}>
        <div className="grid g2">
          <Metric hero v={`₪${fmt(r.fee)}`} k="אגרת בנייה משוערת" />
          <Metric v={`₪${fmt(r.deposit)}`} k="פיקדון" n="20% מסך האגרה" tone="clay" />
        </div>
        <StackBar label="אגרה ופיקדון" unit="₪" segments={[{ label: "אגרת בנייה", value: r.fee, shade: 4 }, { label: "פיקדון", value: r.deposit, shade: 2 }]} />
        <Steps steps={r.steps} limits="אומדן בלבד. הסכום המדויק ייקבע על ידי מחלקת האגרות לפי התעריפים העדכניים." />
      </Reveal>
    </div>
  );
}

/* ---------------- אשפה ---------------- */
export function WasteTool() {
  const p = useProject();
  const k = useK();
  const r = calcWaste(p.units, p.floors, k);
  return (
    <div className="stack" data-tool="waste">
      <div className="grid g2">
        <NumField label="מספר יחידות דיור" value={p.units} onChange={(units) => updateProject({ units })} linked testId="units" />
        <NumField label="מספר קומות" value={p.floors} onChange={(floors) => updateProject({ floors })} linked testId="floors" />
      </div>
      {!r && <Empty>הזינו מספר יחידות דיור. מעל 9 קומות או 60 יח"ד נדרשת מערכת כפולה.</Empty>}
      <Reveal show={!!r}>
        {r && (
          <>
            <div className="grid g3">
              <Metric hero v={fmt(r.totalM3, 2)} u="קוב" k="נפח אצירה ל-2.5 ימים" />
              <Metric v={fmt(r.wetM3, 2)} u="קוב" k="רטובה, 40%" tone="moss" />
              <Metric v={fmt(r.dryM3, 2)} u="קוב" k="יבשה, 60%" tone="tide" />
            </div>
            <div className="tanks">
              <Tank label="רטובה" unit="קוב" fill={r.wetM3} capacity={r.compactors ? r.compactors.wet : r.tamunim!.wet * 5} />
              <Tank label="יבשה" unit="קוב" fill={r.dryM3} capacity={r.compactors ? r.compactors.dry : r.tamunim!.dry * 5} />
              <p className="muted" style={{ fontSize: 13, maxWidth: "34ch" }}>מילוי המכלים מראה את נפח האצירה ל-2.5 ימים מול הקיבולת שנבחרה{r.compactors ? " (דחסניות)" : " (טמונים של 5 קוב)"}. מעל 100% המכל אדום.</p>
            </div>
            {r.dual ? (
              <Stamp kind="warn" seal="כפולה" title="נדרשת מערכת כפולה">{r.dualReason}: חובה 2 צנרות שוט (רטובה ויבשה) ו-2 דחסניות נפרדות.</Stamp>
            ) : (
              <Stamp kind="ok" seal="יחידה" title="מערכת טמונים">מבנה עד 9 קומות ועד 60 יח"ד: טמונים בנפח 5 קוב.</Stamp>
            )}
            <div className="grid g4">
              {r.compactors && (
                <>
                  <Metric v={r.compactors.wet} u="קוב" k="דחסנית רטובה" tone="moss" />
                  <Metric v={r.compactors.dry} u="קוב" k="דחסנית יבשה" tone="tide" />
                </>
              )}
              {r.tamunim && (
                <>
                  <Metric v={r.tamunim.wet} k="טמונים לרטובה" n="5 קוב כל אחד" tone="moss" />
                  <Metric v={r.tamunim.dry} k="טמונים ליבשה" n="5 קוב כל אחד" tone="tide" />
                </>
              )}
              <Metric v={r.recycling} k="עמדות מחזור" n="1 לכל 50 יח״ד" tone="fern" />
              <Metric v={r.gardenWaste} u='מ"ר' k="רחבת גזם וגרוטאות" n="12 מ״ר לכל 100 יח״ד" tone="clay" />
            </div>
            <ul className="notes">
              <li>עמדת מחזור כוללת: נייר וקרטון, פלסטיק ומתכת, זכוכית, אלקטרוניקה קטנה, טקסטיל.</li>
              <li>מרחק מפתח כניסה למבנה מגורים לטמון או לדחסנית: 3 מ' לפחות. פתח המתקן יפנה הרחק מהמבנה.</li>
              <li>מרחק מחלון מגורים: 6 מ' לפחות. שער לרכב פינוי: רוחב 3.5 מ' לפחות, גובה חופשי 4 מ'.</li>
            </ul>
            <Steps steps={r.steps} limits="מקדם 7 ליטר ליח״ד ליום, פינוי 3 פעמים בשבוע. למבני מסחר, משרדים וחינוך יש להיעזר בטבלת הנפחים של האוגדן." />
          </>
        )}
      </Reveal>
    </div>
  );
}

/* ---------------- ניקוז ---------------- */
export function DrainageTool() {
  const p = useProject();
  const k = useK();
  const r = calcDrainage(p.plot, p.footprint, p.green, k);
  return (
    <div className="stack" data-tool="drainage">
      <div className="grid g3">
        <NumField label='שטח מגרש (מ"ר)' value={p.plot} onChange={(plot) => updateProject({ plot })} linked testId="plot" />
        <NumField label='תכסית מבנה (מ"ר)' value={p.footprint} onChange={(footprint) => updateProject({ footprint })} linked testId="footprint" />
        <NumField label='שטח ירוק מחלחל (מ"ר)' value={p.green} onChange={(green) => updateProject({ green })} linked testId="green" />
      </div>
      {!r && <Empty>הזינו שטח מגרש. החישוב לפי נוסחת הרציונל, Q = C × I × A / 360.</Empty>}
      <Reveal show={!!r}>
        {r && (
          <>
            {r.overAreas && <Stamp kind="no" seal="בדיקה" title="תכסית ושטח ירוק גדולים משטח המגרש">יש לתקן את הנתונים: השטח המרוצף חושב כאפס.</Stamp>}
            <div className="grid g4">
              <Metric hero v={fmt(r.peakLps, 1)} u="ל'/ש'" k="ספיקת שיא" n="אירוע 5 שנים, 15 דק'" />
              <Metric v={fmt(r.eventM3, 1)} u="קוב" k="נפח נגר לאירוע" tone="tide" />
              <Metric v={fmt(r.annualM3)} u="קוב" k="נגר שנתי" n="400 מ״מ בשנה" tone="lagoon" />
              <Metric v={fmt(r.pitM3, 1)} u="קוב" k="נפח בור חלחול" n="30 מ״מ מהשטח האטום" tone="fern" />
            </div>
            <div className="viz-grid">
              <SitePlan plot={r.plot} footprint={r.building} green={r.green} minGreen={r.minInfiltration} />
              <StackBar
                label="הרכב המשטחים במגרש"
                unit='מ"ר'
                segments={[
                  { label: "ירוק מחלחל", value: r.green, shade: 1, status: r.meetsInfiltration ? "ok" : "bad" },
                  { label: "ריצוף וכבישים", value: r.paved, shade: 2 },
                  { label: "גג ומבנה", value: r.building, shade: 4 },
                ]}
                marker={{ at: r.minInfiltration, label: "15% נדרש", status: r.meetsInfiltration ? "ok" : "bad" }}
              />
            </div>
            {r.meetsInfiltration ? (
              <Stamp kind="ok" seal="עומד" title="עומד בדרישת 15% שטח חלחול">נדרש {fmt(r.minInfiltration)} מ"ר, קיים {fmt(r.green)} מ"ר.</Stamp>
            ) : (
              <Stamp kind="no" seal="חסר" title="לא עומד בדרישת 15% שטח חלחול">
                נדרש {fmt(r.minInfiltration)} מ"ר, קיים {fmt(r.green)} מ"ר, חסרים {fmt(r.minInfiltration - r.green)} מ"ר. נדרש נספח הידרולוגיה.
              </Stamp>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>משטח</th><th>שטח, מ"ר</th><th>מקדם C</th><th>שטח אפקטיבי</th></tr></thead>
                <tbody>
                  <tr><td>גג ומבנה</td><td className="num">{fmt(r.building)}</td><td className="num">0.95</td><td className="num">{fmt(r.effRoof)}</td></tr>
                  <tr><td>ריצוף וכבישים</td><td className="num">{fmt(r.paved)}</td><td className="num">0.85</td><td className="num">{fmt(r.effPaved)}</td></tr>
                  <tr><td>שטח ירוק</td><td className="num">{fmt(r.green)}</td><td className="num">0.20</td><td className="num">{fmt(r.effGreen)}</td></tr>
                  <tr className="active"><td>סה"כ</td><td className="num">{fmt(r.plot)}</td><td className="num">{fmt(r.weightedC, 2)}</td><td className="num">{fmt(r.effective)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="grid g2">
              <div>
                <h4 style={{ fontWeight: 500, marginBottom: 8 }}>אחריות היזם</h4>
                <ul className="notes">
                  <li>ניקוז פנים המגרש והגגות</li>
                  <li>בורות חלחול בתחום המגרש ({fmt(r.pitM3, 1)} קוב)</li>
                  <li>3 תאי בקרה: לפני חיבור, ביניים וחיבור לרשת</li>
                  <li>חיבור לרשת הניקוז העירונית, נספח הידרולוגי, תכנית בקנ"מ 1:250</li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontWeight: 500, marginBottom: 8 }}>אחריות הרשות</h4>
                <ul className="notes">
                  <li>תחזוקת רשת הניקוז הראשית, ניקוז כבישים ומדרכות ציבוריים</li>
                  <li>תא חיבור ברשת העירונית</li>
                  {r.municipal && <li>סיוע בתכנון למגרשים מעל 2 דונם</li>}
                  <li>אישור תכנית הניקוז ופיקוח על הביצוע</li>
                </ul>
              </div>
            </div>
            <Steps steps={r.steps} limits="עוצמת גשם 120 מ״מ לשעה היא ערך אופייני לאשדוד. תכנון בפועל דורש חישוב הידרולוגי של מהנדס ותיאום עם אגף הניקוז." />
          </>
        )}
      </Reveal>
    </div>
  );
}

/* ---------------- שטח ירוק ---------------- */
export function GreenTool() {
  const p = useProject();
  const k = useK();
  const r = calcGreen(p.plot, p.footprint, p.units, k);
  return (
    <div className="stack" data-tool="green">
      <div className="grid g3">
        <NumField label='שטח מגרש (מ"ר)' value={p.plot} onChange={(plot) => updateProject({ plot })} linked testId="plot" />
        <NumField label='תכסית מבנה (מ"ר)' value={p.footprint} onChange={(footprint) => updateProject({ footprint })} linked testId="footprint" />
        <NumField label="מספר יח״ד" value={p.units} onChange={(units) => updateProject({ units })} linked testId="units" />
      </div>
      {!r && <Empty>הזינו שטח מגרש כדי לחשב שטח ירוק, עצים והצללה.</Empty>}
      <Reveal show={!!r}>
        {r && (
          <>
            {r.meets ? (
              <Stamp kind="ok" seal="עומד" title="המגרש עומד בדרישת השטח הירוק המינימלי">שטח פתוח {fmt(r.open)} מ"ר ({fmt(r.openPct, 1)}%), דרישה {fmt(r.minGreen)} מ"ר.</Stamp>
            ) : (
              <Stamp kind="no" seal="חסר" title="המגרש אינו עומד בדרישת 15% שטח ירוק">שטח פתוח {fmt(r.open)} מ"ר בלבד, נדרש {fmt(r.minGreen)} מ"ר.</Stamp>
            )}
            <div className="grid g4">
              <Metric hero v={fmt(r.minGreen)} u='מ"ר' k="שטח ירוק וחלחול נדרש" n="15% מהמגרש, לא מעל מרתף" />
              <Metric v={r.trees} k="עצים בוגרים" n="הגבוה מבין ירוק והצללה" tone="fern" />
              <Metric v={fmt(r.shade)} u='מ"ר' k="הצללה נדרשת" n="30% מהשטח המשותף" tone="amber" />
              <Metric v={fmt(r.shadeFromTrees)} u='מ"ר' k="הצללה מעצים" n="30 מ״ר לעץ" tone="moss" />
            </div>
            <SitePlan plot={r.plot} footprint={r.building} green={Math.min(r.open, r.minGreen)} trees={r.trees} minGreen={r.minGreen} />
            <StackBar label="חלוקת השטח הירוק המומלצת" unit='מ"ר' segments={[{ label: "ערוגות נוי ושיחים", value: r.ornamental, shade: 3 }, { label: "דשא וכיסוי קרקע", value: r.lawn, shade: 1 }]} />
            <div className="grid g3">
              <div><h4 style={{ fontWeight: 500, marginBottom: 8 }}>נכלל בחלחול</h4><ul className="notes"><li>ערוגות על קרקע טבעית</li><li>מדשאות ללא ריצוף תחתי</li><li>גינות גג בעומק קרקע 60 ס"מ לפחות</li></ul></div>
              <div><h4 style={{ fontWeight: 500, marginBottom: 8 }}>לא נכלל</h4><ul className="notes"><li>שטח מעל מרתפי חניה</li><li>משטחים מרוצפים</li><li>אדניות ועציצים</li></ul></div>
              <div><h4 style={{ fontWeight: 500, marginBottom: 8 }}>מרחקי נטיעת עצים</h4><ul className="notes"><li>2 מ' מקיר מבנה, 1 מ' מגדר</li><li>2.5 מ' מקו תשתית</li><li>4 מ' מעץ סמוך</li></ul></div>
            </div>
            <Steps steps={r.steps} limits="הערכת שטח חניה: 25 מ״ר ליח״ד. החלוקה 40/60 בין ערוגות לדשא היא המלצה לתכנון ראשוני." />
          </>
        )}
      </Reveal>
    </div>
  );
}

/* ---------------- מים ---------------- */
export function WaterTool() {
  const p = useProject();
  const k = useK();
  const r = calcWater(p.plot, p.footprint, p.irrigation, p.water, k);
  const setEntry = (id: string, patch: Partial<(typeof p.water)[number]>) => updateProject({ water: p.water.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  return (
    <div className="stack" data-tool="water">
      <div className="grid g3">
        <NumField label='שטח מגרש (מ"ר)' value={p.plot} onChange={(plot) => updateProject({ plot })} linked testId="plot" />
        <NumField label='תכסית בינוי (מ"ר)' value={p.footprint} onChange={(footprint) => updateProject({ footprint })} linked testId="footprint" />
        <label className="field">
          <span>סוג צמחייה והשקיה</span>
          <select className="input" value={p.irrigation} onChange={(e) => updateProject({ irrigation: e.target.value })}>
            {Object.entries(irrigationRates).map(([kk, v]) => <option key={kk} value={kk}>{v.label}, {k[`wt.irr.${kk}`]} מ"ק למ"ר בשנה</option>)}
          </select>
        </label>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {p.water.map((e, i) => {
          const c = { ...waterUses[e.type], perUnit: e.type === "residential" ? k["wt.personsPerUnit"] : waterUses[e.type].perUnit, description: `${k[`wt.${e.type}`]} ליטר ליום` };
          return (
            <div key={e.id} className="grid g4" style={{ alignItems: "end", padding: 12, background: "var(--paper)", border: "1px solid var(--rule)" }}>
              <label className="field">
                <span>ייעוד {i + 1}</span>
                <select className="input" value={e.type} onChange={(ev) => setEntry(e.id, { type: ev.target.value })}>
                  {Object.entries(waterUses).map(([kk, v]) => <option key={kk} value={kk}>{v.label}</option>)}
                </select>
              </label>
              <NumField label={`כמות, ${c.unitLabel}`} value={e.units} onChange={(units) => setEntry(e.id, { units })} hint={c.description} testId={`water-units-${i}`} />
              <NumField label="נפשות, לא חובה" value={e.residents} onChange={(residents) => setEntry(e.id, { residents })} placeholder={`${c.perUnit} ליחידה`} />
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn sm danger" disabled={p.water.length <= 1} onClick={() => updateProject({ water: p.water.filter((x) => x.id !== e.id) })}>הסרה</button>
              </div>
            </div>
          );
        })}
        <button type="button" className="btn" onClick={() => updateProject({ water: [...p.water, { id: uid(), type: "commercial", units: "", residents: "" }] })}>הוספת ייעוד</button>
      </div>
      {!r && <Empty>הזינו שטח מגרש וכמות לפחות בייעוד אחד.</Empty>}
      <Reveal show={!!r}>
        {r && (
          <>
            <div className="grid g4">
              <Metric hero v={fmt(r.total)} u='מ"ק' k="צריכה שנתית כוללת" />
              <Metric v={fmt(r.domestic)} u='מ"ק' k="סניטרי בשנה" tone="lagoon" />
              <Metric v={fmt(r.irrigationM3)} u='מ"ק' k="השקיה בשנה" n={`${fmt(r.open)} מ״ר × ${r.rate}`} tone="fern" />
              <Metric v={<span className="ltr">{r.pipe}</span>} k="קוטר צינור מומלץ" n={`${fmt(r.peakLps, 2)} ל'/ש' בשיא`} tone="tide" />
            </div>
            <StackBar label="צריכה שנתית: סניטרי מול השקיה" unit='מ"ק' segments={[...r.rows.filter((x) => x.annual > 0).map((x, i) => ({ label: x.config.label, value: x.annual, shade: ([4, 3, 2] as const)[i % 3] })), { label: "השקיה", value: r.irrigationM3, shade: 1 }]} />
            <Steps steps={r.steps} limits="מבוסס על תקני צריכה מקובלים. הערכים עשויים להשתנות לפי דרישות תאגיד יובלים. קוטר הצינור הוא אומדן ראשוני ונדרש חישוב הידראולי מפורט." />
          </>
        )}
      </Reveal>
    </div>
  );
}

const shell = (id: string, T: () => JSX.Element) => () => <ToolShell id={id}><T /></ToolShell>;

export const toolComponents: Record<ToolId, () => JSX.Element> = {
  parking: shell("parking", ParkingTool),
  fee: shell("fee", FeeTool),
  waste: shell("waste", WasteTool),
  drainage: shell("drainage", DrainageTool),
  green: shell("green", GreenTool),
  water: shell("water", WaterTool),
  program: shell("program", ProgramTool),
  levies: shell("levies", LeviesTool),
  devob: shell("devob", DevObligationTool),
  mamad: shell("mamad", MamadTool),
  fireAccess: shell("fireAccess", FireAccessTool),
};
