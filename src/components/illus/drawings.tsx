// שרטוטים סכמטיים לכל סעיף. שפה אחת: קו מגרש מקווקו, מבנה באפור כהה, ירוק מחלחל בקווקו,
// מספרים בעיגול בצבע הפרק שתואמים את מספרי הרשימה. השרטוטים להמחשה בלבד, לא בקנה מידה.
import { createContext, useContext, type ReactNode } from "react";

export const ActiveCtx = createContext<number | null>(null);

export function C({ n, x, y }: { n: number; x: number; y: number }) {
  const active = useContext(ActiveCtx);
  const on = active === n;
  return (
    <g className={`callout ${on ? "on" : ""} ${active !== null && !on ? "dim" : ""}`} transform={`translate(${x} ${y})`}>
      {on && <circle r="16" className="callout-pulse" />}
      <circle r="10" />
      <text y="4" textAnchor="middle">{n}</text>
    </g>
  );
}

const T = ({ x, y, children, a = "middle", s = 10 }: { x: number; y: number; children: ReactNode; a?: "start" | "middle" | "end"; s?: number }) => (
  <text x={x} y={y} textAnchor={a} className="dt" style={{ fontSize: s }}>{children}</text>
);

/** קו מידה עם טקסט */
const Dim = ({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) => (
  <g className="dim">
    <line x1={x1} y1={y1} x2={x2} y2={y2} />
    <line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} transform={`rotate(${x1 === x2 ? 90 : 0} ${x1} ${y1})`} />
    <line x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} transform={`rotate(${x1 === x2 ? 90 : 0} ${x2} ${y2})`} />
    <text x={(x1 + x2) / 2 + (x1 === x2 ? 6 : 0)} y={(y1 + y2) / 2 - (x1 === x2 ? 0 : 4)} textAnchor={x1 === x2 ? "start" : "middle"}>{label}</text>
  </g>
);

const Defs = () => (
  <defs>
    <pattern id="h-green" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" className="f-green" />
      <line x1="0" y1="0" x2="0" y2="6" className="s-green" />
    </pattern>
    <pattern id="h-earth" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" className="f-earth" />
      <circle cx="2" cy="2" r="0.8" className="f-earth-dot" />
      <circle cx="6" cy="6" r="0.8" className="f-earth-dot" />
    </pattern>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" className="f-tone" />
    </marker>
  </defs>
);

const Svg = ({ w = 400, h = 300, children }: { w?: number; h?: number; children: ReactNode }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className="drawing" role="img">
    <Defs />
    {children}
  </svg>
);

const Plot = ({ x = 30, y = 30, w = 340, h = 240 }) => <rect x={x} y={y} width={w} height={h} className="plot" />;
const Street = ({ y = 276, label = "רחוב" }) => (
  <g>
    <rect x="0" y={y} width="400" height="24" className="street" />
    <line x1="0" x2="400" y1={y + 12} y2={y + 12} className="street-mark" />
    <T x={380} y={y + 16} a="end" s={9}>{label}</T>
  </g>
);

/* ---------------- רישוי ---------------- */
const Review = () => (
  <Svg h={240}>
    {["חוק ותקנות", "מדיניות הוועדה", "הנחיות מרחביות", "תכניות חלות"].map((t, i) => (
      <g key={t}>
        <rect x={20 + i * 95} y={30} width={80} height={44} className="box" />
        <T x={60 + i * 95} y={56}>{t}</T>
        <line x1={60 + i * 95} y1={74} x2={200} y2={140} className="flow" markerEnd="url(#arr)" />
      </g>
    ))}
    <rect x={130} y={140} width={140} height={46} className="box tone" />
    <T x={200} y={168} s={12}>בדיקת הבקשה</T>
    <line x1={200} y1={186} x2={200} y2={214} className="flow" markerEnd="url(#arr)" />
    <T x={200} y={230}>החלטת רשות הרישוי</T>
  </Svg>
);

const SheetPlan = () => (
  <Svg>
    <rect x="10" y="10" width="380" height="280" className="sheet-frame" />
    {/* טבלת שטחים */}
    <rect x="290" y="20" width="90" height="70" className="box" />
    {[0, 1, 2, 3].map((i) => <line key={i} x1="290" x2="380" y1={34 + i * 14} y2={34 + i * 14} className="thin" />)}
    <T x={335} y={30} s={8}>טבלת שטחים</T>
    {/* תנוחת קומה */}
    <rect x="30" y="30" width="230" height="150" className="wall-fill" />
    <rect x="38" y="38" width="214" height="134" className="room" />
    <line x1="140" y1="38" x2="140" y2="172" className="wall" />
    <line x1="38" y1="110" x2="140" y2="110" className="wall" />
    {/* ממ"ד */}
    <rect x="190" y="120" width="56" height="46" className="mamad" />
    <T x={218} y={147} s={8}>ממ"ד</T>
    {/* עמודים */}
    {[[38, 38], [140, 38], [252, 38], [38, 172], [140, 172], [252, 172]].map(([x, y], i) => <rect key={i} x={x - 4} y={y - 4} width="8" height="8" className="column" />)}
    {/* קבועות */}
    <circle cx="70" cy="135" r="7" className="fixture" /><rect x="90" y="128" width="20" height="14" className="fixture" />
    {/* פיר וארובה */}
    <rect x="148" y="46" width="18" height="18" className="shaft" /><line x1="148" y1="46" x2="166" y2="64" className="thin" />
    {/* מעבי מזגן */}
    {[0, 1, 2].map((i) => <rect key={i} x={262} y={60 + i * 18} width="14" height="12" className="ac" />)}
    {/* רמפה נגישות */}
    <path d="M30 196h70l0 18h-70z" className="ramp" /><path d="M36 205h58" className="thin" markerEnd="url(#arr)" />
    {/* חתך וחזית */}
    <g transform="translate(150 196)">
      <rect width="100" height="80" className="box" /><path d="M10 70h80M10 50h80M10 30h80M10 10h80" className="thin" /><T x={50} y={-4} s={8}>חתך</T>
    </g>
    <g transform="translate(270 196)">
      <rect width="100" height="80" className="box" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={12 + c * 30} y={10 + r * 22} width="16" height="12" className="window" />))}
      <T x={50} y={-4} s={8}>חזית</T>
    </g>
    <C n={1} x={335} y={100} /><C n={2} x={95} y={80} /><C n={3} x={200} y={290} /><C n={4} x={80} y={155} />
    <C n={5} x={22} y={38} /><C n={6} x={285} y={115} /><C n={7} x={176} y={55} /><C n={8} x={65} y={228} /><C n={9} x={218} y={110} />
  </Svg>
);

const SheetSection = () => (
  <Svg h={260}>
    <rect x="0" y="210" width="400" height="50" fill="url(#h-earth)" />
    <line x1="0" x2="400" y1="210" y2="210" className="ground" />
    <rect x="90" y="40" width="200" height="200" className="wall-fill" />
    {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="90" x2="290" y1={40 + i * 42} y2={40 + i * 42} className="slab-line" />)}
    <rect x="96" y="210" width="188" height="26" className="room" /><T x={190} y={227} s={8}>מרתף</T>
    <rect x="250" y="20" width="16" height="20" className="shaft" />
    <rect x="200" y="28" width="30" height="12" className="ac" />
    <Dim x1={310} y1={40} x2={310} y2={210} label="גובה" />
    <T x={70} y={214} a="end" s={9}>±0.00</T>
    <C n={3} x={60} y={120} /><C n={6} x={215} y={18} /><C n={7} x={258} y={10} /><C n={5} x={90} y={250} />
  </Svg>
);

/* ---------------- פיקוח ---------------- */
const Lifecycle = () => (
  <Svg h={200}>
    {["היתר", "טופס 2", "ביצוע ופיקוח", "תעודת גמר", "טאבו"].map((t, i) => (
      <g key={t}>
        <rect x={12 + i * 78} y={70} width={66} height={50} className={`box ${i === 1 || i === 3 ? "tone" : ""}`} />
        <T x={45 + i * 78} y={99}>{t}</T>
        {i < 4 && <line x1={78 + i * 78} y1={95} x2={90 + i * 78} y2={95} className="flow" markerEnd="url(#arr)" />}
      </g>
    ))}
    <T x={200} y={160} s={9}>עבירות בנייה, שימושים חורגים וצווים: לאורך כל הדרך</T>
    <line x1="20" x2="380" y1="145" y2="145" className="thin dashed" />
    <C n={1} x={45} y={55} /><C n={2} x={123} y={55} /><C n={3} x={201} y={140} /><C n={4} x={201} y={55} /><C n={5} x={279} y={55} /><C n={6} x={357} y={55} />
  </Svg>
);

const SiteOrg = () => (
  <Svg>
    <Street />
    <rect x="30" y="30" width="340" height="240" className="fence" />
    <rect x="120" y="80" width="160" height="120" className="wall-fill pending" />
    <T x={200} y={145}>מבנה בביצוע</T>
    <rect x="300" y="200" width="56" height="56" className="box" /><T x={328} y={232} s={8}>אחסון</T>
    <rect x="44" y="200" width="56" height="40" className="box" /><T x={72} y={224} s={8}>משרד אתר</T>
    <circle cx="250" cy="70" r="70" className="radius" /><rect x="244" y="64" width="12" height="12" className="column" />
    <rect x="170" y="266" width="60" height="8" className="gate" /><T x={200} y={262} s={8}>שער</T>
    <C n={1} x={30} y={140} /><C n={2} x={328} y={190} /><C n={3} x={250} y={150} />
  </Svg>
);

/* ---------------- כבישים ---------------- */
const Development = () => (
  <Svg>
    <Street label="מדרכה ורחוב" />
    <rect x="0" y="262" width="400" height="14" className="sidewalk" />
    <Plot />
    <rect x="0" y="30" width="30" height="240" className="neighbor" /><rect x="370" y="30" width="30" height="240" className="neighbor" />
    <rect x="110" y="60" width="180" height="120" className="wall-fill" />
    <T x={200} y={125} s={11}>±0.00</T>
    <rect x="40" y="40" width="50" height="220" fill="url(#h-green)" />
    {[60, 110, 160, 210].map((y) => <circle key={y} cx="65" cy={y} r="9" className="tree" />)}
    <rect x="300" y="200" width="60" height="62" className="paving" />
    <path d="M150 260 L150 190 M250 260 L250 190" className="thin" />
    <path d="M200 240 L200 268" className="flow" markerEnd="url(#arr)" />
    <rect x="310" y="40" width="20" height="16" className="bin" />
    <T x={130} y={205} s={8}>+0.15</T><T x={270} y={205} s={8}>+0.10</T>
    <circle cx="96" cy="250" r="5" className="valve" />
    <rect x="340" y="10" width="44" height="16" className="stamp-box" /><T x={362} y={22} s={7}>אדר' נוף</T>
    <C n={1} x={362} y={40} /><C n={2} x={20} y={20} /><C n={3} x={330} y={286} /><C n={4} x={200} y={145} /><C n={5} x={130} y={218} />
    <C n={6} x={215} y={250} /><C n={7} x={320} y={70} /><C n={8} x={30} y={150} /><C n={9} x={96} y={235} /><C n={10} x={65} y={80} />
  </Svg>
);

const ParkingPlan = () => (
  <Svg>
    <Street label="רחוב מקומי" />
    <Plot />
    {Array.from({ length: 10 }, (_, i) => (
      <g key={i}>
        <rect x={50 + i * 30} y={50} width={26} height={50} className={`stall ${i === 0 ? "acc" : ""} ${i >= 7 ? "ev" : ""}`} />
        {i >= 7 && <path d={`M${63 + i * 30} 62l-4 8h5l-3 8`} className="bolt" />}
      </g>
    ))}
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={50 + i * 30} y={170} width={26} height={50} className="stall" />)}
    <path d="M50 100h300v70H50z" className="aisle" />
    <path d="M200 268V140" className="flow" markerEnd="url(#arr)" />
    <rect x="180" y="250" width="40" height="22" className="gate" />
    <path d="M140 270 L180 250 M260 270 L220 250" className="sight" />
    <path d="M140 270L180 250L180 270Z M260 270L220 250L220 270Z" className="sight-fill" />
    <rect x="300" y="230" width="50" height="34" className="box" /><T x={325} y={250} s={7}>מסחר</T>
    <C n={1} x={140} y={40} /><C n={2} x={63} y={115} /><C n={3} x={300} y={40} /><C n={4} x={325} y={220} /><C n={5} x={100} y={235} /><C n={6} x={200} y={240} /><C n={7} x={30} y={288} /><C n={8} x={160} y={288} />
  </Svg>
);

const ParkingSection = () => (
  <Svg h={200}>
    <line x1="0" x2="400" y1="150" y2="150" className="ground" />
    <rect x="0" y="150" width="400" height="50" fill="url(#h-earth)" />
    <rect x="120" y="110" width="12" height="40" className="wall-fill" />
    <Dim x1={140} y1={110} x2={140} y2={150} label="עד 0.6 מ'" />
    <path d="M40 120 L360 120" className="sight" />
    <circle cx="40" cy="120" r="5" className="f-tone" /><T x={40} y={108} s={9}>עין הנהג</T>
    <rect x="300" y="122" width="50" height="22" className="car" />
    <C n={8} x={126} y={90} />
  </Svg>
);

/* ---------------- ניקוז ---------------- */
const DrainagePlan = () => (
  <Svg>
    <Street label="רשת ניקוז עירונית" />
    <Plot />
    <rect x="120" y="60" width="170" height="120" className="wall-fill" />
    <rect x="40" y="200" width="70" height="60" fill="url(#h-green)" />
    <circle cx="75" cy="230" r="16" className="pit" /><T x={75} y={234} s={8}>בור</T>
    <path d="M205 180 V220 H75 M205 220 V262 H205" className="pipe" />
    {[[205, 220], [205, 250], [205, 286]].map(([x, y], i) => <rect key={i} x={x - 7} y={y - 7} width="14" height="14" className="chamber" />)}
    <T x={230} y={224} a="start" s={8}>Ø160</T><T x={230} y={254} a="start" s={8}>Ø200</T>
    <C n={1} x={20} y={20} /><C n={2} x={150} y={208} /><C n={3} x={185} y={250} /><C n={4} x={250} y={286} /><C n={5} x={250} y={226} /><C n={6} x={75} y={196} />
  </Svg>
);

const DrainageSection = () => (
  <Svg h={240}>
    <rect x="0" y="60" width="400" height="180" fill="url(#h-earth)" />
    <line x1="0" x2="400" y1="60" y2="60" className="ground" />
    <rect x="60" y="80" width="80" height="120" className="pit-sec" />
    {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={75 + (i % 3) * 25} cy={110 + Math.floor(i / 3) * 40} r="7" className="gravel" />)}
    <path d="M140 90 H300" className="pipe" />
    <rect x="300" y="60" width="30" height="60" className="chamber-sec" />
    <path d="M100 200 v20 M80 200 v14 M120 200 v14" className="infil" />
    <T x={100} y={50} s={9}>בור חלחול</T><T x={315} y={50} s={9}>תא בקרה</T>
    <Dim x1={160} y1={80} x2={160} y2={200} label="עומק לפי סוג קרקע" />
    <C n={6} x={100} y={150} /><C n={5} x={345} y={90} />
  </Svg>
);

const Runoff = () => (
  <Svg h={220}>
    <rect x="0" y="150" width="400" height="70" fill="url(#h-earth)" />
    <path d="M0 140 L260 150 L400 150" className="ground" />
    <rect x="40" y="60" width="120" height="82" className="wall-fill" />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${60 + i * 25} 20 l-6 14`} className="rain" />)}
    <path d="M165 145 Q220 150 280 152" className="flow" markerEnd="url(#arr)" />
    <rect x="290" y="146" width="20" height="10" className="chamber" />
    <T x={300} y={140} s={9}>כניסה למגרש</T>
    <C n={1} x={220} y={130} /><C n={2} x={300} y={175} />
  </Svg>
);

/* ---------------- נטיעות ---------------- */
const PlantingPlan = () => (
  <Svg>
    <rect x="20" y="20" width="140" height="120" className="wall-fill" />
    <rect x="0" y="250" width="400" height="30" className="sidewalk" />
    <circle cx="240" cy="110" r="40" className="canopy" /><circle cx="240" cy="110" r="5" className="trunk" />
    <Dim x1={160} y1={110} x2={240} y2={110} label="3 מ' ממבנה" />
    <Dim x1={240} y1={150} x2={240} y2={250} label="2 מ' ממדרכה" />
    <rect x="340" y="40" width="10" height="10" className="column" /><T x={345} y={34} s={8}>תאורה</T>
    <Dim x1={250} y1={60} x2={345} y2={60} label="4 מ'" />
    <path d="M0 200 H400" className="pipe" /><T x={390} y={194} a="end" s={8}>ביוב: 4 מ'</T>
    <rect x="200" y="160" width="80" height="40" className="pit-outline" /><T x={240} y={184} s={8}>200×100</T>
    <circle cx="300" cy="140" r="4" className="valve" />
    <C n={1} x={200} y={80} /><C n={2} x={290} y={175} /><C n={3} x={312} y={140} />
  </Svg>
);

const PlantingSection = () => (
  <Svg h={240}>
    <rect x="0" y="80" width="400" height="160" fill="url(#h-earth)" />
    <line x1="0" x2="400" y1="80" y2="80" className="ground" />
    <rect x="130" y="80" width="140" height="100" className="topsoil" />
    <path d="M200 80 V20" className="trunk-line" /><circle cx="200" cy="20" r="30" className="canopy" />
    <path d="M200 80 q-30 40 -50 70 M200 80 q30 40 50 70 M200 80 v80" className="roots" />
    <Dim x1={130} y1={200} x2={270} y2={200} label="200 ס״מ" />
    <Dim x1={290} y1={80} x2={290} y2={180} label="100 ס״מ" />
    <T x={200} y={130} s={9}>אדמת גן + 50 ל' קומפוסט</T>
    <path d="M150 76 h100" className="drip" />
    <C n={2} x={110} y={130} /><C n={3} x={260} y={70} />
  </Svg>
);

/* ---------------- חשמל ---------------- */
const ElectricPlan = () => (
  <Svg>
    <Street />
    <Plot />
    <rect x="110" y="60" width="180" height="130" className="wall-fill" />
    <rect x="300" y="60" width="54" height="40" className="trafo" /><T x={327} y={84} s={8}>שנאים</T>
    {[50, 130, 210, 290, 350].map((x) => <g key={x}><circle cx={x} cy="240" r="5" className="lamp" /><circle cx={x} cy="240" r="16" className="lamp-glow" /></g>)}
    {[0, 1, 2, 3].map((i) => <rect key={i} x={120 + i * 40} y={210} width="30" height="20" className="stall ev" />)}
    <circle cx="327" cy="80" r="40" className="radius" />
    <rect x="150" y="190" width="100" height="6" className="cable" />
    <C n={1} x={50} y={220} /><C n={2} x={370} y={80} /><C n={3} x={327} y={50} /><C n={4} x={200} y={250} /><C n={5} x={200} y={176} />
  </Svg>
);

const HeightSection = () => (
  <Svg h={300}>
    <line x1="0" x2="400" y1="270" y2="270" className="ground" />
    <rect x="80" y="30" width="110" height="240" className="wall-fill" />
    {Array.from({ length: 10 }, (_, i) => <line key={i} x1="80" x2="190" y1={270 - i * 24} y2={270 - i * 24} className="slab-line" />)}
    <rect x="160" y="40" width="22" height="230" className="stair" />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx="171" cy={258 - i * 24} r="3" className="lamp" />)}
    <line x1="60" x2="220" y1="62" y2="62" className="threshold" /><T x={225} y={66} a="start" s={10}>29 מ'</T>
    <rect x="230" y="240" width="50" height="30" className="trafo" /><T x={255} y={259} s={8}>גנרטור</T>
    <rect x="300" y="250" width="40" height="20" className="box" /><T x={320} y={264} s={7}>שם רחוב</T>
    <C n={1} x={40} y={62} /><C n={5} x={171} y={20} /><C n={3} x={320} y={235} /><C n={2} x={255} y={225} />
  </Svg>
);

/* ---------------- תברואה ---------------- */
const WastePlan = () => (
  <Svg>
    <Street label="רחוב, נתיב פינוי" />
    <Plot />
    <rect x="150" y="50" width="200" height="140" className="wall-fill" />
    <rect x="160" y="150" width="60" height="36" className="wasteroom" /><T x={190} y={172} s={8}>חדר אשפה</T>
    <circle cx="70" cy="230" r="14" className="tamun" /><circle cx="105" cy="230" r="14" className="tamun dry" />
    <rect x="40" y="280" width="90" height="16" className="truck" /><T x={85} y={292} s={8}>משאית</T>
    <Dim x1={85} y1={280} x2={85} y2={244} label="עד 5 מ'" />
    <Dim x1={120} y1={210} x2={150} y2={160} label="10 מ'+" />
    <C n={1} x={250} y={110} /><C n={5} x={88} y={205} /><C n={6} x={230} y={190} /><C n={7} x={150} y={288} /><C n={8} x={40} y={255} />
  </Svg>
);

const WasteSection = () => (
  <Svg h={220}>
    <rect x="0" y="80" width="400" height="140" fill="url(#h-earth)" />
    <line x1="0" x2="400" y1="80" y2="80" className="ground" />
    <rect x="140" y="80" width="80" height="100" className="tamun-sec" />
    <rect x="160" y="58" width="40" height="22" className="tamun-top" />
    <path d="M150 170 h60" className="thin" /><T x={180} y={130} s={9}>5 קוב</T>
    <Dim x1={240} y1={80} x2={240} y2={180} label="טמון" />
    <C n={5} x={180} y={40} />
  </Svg>
);

/* ---------------- מים ---------------- */
const WaterPlan = () => (
  <Svg>
    <Street label="קו מים וביוב עירוני" />
    <Plot />
    <rect x="120" y="60" width="170" height="130" className="wall-fill" />
    <path d="M80 288 V230 H180 V190" className="pipe water" />
    <rect x="72" y="240" width="16" height="16" className="meter" />
    <path d="M260 190 V230 H330 V288" className="pipe sewer" />
    {[[260, 230], [330, 230], [330, 270]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" className="manhole" />)}
    <T x={100} y={226} s={8}>מים</T><T x={300} y={222} s={8}>ביוב</T>
    <C n={2} x={20} y={20} /><C n={3} x={150} y={215} /><C n={4} x={60} y={248} /><C n={6} x={350} y={250} /><C n={7} x={300} y={240} />
  </Svg>
);

const WaterSection = () => (
  <Svg h={220}>
    <rect x="0" y="70" width="400" height="150" fill="url(#h-earth)" />
    <line x1="0" x2="400" y1="70" y2="70" className="ground" />
    <rect x="30" y="20" width="80" height="50" className="wall-fill" />
    <path d="M110 110 L370 150" className="pipe sewer" />
    {[[180, 70, 121], [280, 70, 136], [360, 70, 148]].map(([x, y, b], i) => <rect key={i} x={x - 8} y={y} width="16" height={b - y + 6} className="chamber-sec" />)}
    <T x={240} y={110} s={9}>שיפוע</T>
    <C n={7} x={240} y={170} />
  </Svg>
);

/* ---------------- סביבה ---------------- */
const EnvSection = () => (
  <Svg h={260}>
    <rect x="0" y="140" width="400" height="120" fill="url(#h-earth)" />
    <line x1="0" x2="400" y1="140" y2="140" className="ground" />
    <rect x="140" y="40" width="130" height="100" className="wall-fill" />
    <rect x="40" y="100" width="70" height="40" className="asbestos" /><T x={75} y={124} s={8}>אסבסט</T>
    <path d="M60 150 v60 M80 150 v80 M100 150 v50" className="probe" />
    <T x={80} y={250} s={8}>דיגום קרקע</T>
    <rect x="290" y="110" width="50" height="30" className="trafo" /><path d="M345 115 q10 10 0 20 M352 110 q16 15 0 30" className="wave" />
    <rect x="300" y="140" width="90" height="10" fill="url(#h-green)" /><path d="M320 150 v20 M345 150 v26 M370 150 v20" className="infil" />
    <T x={345} y={196} s={8}>15% מחלחל</T>
    <C n={1} x={75} y={180} /><C n={3} x={315} y={95} /><C n={5} x={75} y={88} /><C n={6} x={345} y={215} />
  </Svg>
);


/* ---------------- כבאות ---------------- */
const FirePlan = () => (
  <Svg>
    <rect x="0" y="236" width="400" height="44" className="street" />
    <Dim x1={390} y1={236} x2={390} y2={280} label="4 מ'" />
    <rect x="70" y="30" width="230" height="120" className="wall-fill" />
    <rect x="150" y="146" width="40" height="7" className="window" /><T x={170} y={142} s={8}>חלון חילוץ</T>
    <rect x="110" y="180" width="140" height="50" className="staging" /><T x={180} y={209} s={10}>רחבה 6×12 מ'</T>
    <Dim x1={60} y1={150} x2={60} y2={180} label="≤6 מ'" />
    <circle cx="330" cy="200" r="8" className="hydrant" /><T x={330} y={222} s={8}>ברז</T>
    <path d="M322 196 L290 150" className="flow" strokeDasharray="4 3" />
    <rect x="290" y="146" width="16" height="6" className="gate" /><T x={298} y={140} s={8}>כניסה</T>
    <circle cx="20" cy="258" r="6" className="hydrant" /><path d="M26 258 H120" className="thin dashed" /><T x={70} y={252} s={8}>≤120 מ'</T>
    <rect x="120" y="190" width="70" height="30" className="truck" rx="2" />
    <C n={1} x={360} y={258} /><C n={2} x={250} y={190} /><C n={3} x={40} y={165} /><C n={4} x={350} y={180} /><C n={5} x={70} y={270} /><C n={6} x={110} y={235} />
  </Svg>
);

/* ---------------- ממ"ד ---------------- */
const MamadPlan = () => (
  <Svg>
    <rect x="80" y="40" width="240" height="200" className="wall-fill" />
    <rect x="105" y="65" width="190" height="150" className="room" />
    <T x={200} y={135} s={13}>9 מ"ר נטו</T><T x={200} y={152} s={9}>לפחות</T>
    <rect x="170" y="36" width="60" height="30" className="window" /><T x={200} y={30} s={8}>חלון הדף</T>
    <rect x="250" y="212" width="40" height="30" className="door" /><T x={270} y={256} s={8}>דלת הדף</T>
    <rect x="108" y="68" width="22" height="14" className="filter" /><T x={140} y={79} a="start" s={8}>סינון</T>
    <Dim x1={105} y1={225} x2={295} y2={225} label="אורך נטו" />
    <Dim x1={60} y1={65} x2={60} y2={215} label="רוחב" />
    <Dim x1={300} y1={128} x2={322} y2={128} label="25 ס״מ" />
    <C n={1} x={200} y={175} /><C n={3} x={335} y={100} /><C n={5} x={245} y={30} /><C n={6} x={300} y={250} /><C n={7} x={120} y={100} />
  </Svg>
);

const MamadSection = () => (
  <Svg h={260}>
    <rect x="80" y="30" width="240" height="210" className="wall-fill" />
    <rect x="105" y="50" width="190" height="170" className="room" />
    <Dim x1={315} y1={50} x2={315} y2={220} label="גובה" />
    <T x={200} y={135} s={13}>22.5 מ"ק לפחות</T>
    <rect x="105" y="30" width="190" height="20" className="slab-fill" /><T x={200} y={44} s={8} >תקרה</T>
    <C n={2} x={200} y={160} /><C n={4} x={345} y={135} />
  </Svg>
);

/* ---------------- יובלים ---------------- */
const Yuvallim = () => (
  <Svg h={230}>
    {["חוות דעת ומפת GIS", "חיבור זמני", "מד לבנייה", "חשבון לקוח", "מז\"ח", "דמי הקמה וגמר"].map((t, i) => {
      const x = 10 + (i % 3) * 130, y = i < 3 ? 30 : 140;
      return (
        <g key={t}>
          <rect x={x} y={y} width={115} height={50} className={`box ${i === 4 ? "tone" : ""}`} />
          <T x={x + 57} y={y + 30} s={10}>{t}</T>
          {i % 3 < 2 && <line x1={x + 115} y1={y + 25} x2={x + 128} y2={y + 25} className="flow" markerEnd="url(#arr)" />}
          <C n={i + 1} x={x + 8} y={y - 2} />
        </g>
      );
    })}
    <path d="M330 80 V110 H67 V138" className="flow" fill="none" markerEnd="url(#arr)" />
  </Svg>
);

export interface Illus {
  title: string;
  views: { id: "plan" | "section" | "axo"; label: string; Draw: () => JSX.Element }[];
}

const plan = (Draw: () => JSX.Element) => ({ id: "plan" as const, label: "תכנית", Draw });
const section = (Draw: () => JSX.Element) => ({ id: "section" as const, label: "חתך", Draw });
const axo = (Draw: () => JSX.Element) => ({ id: "axo" as const, label: "תלת־ממד", Draw });

export const illustrations: Record<string, Illus> = {
  review: { title: "מסלול הבדיקה", views: [plan(Review)] },
  sheet: { title: "גיליון התכנית הראשית", views: [plan(SheetPlan), section(SheetSection), axo(SheetPlan)] },
  lifecycle: { title: "תחנות הפיקוח", views: [plan(Lifecycle)] },
  siteorg: { title: "התארגנות אתר", views: [plan(SiteOrg), axo(SiteOrg)] },
  development: { title: "תכנית פיתוח שטח", views: [plan(Development), axo(Development)] },
  parking: { title: "חניה וכניסה למגרש", views: [plan(ParkingPlan), section(ParkingSection), axo(ParkingPlan)] },
  drainage: { title: "נספח ניקוז", views: [plan(DrainagePlan), section(DrainageSection), axo(DrainagePlan)] },
  runoff: { title: "ניקוז עילי", views: [section(Runoff)] },
  planting: { title: "נטיעה ומרחקים", views: [plan(PlantingPlan), section(PlantingSection)] },
  electric: { title: "חשמל ותאורת פיתוח", views: [plan(ElectricPlan), axo(ElectricPlan)] },
  height: { title: "גובה, גנרטור ותאורת חירום", views: [section(HeightSection)] },
  waste: { title: "אצירת אשפה ופינוי", views: [plan(WastePlan), section(WasteSection), axo(WastePlan)] },
  water: { title: "נספח סניטרי", views: [plan(WaterPlan), section(WaterSection)] },
  environment: { title: "סביבה: קרקע, אסבסט, אקוסטיקה ונגר", views: [section(EnvSection)] },
  fire: { title: "גישה לרכב כיבוי", views: [plan(FirePlan), axo(FirePlan)] },
  mamad: { title: "מרחב מוגן דירתי", views: [plan(MamadPlan), section(MamadSection), axo(MamadPlan)] },
  yuvallim: { title: "תהליך מול יובלים", views: [plan(Yuvallim)] },
};
